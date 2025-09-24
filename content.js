// Sparraffenland Promocode Extractor Content Script

class PromoCodeExtractor {
    constructor() {
        this.codes = [];
        this.observer = null;
        this.init();
    }

    init() {
        console.log('PromoCode Extractor initialisiert');

        // Sofort nach bestehenden Codes suchen
        this.searchForCodes();

        // MutationObserver für dynamische Inhalte
        this.setupMutationObserver();

        // Auf Spiel-Events lauschen
        this.setupGameEventListeners();

        // Periodische Suche (wie das Original-Script)
        this.startPeriodicSearch();
    }

    searchForCodes() {
        const foundCodes = [];

        // 1. Suche nach dem codeContainer (aus dem Original JavaScript)
        const codeContainer = document.querySelector('[id*="code"], [class*="code"]');
        if (codeContainer && codeContainer.firstChild) {
            const codeText = codeContainer.firstChild.textContent;
            if (codeText && this.isValidCode(codeText)) {
                foundCodes.push({
                    type: 'codeContainer',
                    code: codeText,
                    element: codeContainer
                });
            }
        }

        // 2. Suche nach versteckten Code-Elementen
        const hiddenElements = document.querySelectorAll('[style*="display: none"], .hidden');
        hiddenElements.forEach(el => {
            const text = el.textContent || el.innerText;
            if (text && this.isValidCode(text)) {
                foundCodes.push({
                    type: 'hidden',
                    code: text,
                    element: el
                });
            }
        });

        // 3. Suche nach Promo-Code in data-Attributen
        const elementsWithData = document.querySelectorAll('[data-code], [data-promo], [data-coupon]');
        elementsWithData.forEach(el => {
            ['code', 'promo', 'coupon'].forEach(attr => {
                const value = el.dataset[attr];
                if (value && this.isValidCode(value)) {
                    foundCodes.push({
                        type: 'data-attribute',
                        code: value,
                        element: el
                    });
                }
            });
        });

        // 4. Suche nach URLs die Promocodes enthalten könnten
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.href;
            const codeMatch = href.match(/[?&](?:code|promo|coupon)=([A-Z0-9]+)/i);
            if (codeMatch) {
                foundCodes.push({
                    type: 'url-parameter',
                    code: codeMatch[1],
                    element: link
                });
            }
        });

        // 5. Suche in localStorage und sessionStorage
        this.searchInStorage(foundCodes);

        // Neue Codes speichern
        foundCodes.forEach(codeData => {
            if (!this.codes.some(c => c.code === codeData.code)) {
                this.codes.push(codeData);
                this.displayCode(codeData);
                this.saveCode(codeData);
            }
        });

        return foundCodes;
    }

    searchInStorage(foundCodes) {
        // localStorage durchsuchen
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);

            if (key && (key.toLowerCase().includes('code') || key.toLowerCase().includes('promo'))) {
                if (this.isValidCode(value)) {
                    foundCodes.push({
                        type: 'localStorage',
                        code: value,
                        storageKey: key
                    });
                }
            }
        }

        // sessionStorage durchsuchen
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);

            if (key && (key.toLowerCase().includes('code') || key.toLowerCase().includes('promo'))) {
                if (this.isValidCode(value)) {
                    foundCodes.push({
                        type: 'sessionStorage',
                        code: value,
                        storageKey: key
                    });
                }
            }
        }
    }

    isValidCode(text) {
        if (!text) return false;

        // Bereinige den Text
        const cleaned = text.trim();

        // Prüfe ob es wie ein Promocode aussieht
        const codePatterns = [
            /^[A-Z0-9]{4,20}$/,           // Alphanumerisch, 4-20 Zeichen
            /^[A-Z]{2,10}[0-9]{2,10}$/,   // Buchstaben gefolgt von Zahlen
            /^\d{1,3}%\s*(RABATT|OFF)/i, // Prozent-Rabatte
            /https?:\/\/[^\s]+/        // URLs (können Weiterleitungen zu Codes sein)
        ];

        return codePatterns.some(pattern => pattern.test(cleaned));
    }

    setupMutationObserver() {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    // Kurz warten und dann nach neuen Codes suchen
                    setTimeout(() => this.searchForCodes(), 100);
                }
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class', 'data-code', 'data-promo']
        });
    }

    setupGameEventListeners() {
        // Lausche auf mögliche Spiel-Events
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .spin-button, [class*="spin"], [class*="play"]')) {
                // Nach dem Klick kurz warten und dann nach neuen Codes suchen
                setTimeout(() => this.searchForCodes(), 2000);
            }
        });

        // Lausche auf Änderungen in localStorage
        window.addEventListener('storage', () => {
            setTimeout(() => this.searchForCodes(), 100);
        });
    }

    startPeriodicSearch() {
        // Wie im Original-Script alle 50ms suchen (für 10 Sekunden)
        let checkCount = 0;
        const maxChecks = 200; // 10 Sekunden bei 50ms Intervall

        const interval = setInterval(() => {
            this.searchForCodes();
            checkCount++;

            if (checkCount >= maxChecks) {
                clearInterval(interval);
            }
        }, 50);
    }

    displayCode(codeData) {
        console.log('Promocode gefunden:', codeData);

        // Erstelle eine Benachrichtigung auf der Seite
        this.createNotification(codeData);

        // Sende an Extension Popup
        chrome.runtime.sendMessage({
            type: 'CODE_FOUND',
            data: codeData
        });
    }

    createNotification(codeData) {
        // Erstelle ein visuelles Element für den Code
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 300px;
        `;

        notification.innerHTML = `
            <strong>Promocode gefunden!</strong><br>
            <code style="background: rgba(255,255,255,0.2); padding: 2px 4px; border-radius: 2px;">
                ${codeData.code}
            </code><br>
            <small>Typ: ${codeData.type}</small>
        `;

        document.body.appendChild(notification);

        // Nach 5 Sekunden ausblenden
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    saveCode(codeData) {
        // Speichere in Chrome Extension Storage
        chrome.storage.local.get(['promocodes'], (result) => {
            const codes = result.promocodes || [];
            codes.push({
                ...codeData,
                timestamp: Date.now(),
                url: window.location.href
            });

            chrome.storage.local.set({ promocodes: codes });
        });
    }
}

// Starte den Extractor wenn die Seite geladen ist
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PromoCodeExtractor();
    });
} else {
    new PromoCodeExtractor();
}