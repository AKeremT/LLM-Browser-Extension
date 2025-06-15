from flask import Flask, request, jsonify
from llama_cpp import Llama
from flask_cors import CORS
import os
import re
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format=" %(asctime)s - %(levelname)s - %(message)s"
)

# Initialize Flask application
app = Flask(__name__)
CORS(app)

# File path for the large language model
MODEL_PATH = "./models/Llama-3.2-3B.gguf"

# Loading the large language model
llm = Llama(model_path=MODEL_PATH, n_ctx=2048, n_threads=8)
logging.info("LLM model successfully loaded.")

# Directory for saving analyses
ARCHIVE_DIR = "llm_analyses"
if not os.path.exists(ARCHIVE_DIR):
    os.makedirs(ARCHIVE_DIR)
    logging.info(f"Archive directory created: {ARCHIVE_DIR}")

def save_analysis_file(domain, website_url, content, original_text):
    """Save the semantic analysis to a text file with timestamp."""
    current_time = datetime.now()
    timestamp = current_time.strftime("%Y%m%d_%H%M%S")
    file_name = f"{domain}_analysis_{timestamp}.txt"
    file_path = os.path.join(ARCHIVE_DIR, file_name)

    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"Website URL: {website_url}\n")
            f.write(f"Analysis Date: {current_time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"LLM Analysis for {domain}:\n")
            f.write(content)
            f.write("\n\n---\n\nOriginal Text (First 3000 Characters for context):\n")
            f.write(original_text[:3000] + ("…" if len(original_text) > 3000 else ""))
        logging.info(f"Analysis successfully saved to {file_path}")
        return file_path
    except IOError as e:
        logging.error(f"Error saving file: {e}")
        raise

@app.route("/analyze", methods=["POST"])
def analyze():
    """Analyze parsed text with the large language model."""
    try:
        data = request.get_json()
        terms_text = data.get('text', '').strip()
        website_url = data.get('website_url', 'unknown_website')

        if not terms_text:
            logging.warning("Received request with missing text.")
            return jsonify({"error": "Missing 'text' in request."}), 400

        domain = re.sub(r'^(https?://)?(www\.)?', '', website_url).split('/')[0]
        safe_domain = re.sub(r'[^\w\-. ]', '_', domain)

        # Handle cases with no parsed content
        if terms_text == "No specific 'Terms and Conditions', 'Privacy Policy' or 'Policy' content found on this page.":
            llm_result = (
                "Overall Status: N/A\n"
                "Summary: No specific 'Terms and Conditions', 'Privacy Policy' or 'Policy' content was found on this page to analyze.\n"
                "Recommendation: Please navigate to the relevant legal page to perform an analysis."
            )
            try:
                file_path = save_analysis_file(safe_domain, website_url, llm_result, terms_text)
                return jsonify({ "analysis": llm_result, "message": f"No specific content found. Info saved to {file_path}" })
            except Exception as e:
                return jsonify({ "analysis": llm_result, "error": f"Could not save analysis file: {e}" }), 500

        # Prepare the prompt for semantic parsing
        prompt = f"""Analyze the following "Terms and Conditions" text. Respond in the following format:

1. Overall Status: "Safe" or "Risky"
2. Summary: Summarize the content in 2-3 sentences. If there are any risks,
   briefly explain which clauses are problematic and what rights or laws they may violate.
3. Recommendation: (Optional) A short suggestion for the user if needed.

Please use clear, concise, and user-friendly language.

Text:
\"\"\"{terms_text[:3000]}\"\"\""""    

        output = llm(prompt, max_tokens=512, stop=["</s>"], echo=False)
        llm_result = output["choices"][0]["text"].strip()

        # Save results to a text file
        try:
            file_path = save_analysis_file(safe_domain, website_url, llm_result, terms_text)
            return jsonify({ "analysis": llm_result, "message": f"Analysis saved to {file_path}" })
        except Exception as e:
            return jsonify({ "analysis": llm_result, "error": f"Could not save analysis file: {e}" }), 500

    except Exception as e:
        logging.exception("An error occurred during analysis:")
        return jsonify({"error": f"An error occurred during analysis: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(port=5000, debug=True)
