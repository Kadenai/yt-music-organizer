// background.js

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // App is installed for the first time
        chrome.tabs.create({ url: 'welcome.html' });
    } else if (details.reason === 'update') {
        // App is updated
        chrome.tabs.create({ url: 'update.html' });
    }
});
