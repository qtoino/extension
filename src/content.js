// content.js - the content scripts which is run in the context of web pages, and has access
// to the DOM and other web APIs.

import { FillPipeline } from "./pipeline.js";

console.log("Chrome extension go")

function extractFormFields() {
    const fields = [];

    // Helper function to create field objects
    const createFieldObject = (element, type) => ({
        type: type,
        html: element.outerHTML,
        id: element.id,
        name: element.name,
        value: element.value,
        placeholder: element.placeholder,
        typeAttribute: element.type || undefined // This will get the type attribute, like 'text', 'password', 'radio', etc.
    });

    // Get all input fields
    const inputs = document.querySelectorAll('input');
    for (const input of inputs) {
        fields.push(createFieldObject(input, 'input'));
    }

    // Get all textarea fields
    const textareas = document.querySelectorAll('textarea');
    for (const textarea of textareas) {
        const fieldObject = createFieldObject(textarea, 'textarea');
        delete fieldObject.typeAttribute;  // Remove the 'typeAttribute' for textareas as they don't have this attribute
        fields.push(fieldObject);
    }

    // Get all select fields (dropdowns)
    const selects = document.querySelectorAll('select');
    for (const select of selects) {
        const options = Array.from(select.options).map(option => ({
            value: option.value,
            text: option.text,
            selected: option.selected
        }));

        const fieldObject = createFieldObject(select, 'select');
        fieldObject.options = options;
        delete fieldObject.value;  // Remove the 'value' for selects as they don't have a direct value
        delete fieldObject.typeAttribute;  // Remove the 'typeAttribute' for selects
        fields.push(fieldObject);
    }

    return fields;
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        console.log("Received message in content.js from:", sender.tab ? sender.tab.url : "the extension");

        if (request.greeting === "extractFields") {
            console.log("Processing 'extractFields' request in content.js...");

            // Extract form fields and send them as a response.
            const fields = extractFormFields();
            console.log("Extracted fields in content.js:", fields);
            sendResponse({farewell: "extractionSuccessful", fields: fields});
        } else if (request.action === "fillForm") {
            console.log("Processing 'fillForm' request in content.js...");

            // Assuming 'instructions' is passed in the request
            const instructions = request.instructions;

            // Create and populate the pipeline
            const fillpipeline = new FillPipeline();
            fillpipeline.createPipelineFromJson(instructions);

            // Execute the pipeline
            await fillpipeline.run();

            // Optionally, send a response back
            sendResponse({status: "Form filled successfully"});
        } else {
            console.log("Unknown request received in content.js:", request);
        }
    })();

    return true; // indicates the response is sent asynchronously
});




// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === 'ping') {
//         console.log('Received ping from background!');
//         sendResponse({action: 'pong'});
//     }
//     return true;
// });
