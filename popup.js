// popup.js - Versão 4.0 (i18n Refactor)

function t(key) { return window.I18N.t(key); }

document.addEventListener('DOMContentLoaded', () => {
    const checkWarn = document.getElementById('check-show-warn');
    const inputKey = document.getElementById('lastfm-key');
    const inputUser = document.getElementById('lastfm-user');
    const statusMsg = document.getElementById('save-status');

    // Applies translations to all UI elements
    function applyTranslations() {
        document.querySelector('h2').textContent = t('popupTitle');
        document.getElementById('txt-warn-title').textContent = t('warnTitle');
        document.getElementById('txt-warn-desc').textContent = t('warnDesc');
        document.getElementById('txt-lfm-title').textContent = t('lfmTitle');
        document.getElementById('txt-lfm-desc').textContent = t('lfmDesc');
        document.getElementById('txt-lbl-key').textContent = t('lblKey');
        document.getElementById('txt-lbl-user').textContent = t('lblUser');
        document.getElementById('txt-link-key').textContent = t('linkKey');
        document.getElementById('txt-bug').textContent = t('bug');
        document.getElementById('lastfm-key').placeholder = t('phKey');
        document.getElementById('lastfm-user').placeholder = t('phUser');
    }

    // Load saved settings
    chrome.storage.sync.get(['showWarning', 'lastFmKey', 'lastFmUser'], (res) => {
        checkWarn.checked = res.showWarning !== false;
        if (res.lastFmKey) inputKey.value = res.lastFmKey;
        if (res.lastFmUser) inputUser.value = res.lastFmUser;
        applyTranslations();
    });

    // Send message to active YT Music tab
    function sendMessage(msg) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, msg).catch(() => {});
            }
        });
    }

    checkWarn.addEventListener('change', () => {
        chrome.storage.sync.set({ showWarning: checkWarn.checked });
        sendMessage({ type: 'UPDATE_SETTINGS', setting: 'showWarning', value: checkWarn.checked });
    });

    let timeout = null;
    const saveText = () => {
        const k = inputKey.value.trim();
        const u = inputUser.value.trim();

        statusMsg.textContent = t('saving');
        statusMsg.style.color = "#aaa";

        if (typeof browser !== 'undefined' && browser.storage) {
            browser.storage.sync.set({ lastFmKey: k, lastFmUser: u }).then(() => {
                statusMsg.textContent = t('saved');
                statusMsg.style.color = "#4bb71b";
                setTimeout(() => statusMsg.textContent = "", 2000);
                sendMessage({ type: 'UPDATE_CREDS', key: k, user: u });
            });
        } else {
            chrome.storage.sync.set({ lastFmKey: k, lastFmUser: u }, () => {    
                statusMsg.textContent = t('saved');
                statusMsg.style.color = "#4bb71b";
                setTimeout(() => statusMsg.textContent = "", 2000);
                sendMessage({ type: 'UPDATE_CREDS', key: k, user: u });
            });
        }
    };

    const debouncedSaveText = () => {
        clearTimeout(timeout);
        statusMsg.textContent = t('saving');
        statusMsg.style.color = "#aaa";
        timeout = setTimeout(saveText, 800);
    };

    inputKey.addEventListener('input', debouncedSaveText);
    inputUser.addEventListener('input', debouncedSaveText);
    inputKey.addEventListener('change', saveText);
    inputUser.addEventListener('change', saveText);
    window.addEventListener('beforeunload', () => {
        if (timeout) { clearTimeout(timeout); saveText(); }
    });
});