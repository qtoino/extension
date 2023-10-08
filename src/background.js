// background.js - Handles requests from the UI, runs the model, then sends back a response

import { pipeline, env } from '@xenova/transformers';
import { CustomCache } from "./cache.js";

// Define caching parameters
env.useBrowserCache = false;
env.useCustomCache = true;
env.customCache = new CustomCache('transformers-cache');

// Skip initial check for local models, since we are not loading any local models.
env.allowLocalModels = false;

// Due to a bug in onnxruntime-web, we must disable multithreading for now.
// See https://github.com/microsoft/onnxruntime/issues/14445 for more information.
env.backends.onnx.wasm.numThreads = 1;

// Process the HTML data received from the popup
let htmlData
let inputJson

// Create generic classify function, which will be reused for the different types of events.
const classify = async () => {
    // Check if htmlData is provided and if it's an array with content
    if (!Array.isArray(htmlData) || htmlData.length === 0) {
        console.error("htmlData is either missing or empty.");
        return [];  // or throw an error, or return any other value you'd like
    }

    // Get the pipeline instance. This will load and build the model when run for the first time.
    const pipe = await pipeline('zero-shot-classification', 'Xenova/deberta-v3-base-tasksource-nli');

    // Extract the 'html' properties from each item in the htmlData array
    const htmlInputs = htmlData.map(item => item.html);
    console.log(htmlInputs)
    // Get the keys from the classes object
    const classKeys = Object.keys(inputJson);
    console.log(classKeys)
    // Initialize an array to hold the results
    let results = [];

    // Loop through each htmlInput and classify it
    for (const input of htmlInputs) {
        let result = await pipe(input, classKeys);
        results.push(result);
    }

    return results;
};

//////////////////////////////////////////////////////////////

////////////////////// 2. Message Events /////////////////////
// 
// Listen for messages from the UI, process it, and send the result back.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "storeFields") {
        console.log("Received form fields in background script:", message);

        htmlData = message.data;
        
        // Respond back to the sender if needed
        sendResponse({status: "Fields received and processed!"});
        // sendResponse(JSON.stringify(htmlData, null, 4));
    } else if (message.action === "matchfields") {
        // Check if message.text is in JSON format
        try {
            inputJson = JSON.parse(message.text);
        } catch (error) {
            console.error("Provided text is not in JSON format:", error);
            // Handle this error appropriately or simply return
            return;
        }
        
        // Run model prediction asynchronously
        (async function () {
            // Assuming you've already defined the classify function elsewhere
            let result = await classify();

            // Send classification result back
            sendResponse(result);
        })();
        
        // Return true to indicate we will send a response asynchronously
        return true;
    }
});




//////////////////////////////////////////////////////////////

// // Function to send a ping to the content script
// function pingContentScript() {
//     chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
//         const currentTab = tabs[0];

//         chrome.tabs.sendMessage(currentTab.id, {action: 'ping'}, (response) => {
//             if (chrome.runtime.lastError) {
//                 console.error(chrome.runtime.lastError);
//                 return;
//             }

//             if (response && response.action === 'pong') {
//                 console.log('Received pong from content script!');
//             }
//         });
//     });
// }

// // For demonstration purposes, you can call the function to send a ping:
// pingContentScript();