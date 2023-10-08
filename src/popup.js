// popup.js - handles interaction with the extension's popup, sends requests to the
// service worker (background.js), and updates the popup's UI (popup.html) on completion.

const inputElement = document.getElementById('text');
const outputElement = document.getElementById('output');
const buttonElement = document.getElementById('scanhtml');
const matchingfieldsButton = document.getElementById('matchingfields');

// Event listener for the button click
matchingfieldsButton.addEventListener('click', () => {
    // Check the current text in the textbox
    const text = inputElement.value;

    // Bundle the input data into a message
    const message = {
        action: 'matchfields',
        text: text,
    }

    // Send this message to the service worker
    chrome.runtime.sendMessage(message, (response) => {
        // Handle results returned by the service worker (`background.js`) and update the popup's UI
        outputElement.innerText = JSON.stringify(response, null, 2);
    });
});



// Event listener for the button click
buttonElement.addEventListener('click', async () => {
    console.log("Button was clicked!");

    try {
        // Get the current active tab.
        const [activeTab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        console.log("Found active tab:", activeTab);

        // Send a greeting message to the content script of the active tab.
        const response = await chrome.tabs.sendMessage(activeTab.id, {greeting: "extractFields"});
        
        console.log("Received response from content script:", response);

        if (!response) {
            console.error("No response received from content script.");
            return;
        }

        if (response.farewell === "extractionSuccessful") {
            console.log("Received form fields from content script:", response.fields);

            // Send the extracted fields to the background script
            chrome.runtime.sendMessage({action: "storeFields", data: response.fields}, (backgroundResponse) => {
                if (chrome.runtime.lastError) {
                    console.error("Error while sending message to background:", chrome.runtime.lastError);
                    return;
                }
                console.log("Response from background:", backgroundResponse);
            });
        } else {
            console.error("Unexpected response from content script:", response);
        }
    } catch (error) {
        console.error("Failed to send message:", error);
    }
});





// function onWindowLoad() {
//     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//         var activeTab = tabs[0];
//         var activeTabId = activeTab.id;

//         chrome.scripting.executeScript({
//             target: { tabId: activeTabId },
//             func: DOMtoString,
//         }, function (results) {
//             if (chrome.runtime.lastError) {
//                 message.innerText = 'There was an error injecting script: \n' + chrome.runtime.lastError.message;
//                 return;
//             }
//             var extractedHTML = results[0].result;

//             // Send the extracted HTML to background.js
//             chrome.runtime.sendMessage({action: "processHTML", data: extractedHTML}, function(response) {
//                 //console.log(response); // Handle the response if necessary
//             });

//         });
//     });
// }

// window.onload = onWindowLoad;

// function DOMtoString() {
//     return document.documentElement.outerHTML;
// }

