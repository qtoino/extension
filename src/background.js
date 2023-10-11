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
let inputJson

// Create generic classify function, which will be reused for the different types of events.
const classify = async (inputJson, debug = false) => {
    // Retrieve the stored fields from chrome.storage.local
    let htmlData = await new Promise((resolve) => {
        chrome.storage.local.get('storedFields', (result) => {
            resolve(result.storedFields);
        });
    });

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

    // Extract the 'id' properties from each item in the htmlData array
    const htmlIds = htmlData.map(item => item.id);
    console.log(htmlIds)

    // Get the keys from the classes object
    const classKeys = Object.keys(inputJson);
    classKeys.push("button");
    classKeys.push("submit");
    console.log(classKeys)

    // Initialize an array to hold the results
    let results = [];
    let winningLabels = [];

    // Loop through each htmlInput and classify it
    for (const [index, input] of htmlInputs.entries()) {
        let result = await pipe(input, classKeys);
        results.push(result);
        // Push an object with the winning label and its associated id
        winningLabels.push({
            label: result.labels[0],
            id: htmlIds[index]
        });
    }
  
    if (debug === true) {
        return results
    } else {
        return winningLabels;
    }
};

function generatePipelineInstruction(winningLabels, userData) {
    const instructions = [];

    for (const item of winningLabels) {
        const label = item.label;
        const id = item.id;
        // Determine the type based on the label
        let type = "fillText"; // default type
        console.log(label);
        if (label === "button" || label === "submit") {
            type = "clickButton";
        }

        // Create the selector based on the id
        const selector = `#${id}`;
        
        // Create the object
        const obj = {
            type: type,
            selector: selector
        };

        // If it's not a button, add the text property
        if (type !== "clickButton") {
            // Get the value from the classes object
            obj.text = userData[label];
        }

        instructions.push(obj);
    }

    return instructions;
}

//////////////////////////////////////////////////////////////

////////////////////// 2. Message Events /////////////////////
// 
// Listen for messages from the UI, process it, and send the result back.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "storeFields") {
        console.log("Received form fields in background script:", message);

        // Store the fields using chrome.storage.local
        chrome.storage.local.set({ 'storedFields': message.data }, () => {
            console.log("Fields stored successfully!");
        });
        
        // Respond back to the sender
        sendResponse({status: "Fields received and stored!"});
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
            let result = await classify(inputJson, true);

            // Send classification result back
            sendResponse(result);
        })();
        
        // Return true to indicate we will send a response asynchronously
        return true;
    } else if (message.action === "fillFormInstructions") {
        // Check if message.text is in JSON format
        try {
            inputJson = JSON.parse(message.text);
        } catch (error) {
            console.error("Provided text is not in JSON format:", error);
            // Handle this error appropriately or simply return
            return;
        }

        console.log("Received form fields in background script:", message);

        (async function() {
            // Run model prediction asynchronously
            const result = await classify(inputJson, false);
    
        
            // Generate pipeline instruction
            let instructions = generatePipelineInstruction(result, inputJson);

            // Send instructions result back
            sendResponse(instructions);

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