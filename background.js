// Background Script für Promocode Extractor

chrome.runtime.onInstalled.addListener(() => {
    console.log('Promocode Extractor installiert!');

    // Initialisiere Storage
    chrome.storage.local.get(['promocodes'], (result) => {
        if (!result.promocodes) {
            chrome.storage.local.set({ promocodes: [] });
        }
    });
});

// Handle messages zwischen Content Script und Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CODE_FOUND') {
        console.log('Neuer Promocode gefunden:', message.data);

        // Badge auf Extension Icon setzen
        chrome.action.setBadgeText({
            text: '!',
            tabId: sender.tab.id
        });

        chrome.action.setBadgeBackgroundColor({
            color: '#4CAF50'
        });

        // Nach 5 Sekunden Badge entfernen
        setTimeout(() => {
            chrome.action.setBadgeText({
                text: '',
                tabId: sender.tab.id
            });
        }, 5000);

        sendResponse({ success: true });
    }

    return true; // Keep message channel open for async response
});

// Tab Update Listener - Badge zurücksetzen wenn Tab wechselt
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.action.setBadgeText({
        text: '',
        tabId: activeInfo.tabId
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // Badge zurücksetzen wenn Seite neu geladen wird
        chrome.action.setBadgeText({
            text: '',
            tabId: tabId
        });
    }
});