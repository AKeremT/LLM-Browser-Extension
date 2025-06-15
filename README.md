LLM BROWSER EXTENSION
📝 Project Description
This project serves as a prototype for my Bachelor's Thesis.
It utilizes a Flask application alongside a GGUF-formatted language model to provide a text processing API (such as text generation or classification).

⚙ How It Works
The application is powered by Flask and a GGUF language model.
It handles requests by processing the input text and generating a response.

Key components:

app.py: The main application file that runs the Flask server.

requirements.txt: List of required dependencies.

models/: The directory where the GGUF language model should be placed.

templates/: Stores files related to the UI if implemented in the future.

📁 How to Add the GGUF Model
The GGUF format language model is not included in this repository due to its large size.
Instead, you can find and download the model from Hugging Face Hub.
To make the application work:

https://huggingface.co/QuantFactory/Llama-3.2-3B-GGUF

1-Download the GGUF model from Hugging Face Hub.

2-Create a models/ directory in your project’s root directory:

3-Move the downloaded .gguf file into the models/ directory:

📝 Conclusion
This project is a functional and clean prototype that demonstrates Flask and GGUF language models for text processing.
It can be further improved and enhanced with additional features in future phases.
