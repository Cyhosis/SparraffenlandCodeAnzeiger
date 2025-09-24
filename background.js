chrome.runtime.onInstalled.addListener(() => {
    console.log('Promocode Extractor installiert!');

    chrome.storage.local.get(['promocodes'], (result) => {
        if (!result.promocodes) {
            chrome.storage.local.set({ promocodes: [] });
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CODE_FOUND') {
        console.log('Neuer Promocode gefunden:', message.data);

        chrome.action.setBadgeText({
            text: '!',
            tabId: sender.tab.id
        });

        chrome.action.setBadgeBackgroundColor({
            color: '#4CAF50'
        });

        setTimeout(() => {
            chrome.action.setBadgeText({
                text: '',
                tabId: sender.tab.id
            });
        }, 5000);

        sendResponse({ success: true });
    }

    return true;
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.action.setBadgeText({
        text: '',
        tabId: activeInfo.tabId
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        chrome.action.setBadgeText({
            text: '',
            tabId: tabId
        });
    }
});
