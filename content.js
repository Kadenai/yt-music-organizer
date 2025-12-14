// content.js - Versão 15.1 (innerHTML Security Fix)

let config = { showWarning: true };
let currentLang = 'en'; 

const TRANSLATIONS = {
    en: {
        modalTitle: "Sort Builder", activeLabel: "Active Criteria", emptyMsg: "Click below to add criteria...", lblReverse: "Reverse Order",
        btnCancel: "Cancel", btnOrganize: "ORGANIZE", btnClear: "Clear all", statusInit: "Starting...", statusPrep: "Preparing engine...",
        statusDone: "Success!", statusDoneMsg: "Playlist organized.", statusWarn: "Warning", statusWarnMsg: "$1 tracks without data were moved.",
        statusConnect: "Connecting...", mainBtn: "Organize", securityTitle: "Are you sure?",
        securityDesc: "This action rearranges your playlist permanently. We recommend creating a backup first.",
        btnConfirm: "YES, DO IT", btnBack: "Back",
        statusStopping: "Stopping...", statusStopped: "Cancelled by user.",
        tipViews: "<b>Tip:</b> For better accuracy on 'Popularity', add your Last.fm API Key in settings.",
        errScrobbles: "<b>Locked:</b> Please add your Last.fm Username in extension settings to use this feature.",
        maxLimit: "Maximum of 2 criteria reached.",

        // NOMES CURTOS
        critArtist: "Artist Name", descArtist: "Group by author (A-Z)", 
        critAlbum: "Album (Year/Order)", descAlbum: "Chronological order", 
        critViews: "Popularity", descViews: "Most played (Global)", 
        critScrobbles: "My Scrobbles", descScrobbles: "Your Last.fm history",
        critTitle: "Track Title", descTitle: "Title (A-Z)", 
        critDuration: "Duration", descDuration: "Shortest to Longest",
        critShuffle: "True Shuffle", descShuffle: "Randomize everything",
        fusMyFavAlbums: "My Favorite Albums", 
        fusExpress: "Express Session",
        fusDisco: "Classic Discography",
        fusHallFame: "Hall of Fame",
        fusTopArtists: "My Top Artists",
        fusGreatestHits: "Band's Greatest Hits", 
        fusFanClub: "Fan Club",
        fusArtistDur: "Shortest first (Per Artist)",

        // DESCRIÇÕES COMPLETAS
        txtArtist: "Artists in alphabetical order.",
        txtAlbum: "Older albums come first, songs stay according to the original album order.",
        txtViews: "Most famous songs at the top (based on Last.fm/YouTube Views).",
        txtScrobbles: "Puts the songs you listened to the most at the top (requires Last.fm account).",
        txtTitle: "Songs in alphabetical order.",
        txtDuration: "Shortest songs first.",
        txtShuffle: "Random.",
        txtFavAlbums: "Your most listened albums from Last.fm play first.",
        txtExpress: "Shortest albums play first.",
        txtDisco: "Organizes Artists (A-Z). Within each artist, organizes their albums chronologically (from oldest to newest).",
        txtHallFame: "Most popular albums play first.",
        txtTopArtists: "Favorite artists from Last.fm play first.",
        txtGreatestHits: "Band A-Z. Within the band, hits play first.",
        txtFanClub: "Band A-Z. Within the band, songs you listen to the most on Last.fm play first.",
        txtArtistDur: "Band A-Z. Within the band, shortest songs play first."
    },
    pt: {
        modalTitle: "Construtor de Ordem", activeLabel: "Critérios Ativos", emptyMsg: "Clique abaixo para adicionar critérios...", lblReverse: "Ordem Reversa",
        btnCancel: "Cancelar", btnOrganize: "ORGANIZAR", btnClear: "Limpar tudo", statusInit: "Iniciando...", statusPrep: "Preparando motor...",
        statusDone: "Sucesso!", statusDoneMsg: "Playlist organizada.", statusWarn: "Aviso", statusWarnMsg: "$1 músicas sem dados foram movidas.",
        statusConnect: "Conectando...", mainBtn: "Organizar", securityTitle: "Tem certeza?",
        securityDesc: "Essa ação reordena a playlist permanentemente. Recomendamos criar um backup antes.",
        btnConfirm: "SIM, ORGANIZAR", btnBack: "Voltar",
        statusStopping: "Parando...", statusStopped: "Cancelado pelo usuário.",
        tipViews: "<b>Dica:</b> Para maior precisão em 'Popularidade', adicione sua Chave API do Last.fm nas configurações.",
        errScrobbles: "<b>Bloqueado:</b> Adicione seu Usuário Last.fm nas configurações da extensão para usar este recurso.",
        maxLimit: "Máximo de 2 critérios atingido.",

        // NOMES CURTOS
        critArtist: "Nome do Artista", descArtist: "Agrupar por autor (A-Z)", 
        critAlbum: "Álbum (Ano/Ordem)", descAlbum: "Ordem cronológica", 
        critViews: "Popularidade", descViews: "Mais ouvidas (Global)", 
        critScrobbles: "Meus Scrobbles", descScrobbles: "Seu histórico Last.fm",
        critTitle: "Nome da Música", descTitle: "Título (A-Z)", 
        critDuration: "Duração", descDuration: "Curta p/ Longa",
        critShuffle: "Aleatório Real", descShuffle: "Embaralhar tudo",
        fusMyFavAlbums: "Meus Álbuns Preferidos", 
        fusExpress: "Sessão Expressa",
        fusDisco: "Discografia Clássica",
        fusHallFame: "Hall da Fama",
        fusTopArtists: "Meu Top Artistas",
        fusGreatestHits: "Greatest Hits da Banda", 
        fusFanClub: "Fã Clube",
        fusArtistDur: "Curta p/ Longa (Por Artista)",

        // DESCRIÇÕES COMPLETAS
        txtArtist: "Artistas em ordem alfabética.",
        txtAlbum: "Álbuns mais antigos vêm primeiro, músicas ficam de acordo com a ordem original do álbum.",
        txtViews: "Músicas mais famosas no topo (baseado em Last.fm/YouTube Views).",
        txtScrobbles: "Coloca as músicas que você mais ouviu no topo (requer conta Last.fm).",
        txtTitle: "Músicas em ordem alfabética.",
        txtDuration: "Músicas mais curtas primeiro.",
        txtShuffle: "Aleatório.",
        txtFavAlbums: "Seus álbuns mais ouvidos do Last.fm tocam primeiro.",
        txtExpress: "Álbuns mais curtos tocam primeiro.",
        txtDisco: "Organiza Artistas (A-Z). Dentro de cada artista, organiza seus álbuns cronologicamente (do mais antigo ao último lançado).",
        txtHallFame: "Álbuns mais populares tocam primeiro.",
        txtTopArtists: "Artistas preferidos do Last.fm tocam primeiro.",
        txtGreatestHits: "Banda A-Z. Dentro da banda, os sucessos tocam primeiro.",
        txtFanClub: "Banda A-Z. Dentro da banda, as músicas que você mais ouve no Last.fm tocam primeiro.",
        txtArtistDur: "Banda A-Z. Dentro da banda, as músicas mais curtas tocam primeiro."
    }
};

const ICONS = {
    ARTIST: `<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    ALBUM:  `<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/><circle cx="12" cy="12" r="1.5"/></svg>`,
    VIEWS:  `<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>`,
    HEADPHONE: `<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-4v8h4c1.1 0 2-.9 2-2v-7a9 9 0 0 0-9-9z"/></svg>`,
    TITLE:  `<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M9.25 5l-2.5 14h2.25l.62-2h3.74l.62 2h2.26l-2.5-14h-4.49zm.94 10L11.5 7.93 12.8 15h-2.61zm8.21-3h-2V7h2v5zm0 4h-2v-2h2v2zm0 4h-2v-2h2v2z"/></svg>`, 
    CLOCK:  `<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
    SHUFFLE: `<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>`,
    CONFIG: `<svg viewBox="0 0 24 24" width="40" height="40" fill="#FF0000"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>`,
    WARNING: `<svg viewBox="0 0 24 24" width="40" height="40" fill="#FFCC00"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
    MAIN_BTN: `<svg height="20" viewBox="0 0 24 24" width="20" fill="white"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/></svg>`,
    TRASH: `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
    SWAP: `<svg viewBox="0 0 24 24" width="18" height="18" fill="#ddd"><path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/></svg>`,
    LOCK: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#666"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>`,
    LIGHTBULB: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#ffcc00"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 0 1 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/></svg>`,
    STAR: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#ffd700"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
    CROSS: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60" role="button" aria-label="Fechar"><circle cx="30" cy="30" r="30" fill="#FF0000"/><path d="M 20 20 L 40 40 M 40 20 L 20 40" stroke="black" stroke-width="5" stroke-linecap="round" fill="none"/></svg>`
};

const CRITERIA_IDS = [
    { id: 'ARTIST_AZ', labelKey: 'critArtist', descKey: 'descArtist', icon: ICONS.ARTIST, descTxt: 'txtArtist' },
    { id: 'ALBUM_ORD', labelKey: 'critAlbum', descKey: 'descAlbum', icon: ICONS.ALBUM, descTxt: 'txtAlbum' },
    { id: 'VIEWS_DESC', labelKey: 'critViews', descKey: 'descViews', icon: ICONS.VIEWS, descTxt: 'txtViews' },
    { id: 'MY_SCROBBLES', labelKey: 'critScrobbles', descKey: 'descScrobbles', icon: ICONS.HEADPHONE, descTxt: 'txtScrobbles' },
    { id: 'TITLE_AZ', labelKey: 'critTitle', descKey: 'descTitle', icon: ICONS.TITLE, descTxt: 'txtTitle' },
    { id: 'DURATION', labelKey: 'critDuration', descKey: 'descDuration', icon: ICONS.CLOCK, descTxt: 'txtDuration' },
    { id: 'SHUFFLE', labelKey: 'critShuffle', descKey: 'descShuffle', icon: ICONS.SHUFFLE, descTxt: 'txtShuffle' }
];

const FUSIONS = {
    'MY_SCROBBLES|ALBUM_ORD': { id: 'FUS_FAV_ALBUMS', labelKey: 'fusMyFavAlbums', descTxt: 'txtFavAlbums' },
    'DURATION|ALBUM_ORD': { id: 'FUS_EXPRESS', labelKey: 'fusExpress', descTxt: 'txtExpress' },
    'ARTIST_AZ|ALBUM_ORD': { id: 'FUS_DISCO', labelKey: 'fusDisco', descTxt: 'txtDisco' },
    'VIEWS_DESC|ARTIST_AZ': { id: 'FUS_HALL_FAME', labelKey: 'fusHallFame', descTxt: 'txtHallFame' },
    'MY_SCROBBLES|ARTIST_AZ': { id: 'FUS_TOP_ARTISTS', labelKey: 'fusTopArtists', descTxt: 'txtTopArtists' },
    'ARTIST_AZ|VIEWS_DESC': { id: 'FUS_GREATEST_HITS', labelKey: 'fusGreatestHits', descTxt: 'txtGreatestHits' },
    'ARTIST_AZ|MY_SCROBBLES': { id: 'FUS_FAN_CLUB', labelKey: 'fusFanClub', descTxt: 'txtFanClub' },
    'ARTIST_AZ|DURATION': { id: 'FUS_ARTIST_DUR', labelKey: 'fusArtistDur', descTxt: 'txtArtistDur' }
};

function safeSetHTML(element, htmlString) {
    while (element.firstChild) element.removeChild(element.firstChild);
    const template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    element.appendChild(template.content.cloneNode(true));
}

function createIconElement(svgString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    return doc.documentElement;
}

if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.sync.get(['showWarning', 'lastFmKey', 'lastFmUser', 'appLang'], (result) => {
        if (result.showWarning !== undefined) config.showWarning = result.showWarning;
        window.LASTFM_CREDS = { key: result.lastFmKey || "", user: result.lastFmUser || "" };
        currentLang = result.appLang || 'en';
        
        renderModalTexts(); 
        atualizarTextoBotao();
        monitorarPagina();
    });

    chrome.runtime.onMessage.addListener((req) => {
        if (req.type === 'UPDATE_SETTINGS') config[req.setting] = req.value;
        if (req.type === 'UPDATE_CREDS') {
            window.LASTFM_CREDS = { key: req.key, user: req.user };
            if (document.getElementById('ytm-confirm-modal').style.display === 'flex') renderBuilder();
        }
        if (req.type === 'UPDATE_LANG') {
            currentLang = req.lang;
            renderModalTexts(); 
            atualizarTextoBotao();
        }
    });
}

function injetarTodosScripts() {
    const scripts = ["utils.js", "sorters/title.js", "sorters/artist.js", "sorters/duration.js", "sorters/popularity.js", "sorters/scrobbles.js", "sorters/album.js", "main.js"];
    function carregarProximo(index) {
        if (index >= scripts.length) return;
        const s = document.createElement('script');
        s.src = chrome.runtime.getURL(scripts[index]);
        s.onload = function() { this.remove(); carregarProximo(index + 1); };
        (document.head || document.documentElement).appendChild(s);
    }
    carregarProximo(0);
}
injetarTodosScripts();

const divContainer = document.createElement('div');
document.body.appendChild(divContainer);

let activeCriteria = []; 

function t(key) { return TRANSLATIONS[currentLang][key] || key; }

function renderModalTexts() {
    // 1. CAPTURA DE ESTADO
    const overlay = document.getElementById('ytm-overlay');
    const isOverlayActive = overlay?.classList.contains('ativo');
    
    // Verifica estados de display
    const modal = document.getElementById('ytm-confirm-modal');
    const isModalOpen = modal?.style.display === 'flex'; // ou 'block', conforme CSS

    const processView = document.getElementById('ytm-process-view');
    const isProcessOpen = processView?.style.display === 'flex';

    const securityCheck = document.getElementById('ytm-security-check');
    const isSecurityOpen = securityCheck?.style.display === 'flex';

    // Captura textos dinâmicos de progresso
    const currentStatus = document.getElementById('ytm-status')?.textContent;
    const currentDetails = document.getElementById('ytm-details')?.textContent;

    // 2. RECONSTRUÇÃO COM ESTADO PRESERVADO
    safeSetHTML(divContainer, `
    <div id="ytm-overlay" class="${isOverlayActive ? 'ativo' : ''}">
        <div id="ytm-process-view" class="ytm-centered-content" style="display: ${isProcessOpen ? 'flex' : 'none'}">
            <div id="ytm-loading-icon" class="ytm-spinner"></div>
            <div id="ytm-success-icon" style="display:none;" class="checkmark-wrapper"><div class="checkmark"></div></div>
            <div id="ytm-warning-icon-result" style="display:none; font-size: 60px; margin-bottom: 10px;">⚠️</div>
            <div>
                <div class="ytm-status-text" id="ytm-status">${isProcessOpen && currentStatus ? currentStatus : t('statusInit')}</div>
                <div class="ytm-sub-text" id="ytm-details">${isProcessOpen && currentDetails ? currentDetails : t('statusPrep')}</div>
            </div>
            <div id="ytm-stop-container"></div>
        </div>

        <div id="ytm-confirm-modal" style="display: ${isModalOpen ? 'flex' : 'none'}">
            <div style="margin-bottom:15px;">${ICONS.CONFIG}</div>
            <div class="ytm-modal-title">${t('modalTitle')}</div>

            <div class="active-header">
                <span class="active-label">${t('activeLabel')}</span>
                <span id="btn-clear-all" class="clear-btn" title="${t('btnClear')}">${ICONS.TRASH}</span>
            </div>

            <div id="active-list" class="criteria-active-area"></div>
            
            <div id="desc-text" class="description-text"></div>

            <div id="tip-container" class="tip-box" style="display:none;"></div>

            <div id="pool-list" class="criteria-pool"></div>

            <div class="reverse-switch-container">
                <div class="reverse-label">${ICONS.SWAP} ${t('lblReverse')}</div>
                <label class="switch-reverse">
                    <input type="checkbox" id="chk-reverse">
                    <span class="slider-rev"></span>
                </label>
            </div>

            <div class="ytm-btn-group">
                <button class="ytm-btn ytm-btn-cancel" id="ytm-btn-cancel">${t('btnCancel')}</button>
                <button class="ytm-btn ytm-btn-confirm" id="ytm-btn-confirm" disabled>${t('btnOrganize')}</button>
            </div>

            <div id="ytm-security-check" style="display: ${isSecurityOpen ? 'flex' : 'none'}">
                <div class="ytm-warning-icon">⚠️</div>
                <div class="ytm-modal-title">${t('securityTitle')}</div>
                <div class="security-desc">${t('securityDesc')}</div>
                <div class="ytm-btn-group">
                    <button class="ytm-btn ytm-btn-cancel" id="ytm-btn-back">${t('btnBack')}</button>
                    <button class="ytm-btn ytm-btn-confirm" id="ytm-btn-security-ok">${t('btnConfirm')}</button>
                </div>
            </div>
        </div>
    </div>
    `);
    
    // Re-injeta Stop Button
    const stopContainer = document.getElementById('ytm-stop-container');
    const btnStop = document.createElement('button');
    btnStop.className = 'stop-btn';
    btnStop.appendChild(createIconElement(ICONS.CROSS));
    btnStop.onclick = pararProcesso;
    stopContainer.appendChild(btnStop);

    bindEvents();
    renderBuilder(); // Re-renderiza os chips (que também popula a descrição correta)
}

function bindEvents() {
    document.getElementById('ytm-btn-cancel').onclick = fecharModal;
    document.getElementById('btn-clear-all').onclick = clearAllCriteria;
    
    document.getElementById('ytm-btn-confirm').onclick = () => {
        if (config.showWarning) {
            document.getElementById('ytm-security-check').style.display = 'flex';
        } else {
            iniciarProcessoReal();
        }
    };
    document.getElementById('ytm-btn-back').onclick = () => {
        document.getElementById('ytm-security-check').style.display = 'none';
    };
    document.getElementById('ytm-btn-security-ok').onclick = iniciarProcessoReal;
    document.getElementById('ytm-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'ytm-overlay') fecharModal();
    });
}

function showTip(type, htmlContent) {
    const tipBox = document.getElementById('tip-container');
    if(!tipBox) return;
    
    // CORREÇÃO: Substituído innerHTML por remoção segura de filhos
    while (tipBox.firstChild) tipBox.removeChild(tipBox.firstChild);
    
    const icon = type === 'error' ? ICONS.LOCK : ICONS.LIGHTBULB;
    const color = type === 'error' ? '#ff5555' : '#ffcc00';
    const bgColor = type === 'error' ? 'rgba(255, 85, 85, 0.1)' : 'rgba(255, 204, 0, 0.08)';
    const borderColor = type === 'error' ? 'rgba(255, 85, 85, 0.3)' : 'rgba(255, 204, 0, 0.2)';

    tipBox.style.background = bgColor;
    tipBox.style.borderColor = borderColor;
    tipBox.style.color = color;

    tipBox.appendChild(createIconElement(icon));
    
    // CORREÇÃO: Substituído innerHTML por safeSetHTML
    const span = document.createElement('span');
    safeSetHTML(span, htmlContent);
    tipBox.appendChild(span);
    
    tipBox.style.display = 'flex';
    
    if (type === 'error') {
        tipBox.animate([
            { transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }
        ], { duration: 300 });
    }
}

function checkTips() {
    const hasViews = activeCriteria.includes('VIEWS_DESC') || activeCriteria.some(c => c.includes('HALL_FAME'));
    const hasApiKey = window.LASTFM_CREDS && window.LASTFM_CREDS.key;

    const tipBox = document.getElementById('tip-container');
    if (hasViews && !hasApiKey) {
        showTip('warning', t('tipViews'));
    } else {
        tipBox.style.display = 'none';
    }
}

function updateDescription() {
    const descBox = document.getElementById('desc-text');
    if (!descBox) return;

    if (activeCriteria.length === 0) {
        descBox.textContent = "";
        return;
    }

    let idToDescribe = activeCriteria[0]; 
    let textKey = "";

    if (idToDescribe.startsWith('FUS_')) {
        const fus = Object.values(FUSIONS).find(f => f.id === idToDescribe);
        if (fus) textKey = fus.descTxt;
    } else {
        const crit = CRITERIA_IDS.find(c => c.id === idToDescribe);
        if (crit) textKey = crit.descTxt;
    }

    if (textKey) {
        descBox.textContent = t(textKey);
    }
}

function renderBuilder() {
    const activeContainer = document.getElementById('active-list');
    const poolContainer = document.getElementById('pool-list');
    const btnConfirm = document.getElementById('ytm-btn-confirm');
    const btnClear = document.getElementById('btn-clear-all');

    if (!activeContainer) return; 

    activeContainer.textContent = '';
    poolContainer.textContent = '';

    const isShuffleActive = activeCriteria.includes('SHUFFLE');
    const isFusionActive = activeCriteria.some(c => c.startsWith('FUS_'));
    const isFull = activeCriteria.length >= 2 || isFusionActive || isShuffleActive;
    let activeSingle = (activeCriteria.length === 1 && !isFusionActive && !isShuffleActive) ? activeCriteria[0] : null;

    if (activeCriteria.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-msg';
        emptyDiv.textContent = t('emptyMsg');
        activeContainer.appendChild(emptyDiv);
        btnConfirm.disabled = true;
        btnClear.style.display = 'none';
    } else {
        btnConfirm.disabled = false;
        btnClear.style.display = 'block';
        
        activeCriteria.forEach((id, index) => {
            const el = document.createElement('div');
            if (id.startsWith('FUS_')) {
                const fusInfo = Object.values(FUSIONS).find(f => f.id === id);
                el.className = 'chip chip-gold';
                safeSetHTML(el, `<div style="display:flex; align-items:center; gap:8px;">${ICONS.STAR}<span>${t(fusInfo.labelKey)}</span></div><span class="chip-remove">×</span>`);
            } else {
                const info = CRITERIA_IDS.find(c => c.id === id);
                el.className = 'chip chip-active';
                safeSetHTML(el, `<div style="display:flex; align-items:center; gap:8px;"><span class="chip-number">${index + 1}</span>${info.icon}<span>${t(info.labelKey)}</span></div><span class="chip-remove">×</span>`);
            }
            el.onclick = () => removeCriteria(id);
            activeContainer.appendChild(el);
        });
    }

    CRITERIA_IDS.forEach(crit => {
        if (activeCriteria.includes(crit.id)) return;
        
        const isScrobbles = crit.id === 'MY_SCROBBLES';
        const hasUser = window.LASTFM_CREDS && window.LASTFM_CREDS.user;
        const isDisabled = isScrobbles && !hasUser;

        let isGoldMatch = false;
        let isForbidden = false;

        if (activeSingle) {
            const pairForward = `${activeSingle}|${crit.id}`;
            const pairBackward = `${crit.id}|${activeSingle}`;
            if (FUSIONS[pairForward] || FUSIONS[pairBackward]) {
                isGoldMatch = true;
            } else {
                isForbidden = true;
            }
        } else if (isFull) {
            isForbidden = true;
        }

        const el = document.createElement('div');
        
        if (isDisabled) {
            el.className = 'chip chip-disabled';
            safeSetHTML(el, `${ICONS.LOCK} <span>${t(crit.labelKey)}</span>`);
            el.onclick = () => showTip('error', t('errScrobbles'));
        } 
        else if (isForbidden) {
            el.className = 'chip chip-disabled';
            safeSetHTML(el, `${crit.icon} <span>${t(crit.labelKey)}</span>`);
        } 
        else {
            el.className = isGoldMatch ? 'chip chip-pool-gold-hint' : 'chip chip-pool';
            safeSetHTML(el, `${crit.icon} <span>${t(crit.labelKey)}</span>`);
            el.title = t(crit.descKey);
            el.onclick = () => addCriteria(crit.id);
        }
        
        poolContainer.appendChild(el);
    });

    updateDescription();
    checkTips();
}

function checkFusion() {
    if (activeCriteria.length === 2) {
        let key = `${activeCriteria[0]}|${activeCriteria[1]}`;
        let fusion = FUSIONS[key];
        if (!fusion) {
            key = `${activeCriteria[1]}|${activeCriteria[0]}`;
            fusion = FUSIONS[key];
        }
        if (fusion) {
            activeCriteria = [fusion.id];
            renderBuilder();
        }
    }
}

function addCriteria(id) {
    if (id === 'SHUFFLE') {
        activeCriteria = ['SHUFFLE'];
    } else {
        if (activeCriteria.length < 2) {
            activeCriteria.push(id);
            checkFusion(); 
        }
    }
    renderBuilder();
}

function removeCriteria(id) {
    if (id.startsWith('FUS_')) {
        activeCriteria = [];
    } else {
        activeCriteria = activeCriteria.filter(c => c !== id);
    }
    renderBuilder();
}

function clearAllCriteria() {
    activeCriteria = [];
    renderBuilder();
}

function tratarCliqueBotao() {
    // Reconstroi UI (mas renderModalTexts agora preserva estado se já existir)
    renderModalTexts(); 
    abrirModal();
}

function abrirModal() {
    if (activeCriteria.includes('SHUFFLE')) activeCriteria = []; 
    renderBuilder();
    document.getElementById('ytm-overlay').classList.add('ativo');
    document.getElementById('ytm-process-view').style.display = 'none';
    document.getElementById('ytm-confirm-modal').style.display = 'flex';
    document.getElementById('ytm-security-check').style.display = 'none';
}

function fecharModal() {
    document.getElementById('ytm-overlay').classList.remove('ativo');
}

function pararProcesso() {
    const btn = document.querySelector('.stop-btn');
    if (btn) btn.classList.add('stopping');
    
    const statusEl = document.getElementById('ytm-status');
    if (statusEl) statusEl.textContent = t('statusStopping');
    
    window.postMessage({ type: "CMD_STOP_SORT" }, window.location.origin);
}

function iniciarProcessoReal() {
    if (activeCriteria.length === 0) return;
    const isReverse = document.getElementById('chk-reverse')?.checked || false;

    document.getElementById('ytm-confirm-modal').style.display = 'none';
    document.getElementById('ytm-security-check').style.display = 'none';
    document.getElementById('ytm-process-view').style.display = 'flex';
    document.getElementById('ytm-loading-icon').style.display = 'block'; 
    document.getElementById('ytm-warning-icon-result').style.display = 'none';
    
    const btnStop = document.querySelector('.stop-btn');
    if (btnStop) {
        btnStop.classList.remove('stopping');
        btnStop.style.display = 'flex';
    }

    atualizarTexto(t('statusConnect'), t('statusPrep'));
    
    window.postMessage({ 
        type: "CMD_START_SORT", 
        modes: activeCriteria, 
        reverse: isReverse,
        creds: window.LASTFM_CREDS 
    }, window.location.origin);
}

function atualizarTexto(titulo, subtitulo) { 
    const elT = document.getElementById('ytm-status');
    const elS = document.getElementById('ytm-details');
    if (elT) elT.textContent = titulo; 
    if (elS) elS.textContent = subtitulo; 
}

function mostrarSucesso(d) {
    document.getElementById('ytm-loading-icon').style.display = 'none';
    const btnStop = document.querySelector('.stop-btn');
    if(btnStop) btnStop.style.display = 'none';

    if (d && d.falhas > 0) {
        const warningIcon = document.getElementById('ytm-warning-icon-result');
        safeSetHTML(warningIcon, ICONS.WARNING);
        warningIcon.style.display = 'block';
        atualizarTexto(t('statusWarn'), t('statusWarnMsg').replace('$1', d.falhas));
        setTimeout(() => window.location.reload(), 4000);
    } else {
        document.getElementById('ytm-success-icon').style.display = 'flex';
        atualizarTexto(t('statusDone'), t('statusDoneMsg'));
        setTimeout(() => window.location.reload(), 2000);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('ytm-overlay')?.classList.contains('ativo')) fecharModal();
});

window.addEventListener("message", (e) => {
    if (e.origin !== window.location.origin) return;
    if (!e.data.type) return;
    
    if (e.data.type === 'UI_UPDATE') atualizarTexto(e.data.title, e.data.subtitle);
    if (e.data.type === 'UI_SUCCESS') mostrarSucesso(e.data.dados);
    if (e.data.type === 'UI_ERROR') { alert(e.data.message); fecharModal(); }
    
    if (e.data.type === 'UI_STOPPED') {
        document.getElementById('ytm-loading-icon').style.display = 'none';
        atualizarTexto(t('statusStopped'), "");
        setTimeout(() => window.location.reload(), 1500);
    }
});

function criarBotao() {
    if (document.getElementById("botao-organizar-ytm")) return;
    const btn = document.createElement("button");
    safeSetHTML(btn, `${ICONS.MAIN_BTN} ...`);
    btn.id = "botao-organizar-ytm";
    btn.onclick = tratarCliqueBotao;
    btn.style.display = 'none';
    document.body.appendChild(btn);
    monitorarPagina();
}

function atualizarTextoBotao() {
    const btn = document.getElementById("botao-organizar-ytm");
    if (btn) safeSetHTML(btn, `${ICONS.MAIN_BTN} ${t('mainBtn')}`);
}

let currentUrl = location.href;
function monitorarPagina() {
    const btn = document.getElementById("botao-organizar-ytm");
    if (!btn) return;
    atualizarTextoBotao();

    const urlParams = new URLSearchParams(window.location.search);
    const listId = urlParams.get('list');
    const isPlaylistPage = window.location.href.includes("playlist?list=");

    const isEditable = listId && !listId.startsWith('O');

    if (isPlaylistPage && isEditable) { 
        btn.style.display = 'flex'; 
        setTimeout(()=>btn.classList.add("visivel"), 10); 
    } else { 
        btn.classList.remove("visivel"); 
        setTimeout(()=>{ 
            const currentParams = new URLSearchParams(window.location.search);
            const currentId = currentParams.get('list');
            if(!window.location.href.includes("playlist?list=") || (currentId && currentId.startsWith('O'))) {
                btn.style.display='none';
            }
        }, 300); 
    }
}

const observer = new MutationObserver(() => {
    if (location.href !== currentUrl) {
        currentUrl = location.href;
        monitorarPagina();
    }
    if (location.href.includes("playlist?list=") && !document.getElementById("botao-organizar-ytm")) {
        criarBotao();
    }
});
observer.observe(document.body, { childList: true, subtree: true });

setTimeout(criarBotao, 1000);