

chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        id: "MagicSync",  // An identifier for this menu item
        title: "MagicSync Connector",  // The text to be displayed
        contexts: ["all"]  // Context where the menu item will appear (e.g., "all", "page", "selection", etc.)
    });
});


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.html) {  // Check if the request contains 'html'
        // Acknowledge receipt of the message to content.js
        sendResponse({message: "HTML received in the background.js"});
    
        // Fetch the HTML from the content script
        const html = request.html;

        // Send the HTML to your local server
        fetch('http://127.0.0.1:5000/receive_html', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({html: html})
        })
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
    }
});



chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "MagicSync" && tab && tab.id >= 0) {
        // Send a message to the content script in the active tab
        chrome.tabs.sendMessage(tab.id, {action: "fetchHTML"});
    }
});

