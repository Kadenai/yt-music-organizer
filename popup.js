// popup.js - Versão 3.1 (Debug de Salvamento)

const TEXTS = {
    en: {
        warnTitle: "Safety Warning", warnDesc: "Confirm before sorting",
        lfmTitle: "Last.fm Integration (Optional)", lfmDesc: "Fill in to use \"My Scrobbles\":",
        lblKey: "API Key", lblUser: "Username", linkKey: "Get API Key",
        bug: "Report Bug", saving: "Saving...", saved: "Saved!",
        phKey: "Paste your key here...", phUser: "Your Last.fm username", title: "YT Music Organizer"
    },
    pt: {
        warnTitle: "Aviso de Segurança", warnDesc: "Confirmar antes de ordenar",
        lfmTitle: "Integração Last.fm (Opcional)", lfmDesc: "Preencha para usar \"Meus Scrobbles\":",
        lblKey: "Chave da API", lblUser: "Usuário", linkKey: "Obter Chave",
        bug: "Reportar Bug", saving: "Salvando...", saved: "Salvo!",
        phKey: "Cole sua chave aqui...", phUser: "Seu usuário Last.fm", title: "YT Music Organizer"
    }
};

let currentLang = 'en';

document.addEventListener('DOMContentLoaded', () => {
    const checkWarn = document.getElementById('check-show-warn');
    const inputKey = document.getElementById('lastfm-key');
    const inputUser = document.getElementById('lastfm-user');
    const statusMsg = document.getElementById('save-status');
    const btnEn = document.getElementById('btn-en');
    const btnPt = document.getElementById('btn-pt');

    // 1. CARREGAR (SYNC)
    chrome.storage.sync.get(['showWarning', 'lastFmKey', 'lastFmUser', 'appLang'], (res) => {
        // console.log("Configurações carregadas:", res); // Debug
        
        checkWarn.checked = res.showWarning !== false;
        if (res.lastFmKey) inputKey.value = res.lastFmKey;
        if (res.lastFmUser) inputUser.value = res.lastFmUser;
        
        // Se não tiver idioma salvo, tenta pegar do navegador ou usa EN
        let savedLang = res.appLang;
        if (!savedLang) {
            savedLang = navigator.language.startsWith('pt') ? 'pt' : 'en';
        }
        
        applyLanguageToUI(savedLang);
    });

    function applyLanguageToUI(lang) {
        currentLang = lang;
        btnEn.classList.toggle('active', lang === 'en');
        btnPt.classList.toggle('active', lang === 'pt');

        const t = TEXTS[lang];
        if (t) {
            document.querySelector('h2').innerText = t.title;
            document.getElementById('txt-warn-title').innerText = t.warnTitle;
            document.getElementById('txt-warn-desc').innerText = t.warnDesc;
            document.getElementById('txt-lfm-title').innerText = t.lfmTitle;
            document.getElementById('txt-lfm-desc').innerText = t.lfmDesc;
            document.getElementById('txt-lbl-key').innerText = t.lblKey;
            document.getElementById('txt-lbl-user').innerText = t.lblUser;
            document.getElementById('txt-link-key').innerText = t.linkKey;
            document.getElementById('txt-bug').innerText = t.bug;
            document.getElementById('lastfm-key').placeholder = t.phKey;
            document.getElementById('lastfm-user').placeholder = t.phUser;
        }
    }

    // Salva e aplica (No clique)
    function saveLanguage(lang) {
        console.log("Salvando idioma:", lang);
        chrome.storage.sync.set({ appLang: lang }, () => {
            applyLanguageToUI(lang);
            sendMessage({ type: 'UPDATE_LANG', lang: lang });
        });
    }

    btnEn.onclick = () => saveLanguage('en');
    btnPt.onclick = () => saveLanguage('pt');

    checkWarn.addEventListener('change', () => {
        chrome.storage.sync.set({ showWarning: checkWarn.checked });
        sendMessage({ type: 'UPDATE_SETTINGS', setting: 'showWarning', value: checkWarn.checked });
    });

    let timeout = null;
    const saveText = () => {
        clearTimeout(timeout);
        statusMsg.innerText = TEXTS[currentLang].saving;
        statusMsg.style.color = "#aaa";
        
        timeout = setTimeout(() => {
            const k = inputKey.value.trim();
            const u = inputUser.value.trim();
            
            chrome.storage.sync.set({ lastFmKey: k, lastFmUser: u }, () => {
                statusMsg.innerText = TEXTS[currentLang].saved;
                statusMsg.style.color = "#4bb71b";
                setTimeout(() => statusMsg.innerText = "", 2000);
                sendMessage({ type: 'UPDATE_CREDS', key: k, user: u });
            });
        }, 800);
    };

    inputKey.addEventListener('input', saveText);
    inputUser.addEventListener('input', saveText);

    function sendMessage(msg) {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, msg).catch(()=>{});
            }
        });
    }
});