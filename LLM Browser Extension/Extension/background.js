// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Check the message type. We are only interested in "analyze_text".
    if (request.type === "analyze_text") {
        // We are performing an asynchronous operation (fetch), so we use an async IIFE.
        (async () => {
            try {
                // Prepare the data to send to the Flask application.
                // We extract 'text' and 'websiteUrl' from the request object.
                // The key names should match what the Flask application expects (text, website_url).
                const postData = {
                    text: request.text,             // Text from content.js
                    website_url: request.websiteUrl // Website URL from content.js
                };

                console.log("Sending data to Flask app.", postData);

                // Send a POST request to the Flask server.
                const response = await fetch("http://127.0.0.1:5000/analyze", {
                    method: "POST",                 // The HTTP method should be POST
                    headers: {
                        "Content-Type": "application/json" // We are sending data in JSON format
                    },
                    body: JSON.stringify(postData)  // Convert the object to a JSON string
                });

                // Check if the response was successful (status in the range 200-299).
                if (!response.ok) {
                    // If not, try to extract error details.
                    const errorData = await response.json();
                    // Provide a more descriptive error message.
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }

                // Parse the response as JSON.
                const data = await response.json();
                console.log("Response from Flask app.", data);

                // Send back all the information (analysis, save message, possible error) to content.js.
                sendResponse({ 
                    analysis: data.analysis, // Analysis result from LLM
                    message: data.message,   // File save message from Flask
                    error: data.error        // Possible error message from Flask
                });

            } catch (error) {
                // If an error occurs during fetch or parsing.
                console.error("Error communicating with backend.", error);
                // Send the error message back to content.js.
                sendResponse({ error: error.message || "Backend connection failed." });
            }
        })();

        // Returning true signals that we will respond asynchronously.
        return true;
    }
    // Handle other message types here if needed.
});
