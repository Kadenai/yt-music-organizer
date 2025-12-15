// utils.js - Versão 5.0 (Header Parser V3 - Compatible with Editable Playlists)

window.YTM = window.YTM || {};

window.YTM.config = {
    BATCH_SIZE: 50,
    DELAY_BATCH: 100,
    DELAY_SCROLL: 2000,
    CONCURRENCY_LIMIT: 3,
    CACHE_TTL_HOURS: 72
};

// --- CACHE & QUEUE (Mantidos iguais) ---
window.YTM.Cache = {
    prefix: 'YTM_ORG_V1_',
    get: (key) => {
        try {
            const record = localStorage.getItem(window.YTM.Cache.prefix + key);
            if (!record) return null;
            const parsed = JSON.parse(record);
            if (Date.now() > parsed.expiry) {
                localStorage.removeItem(window.YTM.Cache.prefix + key);
                return null;
            }
            return parsed.data;
        } catch (e) { return null; }
    },
    set: (key, data) => {
        try {
            const expiry = Date.now() + (window.YTM.config.CACHE_TTL_HOURS * 60 * 60 * 1000);
            localStorage.setItem(window.YTM.Cache.prefix + key, JSON.stringify({ data, expiry }));
        } catch (e) { window.YTM.Cache.clearAll(); }
    },
    clearAll: () => {
        Object.keys(localStorage).forEach(k => { if(k.startsWith(window.YTM.Cache.prefix)) localStorage.removeItem(k); });
    }
};

window.YTM.Queue = {
    activeCount: 0, queue: [],
    add: (taskFn) => {
        return new Promise((resolve, reject) => {
            window.YTM.Queue.queue.push({ taskFn, resolve, reject });
            window.YTM.Queue.next();
        });
    },
    next: () => {
        if (window.YTM.Queue.activeCount >= window.YTM.config.CONCURRENCY_LIMIT || window.YTM.Queue.queue.length === 0) return;
        window.YTM.Queue.activeCount++;
        const { taskFn, resolve, reject } = window.YTM.Queue.queue.shift();
        taskFn().then(resolve).catch(reject).finally(() => {
            window.YTM.Queue.activeCount--;
            setTimeout(window.YTM.Queue.next, 5); 
        });
    },
    clear: () => { window.YTM.Queue.queue = []; }
};

window.YTM.Common = {
    yield: () => new Promise(resolve => setTimeout(resolve, 0)),
    cleanText: (text) => text ? text.toLowerCase().replace(/\(official video\)/g, '').replace(/\(lyrics\)/g, '').trim() : "",
    createCanonicalId: (text) => {
        if (!text) return "";
        let clean = window.YTM.Common.cleanText(text);
        clean = clean.split(/\s(?:feat\.|ft\.|part\.|with)\s/)[0];
        return clean.replace(/[^a-z0-9]/g, '');
    },
    parseDuration: (text) => {
        if (!text) return 0;
        const parts = text.split(':').map(Number);
        return parts.length === 2 ? parts[0] * 60 + parts[1] : (parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : 0);
    }
};

// --- PARSER ATUALIZADO ---
window.YTM.Parser = {
    getTotalPlaylistCount: () => {
        try {
            // Lista de possíveis locais onde o YouTube esconde o contador
            const selectors = [
                // 1. Playlists Editáveis (Sua imagem)
                'ytmusic-editable-playlist-detail-header-renderer .second-subtitle-container .second-subtitle',
                // 2. Playlists de Terceiros / Álbuns
                'ytmusic-responsive-header-renderer .second-subtitle-container .second-subtitle',
                // 3. Fallback genérico
                '.second-subtitle'
            ];

            let subtitle = null;
            for (let sel of selectors) {
                subtitle = document.querySelector(sel);
                if (subtitle) break;
            }

            if (!subtitle) return null;

            // Pega todo o texto (incluindo spans filhos)
            // Ex: "Playlist • 2025 • 497 itens • Mais de 9 horas"
            const text = subtitle.textContent;
            
            // Quebra por separadores comuns do YouTube
            const parts = text.split(/[•·]/); 

            for (let part of parts) {
                part = part.trim();
                
                // 1. Ignora Duração (tem ':', 'hora', 'min', 'sec')
                if (part.match(/(\d+:|hora|hour|min|sec)/i)) continue;

                // 2. Ignora Ano (4 dígitos, começa com 19 ou 20)
                if (part.match(/^(19|20)\d{2}$/)) continue;

                // 3. Ignora palavras chaves de tipo
                if (part.match(/^(playlist|album|single|ep)$/i)) continue;

                // 4. Extrai números
                const numStr = part.replace(/\D/g, '');
                
                // Se sobrou um número, é a quantidade de itens!
                if (numStr && numStr.length > 0) {
                    const num = parseInt(numStr, 10);
                    // Filtro de sanidade: playlists raramente tem 0 ou números absurdos como ano
                    if (num > 0 && num < 100000) return num;
                }
            }
            return null;
        } catch (e) { return null; }
    },

    extrairDadosBasicos: (item) => {
        try {
            const cols = item.flexColumns;
            const tituloRaw = cols[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
            let artista = "Desconhecido";
            let album = ""; 
            
            if (cols[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs) {
                const runs = cols[1].musicResponsiveListItemFlexColumnRenderer.text.runs;
                if (runs.length >= 3) {
                    artista = runs[0].text;
                    album = runs[2].text;
                } else {
                    artista = runs[0].text;
                }
            }
            if (!album && cols.length > 2 && cols[2]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs) {
                album = cols[2].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
            }

            let tituloClean = tituloRaw;
            if (artista === "Desconhecido" || artista === "Vários Artistas") {
                if (tituloRaw.includes(" - ")) {
                    const parts = tituloRaw.split(" - ");
                    artista = parts[0].trim();
                    tituloClean = parts[1].trim();
                }
            }
            
            let durationSec = 0;
            if (item.fixedColumns && item.fixedColumns.length > 0) {
                const durText = item.fixedColumns[0].musicResponsiveListItemFixedColumnRenderer.text.runs[0].text;
                durationSec = window.YTM.Common.parseDuration(durText);
            }
    
            return {
                tituloOriginal: tituloRaw,
                titulo: window.YTM.Common.cleanText(tituloClean),
                artista: window.YTM.Common.cleanText(artista),
                artistaOriginal: artista,
                albumOriginal: album,
                canonical: window.YTM.Common.createCanonicalId(tituloClean),
                id: item.playlistItemData.playlistSetVideoId,
                videoId: item.playlistItemData.videoId, 
                album: album || "", year: 9999, trackNumber: 999, discNumber: 1, source: "none", 
                views: -1, userPlays: -1,
                duration: durationSec,
                randomSeed: Math.random()
            };
        } catch (e) { return null; }
    }
};

window.YTM.UI = {
    send: (type, payload = {}) => window.postMessage({ type, ...payload }, window.location.origin),
    update: (title, subtitle) => window.YTM.UI.send('UI_UPDATE', { title, subtitle }),
    error: (message) => window.YTM.UI.send('UI_ERROR', { message }),
    success: (falhas) => window.YTM.UI.send('UI_SUCCESS', { dados: { falhas } })
};

window.YTM.Auth = {
    getCookie: (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    },
    generateHeader: async () => {
        const sapisid = window.YTM.Auth.getCookie("SAPISID");
        if (!sapisid) return null;
        const time = Math.floor(Date.now() / 1000);
        const origin = window.location.origin;
        const payload = `${time} ${sapisid} ${origin}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(payload);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return `SAPISIDHASH ${time}_${hashHex}`;
    },
    getClientInfo: () => {
        if (!window.ytcfg) return null;
        const context = window.ytcfg.get("INNERTUBE_CONTEXT");
        return {
            context: context,
            apiKey: window.ytcfg.get("INNERTUBE_API_KEY"),
            clientName: context?.client?.clientName || "WEB_REMIX",
            clientVersion: context?.client?.clientVersion || "1.20230101",
            authUser: window.ytcfg.get("SESSION_INDEX") || "0"
        };
    }
};

window.YTM.sorters = {};