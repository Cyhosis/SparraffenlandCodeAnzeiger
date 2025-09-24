// Popup Script für Promocode Extractor

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
            loadSavedCodes(); // Aktualisiere die Anzeige
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

    function displayCodes(codes) {
        if (codes.length === 0) {
            codesList.innerHTML = '<div class="no-codes" id="noCodes">Keine Promocodes gefunden.<br>Spiele das Glücksrad und gewinne einen Code!</div>';
            return;
        }

        // Sortiere nach Timestamp (neueste zuerst)
        codes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        let html = '';
        codes.forEach((codeData, index) => {
            const timestamp = codeData.timestamp ? new Date(codeData.timestamp).toLocaleString('de-DE') : 'Unbekannt';
            const url = codeData.url ? new URL(codeData.url).hostname : 'Unbekannt';

            html += `
                <div class="code-item">
                    <div class="code-text" id="code-${index}">${escapeHtml(codeData.code)}</div>
                    <div class="code-type">
                        <strong>Typ:</strong> ${codeData.type}<br>
                        <strong>Gefunden:</strong> ${timestamp}<br>
                        <strong>Website:</strong> ${url}
                    </div>
                    <button class="copy-btn" onclick="copyCode('${escapeHtml(codeData.code)}', this)">
                        📋 Kopieren
                    </button>
                </div>
            `;
        });

        codesList.innerHTML = html;
    }

    function updateStatus(message) {
        status.textContent = message;
        status.style.background = '#e8f5e8';
        status.style.borderColor = '#4CAF50';

        // Nach 3 Sekunden zurück zu neutral
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

    // Global function for copying codes
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
            // Fallback für ältere Browser
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            button.textContent = '✅ Kopiert!';
            setTimeout(() => {
                button.textContent = '📋 Kopieren';
            }, 2000);
        });
    };

    // Suche aktiv nach neuen Codes auf der aktuellen Seite
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const tab = tabs[0];
        if (tab && (tab.url.includes('brame.io') || tab.url.includes('sparraffenland'))) {
            chrome.tabs.sendMessage(tab.id, {type: 'SEARCH_CODES'}, function(response) {
                if (chrome.runtime.lastError) {
                    // Content Script ist möglicherweise nicht geladen
                    updateStatus('Content Script wird geladen...');
                } else if (response && response.codes) {
                    updateStatus(`${response.codes.length} Code(s) auf aktueller Seite gefunden!`);
                }
            });
        } else {
            updateStatus('Besuche eine Brame.io Gewinnspiel-Seite!');
        }
    });
});