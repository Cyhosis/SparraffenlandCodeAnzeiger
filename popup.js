document.addEventListener('DOMContentLoaded', function() {
    const codesList = document.getElementById('codesList');
    const noCodes = document.getElementById('noCodes');
    const clearBtn = document.getElementById('clearBtn');
    const status = document.getElementById('status');

    // Lade gespeicherte Codes
    loadSavedCodes();

    // Clear Button Event
    clearBtn.addEventListener('click', function() {
        chrome.storage.local.set({ promocodes: [] }, function() {
            displayCodes([]);
            updateStatus('Alle Codes gelöscht!');
        });
    });

    // Lausche auf neue Codes vom Content Script
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.type === 'CODE_FOUND') {
            loadSavedCodes();
            updateStatus('Neuer Promocode gefunden!');
        }
    });

    function loadSavedCodes() {
        chrome.storage.local.get(['promocodes'], function(result) {
            const codes = result.promocodes || [];
            displayCodes(codes);

            if (codes.length === 0) {
                updateStatus('Keine Codes gefunden. Besuche eine Sparraffenland-Seite!');
            } else {
                updateStatus(`${codes.length} Promocode(s) gefunden!`);
            }
        });
    }

    function getCouponValueType(prizeInfo, code) {
        if (!prizeInfo) return 'Unbekannt';
        
        if (prizeInfo.includes('%')) {
            return 'Prozent (%)';
        }
        
        if (prizeInfo.includes('€') || prizeInfo.toLowerCase().includes('euro')) {
            return 'Euro (€)';
        }
        
        if (code && code.match(/^\d+€?$/)) {
            return 'Euro (€)';
        }
        
        return 'Unbekannt';
    }

    function displayCodes(codes) {
        if (codes.length === 0) {
            codesList.innerHTML = '<div class="no-codes" id="noCodes">Keine Promocodes gefunden.<br>Spiele das Glücksrad und gewinne einen Code!</div>';
            return;
        }

        codes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        let html = '';
        codes.forEach((codeData, index) => {
            const timestamp = codeData.timestamp ? new Date(codeData.timestamp).toLocaleString('de-DE') : 'Unbekannt';
            const url = codeData.url ? new URL(codeData.url).hostname : 'Unbekannt';
            const valueType = getCouponValueType(codeData.prizeInfo, codeData.code);

            html += `
                <div class="code-item">
                    <div class="code-text main-code" id="code-${index}">${escapeHtml(codeData.code)}</div>
                    ${codeData.prizeInfo ? `<div class="prize-info">${escapeHtml(codeData.prizeInfo)}</div>` : ''}
                    <div class="code-type">
                        <strong>Typ:</strong> ${getTypeDisplayName(codeData.type)}<br>
                        <strong>Werttyp:</strong> ${escapeHtml(valueType)}<br>
                        <strong>Gefunden:</strong> ${timestamp}<br>
                        <strong>Website:</strong> ${url}
                    </div>
                    <div class="button-group">
                        <button class="copy-btn" onclick="copyCode('${escapeHtml(codeData.code)}', this)">
                            📋 Code kopieren
                        </button>
                        ${codeData.originalText && codeData.originalText !== codeData.code && codeData.originalText.startsWith('http') ? 
                            `<button class="copy-btn secondary" onclick="copyCode('${escapeHtml(codeData.originalText)}', this)">
                                🔗 URL kopieren
                            </button>` : ''
                        }
                    </div>
                </div>
            `;
        });

        codesList.innerHTML = html;
    }

    function getTypeDisplayName(type) {
        const typeMap = {
            'codeContainer': 'Code Container',
            'hidden': 'Verstecktes Element',
            'data-attribute': 'Data-Attribut', 
            'url-parameter': 'URL Parameter',
            'localStorage': 'Local Storage',
            'sessionStorage': 'Session Storage'
        };
        return typeMap[type] || type;
    }

    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    function updateStatus(message) {
        status.textContent = message;
        status.style.background = '#e8f5e8';
        status.style.borderColor = '#4CAF50';

        setTimeout(() => {
            status.style.background = '#e3f2fd';
            status.style.borderColor = '#2196f3';
        }, 3000);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    window.copyCode = function(code, button) {
        navigator.clipboard.writeText(code).then(function() {
            const originalText = button.textContent;
            button.textContent = '✅ Kopiert!';
            button.style.background = '#4CAF50';

            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '#4CAF50';
            }, 2000);
        }).catch(function(err) {
            console.error('Fehler beim Kopieren:', err);

            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            button.textContent = '✅ Kopiert!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        });
    };
});
