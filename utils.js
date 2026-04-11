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
// --- EXPORTAR LOGS DE DIAGNÓSTICO ---
window.YTM.exportarLogs = function() {
    const diag = window.YTM._diag;
    if (!diag) {
        console.error('[YTM] Nenhum dado de diagnóstico. Rode uma ordenação por Popularidade primeiro.');
        return;
    }

    function download(filename, content) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // === ARQUIVO 1: Músicas da Playlist ===
    let txt1 = '=== MÚSICAS DA PLAYLIST (resultado do enriquecimento) ===\n\n';
    
    // Agrupa por artista
    const porArtista = {};
    for (const m of diag.playlist) {
        const key = m.artista || 'Desconhecido';
        if (!porArtista[key]) porArtista[key] = [];
        porArtista[key].push(m);
    }

    const artistasOrdenados = Object.keys(porArtista).sort((a, b) => 
        a.toLowerCase().localeCompare(b.toLowerCase())
    );

    let totalOk = 0, totalFail = 0;
    for (const artista of artistasOrdenados) {
        const musicas = porArtista[artista];
        musicas.sort((a, b) => a.titulo.localeCompare(b.titulo));

        txt1 += `\n--- ${artista} (${musicas.length} músicas) ---\n`;
        for (const m of musicas) {
            if (m.views === -1) {
                txt1 += `  [FALHA] "${m.titulo}" | canonical: "${m.canonical}" | NÃO ENCONTRADA\n`;
                totalFail++;
            } else {
                txt1 += `  [OK]    "${m.titulo}" | canonical: "${m.canonical}" | ${m.views} listeners | via ${m.source}\n`;
                totalOk++;
            }
        }
    }
    txt1 += `\n=== RESUMO: ${totalOk} OK, ${totalFail} FALHAS, ${diag.playlist.length} TOTAL ===\n`;

    // === ARQUIVO 2: Dados do Last.fm ===
    let txt2 = '=== TOP TRACKS DO LAST.FM (dados brutos retornados pela API) ===\n\n';
    
    if (diag.lastfm) {
        const artistasLfm = Object.keys(diag.lastfm).sort((a, b) => 
            a.toLowerCase().localeCompare(b.toLowerCase())
        );

        for (const artista of artistasLfm) {
            const tracks = diag.lastfm[artista] || [];
            txt2 += `\n--- ${artista} (${tracks.length} tracks no Top) ---\n`;
            // Ordena por listeners desc
            const sorted = [...tracks].sort((a, b) => b.listeners - a.listeners);
            for (let i = 0; i < sorted.length; i++) {
                const t = sorted[i];
                txt2 += `  #${String(i+1).padStart(4, ' ')} | ${String(t.listeners).padStart(10, ' ')} listeners | "${t.originalName}" (canonical: "${t.canonical}")\n`;
            }
        }
    } else {
        txt2 += 'Last.fm não foi utilizado (sem API key configurada).\n';
    }

    download('playlist_musicas.txt', txt1);
    setTimeout(() => download('lastfm_dados.txt', txt2), 500);

    console.log('[YTM] ✅ 2 arquivos baixados: playlist_musicas.txt e lastfm_dados.txt');
};

// --- PARSER ATUALIZADO ---
window.YTM.Parser = {
    getTotalPlaylistCount: () => {
        try {
            const selectors = [
                'ytmusic-editable-playlist-detail-header-renderer .second-subtitle-container .second-subtitle',
                'ytmusic-responsive-header-renderer .second-subtitle-container .second-subtitle',
                '.second-subtitle'
            ];

            let subtitle = null;
            for (let sel of selectors) {
                subtitle = document.querySelector(sel);
                if (subtitle) break;
            }
            if (!subtitle) return null;

            const text = subtitle.textContent;
            console.log(`[YTM] Subtitle raw: "${text}"`);

            // MÉTODO 1: Regex direta — busca "N itens", "N songs", "N tracks", "N músicas"
            // Funciona independente do separador (•, ·, espaço, etc.)
            const itemRegex = /(\d[\d.,]*)\s*(iten|item|song|track|músic|music)/i;
            const match = text.match(itemRegex);
            if (match) {
                const num = parseInt(match[1].replace(/\D/g, ''), 10);
                if (num > 0 && num < 100000) {
                    console.log(`[YTM] ✅ Total detectado: ${num} (via regex: "${match[0]}")`);
                    return num;
                }
            }

            // MÉTODO 2: Fallback via spans individuais
            // Cada span filho contém um pedaço separado do subtitle
            const spans = subtitle.querySelectorAll('span');
            for (const span of spans) {
                const spanText = span.textContent.trim();
                if (spanText.match(/(iten|item|song|track|músic|music)/i)) {
                    const numStr = spanText.replace(/\D/g, '');
                    if (numStr) {
                        const num = parseInt(numStr, 10);
                        if (num > 0 && num < 100000) {
                            console.log(`[YTM] ✅ Total detectado: ${num} (via span: "${spanText}")`);
                            return num;
                        }
                    }
                }
            }

            console.warn(`[YTM] ⚠️ Não encontrou contagem de itens no subtitle: "${text}"`);
            return null;
        } catch (e) { 
            console.error('[YTM] Erro no parser:', e);
            return null; 
        }
    },

    extrairDadosBasicos: (item, index) => {
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
                randomSeed: Math.random(),
                originalIndex: index || 0
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