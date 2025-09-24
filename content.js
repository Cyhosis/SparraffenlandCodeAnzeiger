// Sparraffenland Promocode Extractor Content Script - erweitert um Gutschein Infos

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
        
        // Periodische Suche (wie im Original-Script)
        this.startPeriodicSearch();
    }
    
    searchForCodes() {
        const foundCodes = [];
        
        // 1. Suche nach dem codeContainer (aus dem Original JavaScript)
        const codeContainer = document.querySelector('[id*="code"], [class*="code"]');
        if (codeContainer && codeContainer.firstChild) {
            const codeText = codeContainer.firstChild.textContent;
            if (codeText) {
                // Extrahiere den eigentlichen Promocode aus der URL
                const extractedCode = this.extractCodeFromText(codeText);
                const prizeInfo = this.extractPrizeInfo();
                if (extractedCode) {
                    foundCodes.push({
                        type: 'codeContainer',
                        code: extractedCode,
                        originalText: codeText,
                        prizeInfo: prizeInfo,
                        element: codeContainer
                    });
                }
            }
        }
        
        // 2. Suche nach versteckten Code-Elementen
        const hiddenElements = document.querySelectorAll('[style*="display: none"], .hidden');
        hiddenElements.forEach(el => {
            const text = el.textContent || el.innerText;
            if (text) {
                const extractedCode = this.extractCodeFromText(text);
                const prizeInfo = this.extractPrizeInfo();
                if (extractedCode) {
                    foundCodes.push({
                        type: 'hidden',
                        code: extractedCode,
                        originalText: text,
                        prizeInfo: prizeInfo,
                        element: el
                    });
                }
            }
        });
        
        // 3. Suche nach Promo-Code in data-Attributen
        const elementsWithData = document.querySelectorAll('[data-code], [data-promo], [data-coupon]');
        elementsWithData.forEach(el => {
            ['code', 'promo', 'coupon'].forEach(attr => {
                const value = el.dataset[attr];
                if (value) {
                    const extractedCode = this.extractCodeFromText(value);
                    const prizeInfo = this.extractPrizeInfo();
                    if (extractedCode) {
                        foundCodes.push({
                            type: 'data-attribute',
                            code: extractedCode,
                            originalText: value,
                            prizeInfo: prizeInfo,
                            element: el
                        });
                    }
                }
            });
        });
        
        // 4. Suche nach URLs die Promocodes enthalten könnten
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.href;
            const extractedCode = this.extractCodeFromText(href);
            const prizeInfo = this.extractPrizeInfo();
            if (extractedCode) {
                foundCodes.push({
                    type: 'url-parameter',
                    code: extractedCode,
                    originalText: href,
                    prizeInfo: prizeInfo,
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
    
    extractCodeFromText(text) {
        if (!text) return null;
        
        // 1. Suche nach promotionCode Parameter in URLs
        const promotionCodeMatch = text.match(/[?&]promotionCode=([A-Z0-9]+)/i);
        if (promotionCodeMatch) {
            return promotionCodeMatch[1];
        }
        
        // 2. Suche nach anderen Code-Parametern in URLs
        const codeParamMatch = text.match(/[?&](?:code|promo|coupon)=([A-Z0-9]+)/i);
        if (codeParamMatch) {
            return codeParamMatch[1];
        }
        
        // 3. Suche nach standalone Codes (alphanumerisch, 6-20 Zeichen)
        const standaloneMatch = text.match(/\b[A-Z0-9]{6,20}\b/);
        if (standaloneMatch) {
            const code = standaloneMatch[0];
            // Filtere häufige False Positives heraus
            const excludeList = ['FALLBACK', 'LINK', 'MONDAY', 'INACTIVE', 'TEILNAHMEBEDINGUNGEN'];
            if (!excludeList.includes(code) && !code.match(/^\d+$/)) {
                return code;
            }
        }
        
        // 4. Suche nach Prozent-Rabatten
        const percentMatch = text.match(/(\d{1,3})%\s*(?:RABATT|OFF)/i);
        if (percentMatch) {
            return `${percentMatch[1]}% RABATT`;
        }
        
        return null;
    }

    extractPrizeInfo() {
        // Suche nach ganzer Gewinnbeschreibung auf der Seite, z.Bsp. "10% Rabatt auf Wasser, Limonaden und Säfte"
        const prizeNode = Array.from(document.querySelectorAll("p, div, span"))
            .find(el => /du hast .* gewonnen/i.test(el.textContent));
        return prizeNode ? prizeNode.textContent.trim() : null;
    }
    
    searchInStorage(foundCodes) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            if (key && (key.toLowerCase().includes('code') || key.toLowerCase().includes('promo'))) {
                const extractedCode = this.extractCodeFromText(value);
                const prizeInfo = this.extractPrizeInfo();
                if (extractedCode) {
                    foundCodes.push({
                        type: 'localStorage',
                        code: extractedCode,
                        originalText: value,
                        prizeInfo: prizeInfo,
                        storageKey: key
                    });
                }
            }
        }
        
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            
            if (key && (key.toLowerCase().includes('code') || key.toLowerCase().includes('promo'))) {
                const extractedCode = this.extractCodeFromText(value);
                const prizeInfo = this.extractPrizeInfo();
                if (extractedCode) {
                    foundCodes.push({
                        type: 'sessionStorage',
                        code: extractedCode,
                        originalText: value,
                        prizeInfo: prizeInfo,
                        storageKey: key
                    });
                }
            }
        }
    }
    
    setupMutationObserver() {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
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
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .spin-button, [class*="spin"], [class*="play"]')) {
                setTimeout(() => this.searchForCodes(), 2000);
            }
        });
        
        window.addEventListener('storage', () => {
            setTimeout(() => this.searchForCodes(), 100);
        });
    }
    
    startPeriodicSearch() {
        let checkCount = 0;
        const maxChecks = 200;
        
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
        
        this.createNotification(codeData);
        
        chrome.runtime.sendMessage({
            type: 'CODE_FOUND',
            data: codeData
        });
    }
    
    createNotification(codeData) {
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
            cursor: pointer;
        `;
        
        notification.innerHTML = `
            <strong>🎉 Promocode gefunden!</strong><br>
            <div style="background: rgba(255,255,255,0.2); padding: 8px; border-radius: 4px; margin: 8px 0; font-size: 16px; font-weight: bold; text-align: center; letter-spacing: 1px;">
                ${codeData.code}
            </div>
            <small>Klicken zum Kopieren • Typ: ${codeData.type}</small>
        `;
        
        notification.addEventListener('click', () => {
            navigator.clipboard.writeText(codeData.code).then(() => {
                notification.innerHTML = `
                    <strong>✅ Code kopiert!</strong><br>
                    <div style="background: rgba(255,255,255,0.2); padding: 8px; border-radius: 4px; margin: 8px 0; font-size: 16px; font-weight: bold; text-align: center; letter-spacing: 1px;">
                        ${codeData.code}
                    </div>
                    <small>Erfolgreich in die Zwischenablage kopiert!</small>
                `;
            });
        });
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 8000);
    }
    
    saveCode(codeData) {
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PromoCodeExtractor();
    });
} else {
    new PromoCodeExtractor();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SEARCH_CODES') {
        const extractor = new PromoCodeExtractor();
        const codes = extractor.searchForCodes();
        sendResponse({ codes: codes });
    }
});
