// utils.js - Versão 6.0 (Production Cleanup)

window.YTM = window.YTM || {};
window.YTM.debugMode = false;

window.YTM.config = {
    BATCH_SIZE: 50,
    DELAY_BATCH: 400,   // 100ms estava agressivo demais — gerava 409 ABORTED em sorts grandes
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
            if (window.YTM.debugMode) console.log(`[YTM] Subtitle raw: "${text}"`);

            // MÉTODO 1: Regex direta — busca "N itens", "N songs", "N tracks", "N músicas"
            // Funciona independente do separador (•, ·, espaço, etc.)
            const itemRegex = /(\d[\d.,]*)\s*(iten|item|song|track|músic|music)/i;
            const match = text.match(itemRegex);
            if (match) {
                const num = parseInt(match[1].replace(/\D/g, ''), 10);
                if (num > 0 && num < 100000) {
                    if (window.YTM.debugMode) console.log(`[YTM] ✅ Total detectado: ${num} (via regex: "${match[0]}")`);
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
                            if (window.YTM.debugMode) console.log(`[YTM] ✅ Total detectado: ${num} (via span: "${spanText}")`);
                            return num;
                        }
                    }
                }
            }

            if (window.YTM.debugMode) console.warn(`[YTM] ⚠️ Não encontrou contagem de itens no subtitle: "${text}"`);
            return null;
        } catch (e) {
            if (window.YTM.debugMode) console.error('[YTM] Erro no parser:', e);
            return null;
        }
    },

    extrairDadosBasicos: (item, index) => {
        const videoId = item?.playlistItemData?.videoId || null;
        const setVideoId = item?.playlistItemData?.playlistSetVideoId || null;
        try {
            const cols = item?.flexColumns;

            // Único campo realmente obrigatório: o título.
            const tituloRuns = cols?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
            if (!tituloRuns || tituloRuns.length === 0 || !tituloRuns[0]?.text) {
                if (window.YTM.debugMode) console.warn('[YTM] Parser: item sem título extraível', { videoId, setVideoId });
                return null;
            }
            const tituloRaw = tituloRuns[0].text;

            let artista = "Desconhecido";
            let album = "";

            try {
                const runs = cols?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
                if (runs && runs.length > 0) {
                    artista = runs[0]?.text || "Desconhecido";
                    if (runs.length >= 3) {
                        album = runs[2]?.text || "";
                    }
                }
                if (!album) {
                    const albRuns = cols?.[2]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
                    if (albRuns && albRuns[0]?.text) album = albRuns[0].text;
                }
            } catch (e) {
                if (window.YTM.debugMode) console.warn('[YTM] Parser: falhou em artista/álbum', { videoId, msg: e.message });
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
            try {
                const durText = item?.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text;
                if (durText) durationSec = window.YTM.Common.parseDuration(durText);
            } catch (e) {
                if (window.YTM.debugMode) console.warn('[YTM] Parser: falhou em duração', { videoId, msg: e.message });
            }

            return {
                tituloOriginal: tituloRaw,
                titulo: window.YTM.Common.cleanText(tituloClean),
                artista: window.YTM.Common.cleanText(artista),
                artistaOriginal: artista,
                albumOriginal: album,
                canonical: window.YTM.Common.createCanonicalId(tituloClean),
                id: setVideoId,
                videoId: videoId,
                album: album || "", year: 9999, trackNumber: 999, discNumber: 1, source: "none",
                views: -1, userPlays: -1,
                duration: durationSec,
                randomSeed: Math.random(),
                originalIndex: index || 0
            };
        } catch (e) {
            if (window.YTM.debugMode) console.warn('[YTM] Parser falhou em item', { videoId, setVideoId, msg: e.message });
            return null;
        }
    }
};

// Constrói o texto do diagnóstico (separado para reuso)
window.YTM.construirDiagTxt = function(d) {
    if (!d) return null;
    let out = '';
    out += `===== YTM SORT DIAGNOSTIC =====\n`;
    out += `version:        ${d.version}\n`;
    out += `timestamp:      ${d.ts}\n`;
    out += `modes:          ${JSON.stringify(d.modes)}\n`;
    out += `isReverse:      ${d.isReverse}\n`;
    out += `topId:          ${d.topId}\n`;
    out += `\n----- CONTAGEM -----\n`;
    out += `metaTotal (subtitle):  ${d.metaTotal}\n`;
    out += `domCount:              ${d.domCount}\n`;
    out += `contentsCount:         ${d.contentsCount}\n`;
    out += `listaCount:            ${d.listaCount}\n`;
    out += `rendererOrphans:       ${d.rendererOrphans.length}\n`;
    out += `domOnlyOrphans:        ${d.domOnlyOrphans.length}\n`;
    out += `\n----- ÓRFÃOS (renderer) -----\n`;
    if (d.rendererOrphans.length === 0) out += '(nenhum)\n';
    else d.rendererOrphans.forEach(o => {
        out += `  "${o.titulo}" — ${o.artista}  setVideoId=${o.id}  videoId=${o.videoId}\n`;
    });
    out += `\n----- ÓRFÃOS (só DOM, ausentes em data.contents) -----\n`;
    if (d.domOnlyOrphans.length === 0) out += '(nenhum)\n';
    else d.domOnlyOrphans.forEach(o => {
        out += `  "${o.titulo}" — ${o.artista}  setVideoId=${o.id}  videoId=${o.videoId}\n`;
    });
    out += `\n----- AMOSTRA LISTA (pré-sort) -----\n`;
    out += `Primeiros 3:\n`;
    d.listaSample.primeiros.forEach(s => out += `  ${s}\n`);
    out += `Últimos 3:\n`;
    d.listaSample.ultimos.forEach(s => out += `  ${s}\n`);
    out += `\n----- AMOSTRA SORT (pós-sort) -----\n`;
    out += `Primeiros 5:\n`;
    d.sortedSample.primeiros.forEach(s => out += `  ${s}\n`);
    out += `Últimos 5:\n`;
    d.sortedSample.ultimos.forEach(s => out += `  ${s}\n`);

    out += `\n----- LOTES API -----\n`;
    d.batches.forEach(b => {
        out += `Lote ${b.batchNum}: items=${b.items} acts=${b.acts} status=${b.status}`;
        if (b.attempts && b.attempts > 1) out += `  tentativas=${b.attempts}`;
        if (b.skipped && b.skipped.length) out += `  pulados=${b.skipped.length}`;
        if (b.errorBody) out += `\n  ERRO: ${b.errorBody}`;
        out += '\n';
        if (b.skipped && b.skipped.length) {
            b.skipped.forEach(s => out += `    [pulado: ${s.motivo}] "${s.titulo}" id=${s.id}\n`);
        }
    });

    return out;
};

// Exporta diagnóstico do último sort em arquivo .txt + backup em localStorage.
// Útil em debug: window.YTM.debugMode = true → rodar sort → window.YTM.exportarSortLogs()
window.YTM.exportarSortLogs = function() {
    const d = window.YTM._sortDiag;
    if (!d) {
        // Fallback: tenta recuperar do localStorage (após reload).
        const cached = localStorage.getItem('YTM_LAST_SORT_DIAG');
        if (cached) {
            console.log('[YTM] Recuperando diagnóstico do localStorage (sort anterior)...');
            const blob = new Blob([cached], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ytm_sort_diag_recovered_${Date.now()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            console.log('[YTM] ✅ ytm_sort_diag_recovered.txt baixado (do localStorage).');
            return;
        }
        console.error('[YTM] Nenhum diagnóstico de sort disponível. Ative window.YTM.debugMode = true e repita o sort.');
        return;
    }
    const out = window.YTM.construirDiagTxt(d);
    try { localStorage.setItem('YTM_LAST_SORT_DIAG', out); } catch (e) {}
    const blob = new Blob([out], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ytm_sort_diag_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('[YTM] ✅ ytm_sort_diag.txt baixado + backup em localStorage.');
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
