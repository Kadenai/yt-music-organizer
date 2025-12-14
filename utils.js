// utils.js - A Fundação e Namespace Global (v4.0 - Performance Engine)

window.YTM = window.YTM || {};

// Configurações Globais Ajustadas para Performance
window.YTM.config = {
    BATCH_SIZE: 50,        // Reduzi o lote de salvamento para evitar travamentos na UI do YouTube
    DELAY_BATCH: 100,      // Pausa entre lotes de salvamento
    DELAY_SCROLL: 2000,
    CONCURRENCY_LIMIT: 3,  // Máximo de requisições simultâneas (Semaforo)
    CACHE_TTL_HOURS: 72    // Cache dura 3 dias
};

// ============================================================================
// 1. SISTEMA DE CACHE PERSISTENTE (NOVO)
// ============================================================================
window.YTM.Cache = {
    prefix: 'YTM_ORG_V1_',

    get: (key) => {
        try {
            const record = localStorage.getItem(window.YTM.Cache.prefix + key);
            if (!record) return null;
            
            const parsed = JSON.parse(record);
            // Verifica validade
            if (Date.now() > parsed.expiry) {
                localStorage.removeItem(window.YTM.Cache.prefix + key);
                return null;
            }
            return parsed.data;
        } catch (e) {
            return null;
        }
    },

    set: (key, data) => {
        try {
            const expiry = Date.now() + (window.YTM.config.CACHE_TTL_HOURS * 60 * 60 * 1000);
            const record = { data: data, expiry: expiry };
            localStorage.setItem(window.YTM.Cache.prefix + key, JSON.stringify(record));
        } catch (e) {
            // Se o storage encher, limpa tudo e tenta de novo (Garbage Collection brutal)
            console.warn("[YTM Cache] Storage cheio. Limpando cache antigo...");
            window.YTM.Cache.clearAll();
        }
    },

    clearAll: () => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(window.YTM.Cache.prefix)) {
                localStorage.removeItem(key);
            }
        });
    }
};

// ============================================================================
// 2. SISTEMA DE FILA (THROTTLING) (NOVO)
// ============================================================================
// Garante que o navegador não congele com excesso de requisições
window.YTM.Queue = {
    activeCount: 0,
    queue: [],
    
    // Adiciona uma tarefa (função que retorna Promise) à fila
    add: (taskFn) => {
        return new Promise((resolve, reject) => {
            window.YTM.Queue.queue.push({ taskFn, resolve, reject });
            window.YTM.Queue.next();
        });
    },

    next: () => {
        // Se já tem gente demais rodando ou fila vazia, para.
        if (window.YTM.Queue.activeCount >= window.YTM.config.CONCURRENCY_LIMIT || window.YTM.Queue.queue.length === 0) {
            return;
        }

        window.YTM.Queue.activeCount++;
        const { taskFn, resolve, reject } = window.YTM.Queue.queue.shift();

        // Executa a tarefa
        taskFn()
            .then(resolve)
            .catch(reject)
            .finally(() => {
                window.YTM.Queue.activeCount--;
                // Dá um "respiro" minúsculo para a UI não travar antes do próximo
                setTimeout(window.YTM.Queue.next, 5); 
            });
    },

    // Limpa a fila (útil para o botão STOP)
    clear: () => {
        window.YTM.Queue.queue = [];
    }
};

// ============================================================================
// 3. FERRAMENTAS COMUNS (TEXTO E TEMPO)
// ============================================================================
window.YTM.Common = {
    // Yield: Pausa a execução para deixar a UI responder (botão parar, spinner, etc)
    yield: () => new Promise(resolve => setTimeout(resolve, 0)),

    cleanText: (text) => {
        if (!text) return "";
        return text.toLowerCase()
            .replace(/\(official video\)/g, '').replace(/\(official audio\)/g, '')
            .replace(/\(lyrics\)/g, '').replace(/\[.*?\]/g, '')
            .replace(/\(.*?ver.*?\)/g, '').replace(/\(.*?remaster.*?\)/g, '')
            .trim();
    },
    createCanonicalId: (text) => {
        if (!text) return "";
        let clean = window.YTM.Common.cleanText(text);
        clean = clean.replace(/\((feat|ft|part|with).*?\)/g, '').replace(/\[(feat|ft|part|with).*?\]/g, '');
        clean = clean.split(/\s(?:feat\.|ft\.|part\.|with)\s/)[0];
        return clean.replace(/[^a-z0-9]/g, '');
    },
    parseDuration: (text) => {
        if (!text) return 0;
        const parts = text.split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return 0;
    }
};

// ============================================================================
// 4. PARSER (LEITURA DO DOM DO YOUTUBE)
// ============================================================================
window.YTM.Parser = {
    getTotalPlaylistCount: () => {
        try {
            const subtitle = document.querySelector('ytmusic-responsive-header-renderer .second-subtitle');
            if (!subtitle) return null;
            const text = subtitle.textContent;
            const parts = text.split(/[•·]/); 
            for (let part of parts) {
                part = part.trim();
                if (part.match(/(\d+:|hora|hour|min|sec)/i)) continue;
                if (part.match(/^(19|20)\d{2}$/)) continue;
                const numStr = part.replace(/\D/g, '');
                if (numStr && numStr.length > 0) return parseInt(numStr, 10);
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