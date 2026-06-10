// sorters/popularity.js - Versão 2.0 (Robust Matching + Cache + Fallback)

(function() {

    const t = (key) => (window.I18N && window.I18N.t) ? window.I18N.t(key) : key;

    // ==========================================
    // NORMALIZAÇÃO DE TÍTULO (P1 + P9)
    // ==========================================
    function normalizeTitle(text) {
        if (!text) return "";
        let clean = text.toLowerCase();
        // 1. Remove conteúdo entre parênteses/colchetes (Live, Remaster, Official Audio, etc.)
        clean = clean.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '');
        // 2. Corta TUDO após " - " (sufixos são quase sempre metadata)
        clean = clean.replace(/\s+-\s+.*/g, '');
        // 3. Trata medleys: pega só a primeira música (antes de " / ")
        clean = clean.split(/\s*\/\s*/)[0];
        // 4. Remove feats
        clean = clean.split(/\s(?:feat\.|ft\.|part\.|with)\s/)[0];
        // 5. Acentos viram letra base; mantém letras/números de qualquer alfabeto
        //    (títulos em coreano/japonês/cirílico não viram identidade vazia).
        clean = window.YTM.Common.stripDiacritics(clean);
        return clean.replace(/[^\p{L}\p{N}]/gu, '');
    }

    // ==========================================
    // NORMALIZAÇÃO DE ARTISTA (P3)
    // ==========================================
    function normalizeArtist(artistName) {
        if (!artistName) return "";
        // Remove " • Artist B" (YT Music collaborative separator)
        if (artistName.includes(" • ")) return artistName.split(" • ")[0].trim();
        return artistName.trim();
    }

    // ==========================================
    // LEVENSHTEIN DISTANCE (P2)
    // ==========================================
    function levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        
        // Optimization: use single-row DP to save memory
        const bLen = b.length;
        let prev = new Array(bLen + 1);
        let curr = new Array(bLen + 1);
        
        for (let j = 0; j <= bLen; j++) prev[j] = j;
        
        for (let i = 1; i <= a.length; i++) {
            curr[0] = i;
            for (let j = 1; j <= bLen; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                curr[j] = Math.min(
                    prev[j] + 1,      // deletion
                    curr[j - 1] + 1,   // insertion
                    prev[j - 1] + cost // substitution
                );
            }
            [prev, curr] = [curr, prev];
        }
        return prev[bLen];
    }

    // ==========================================
    // FUZZY MATCHING — 3 Níveis (P2)
    // ==========================================
    function findBestMatch(canonicalLocal, topList) {
        // Identidade vazia casaria com qualquer coisa — nunca usar para match.
        if (!canonicalLocal) return null;

        // Nível 1: Match exato
        const exact = topList.find(t => t.canonical && t.canonical === canonicalLocal);
        if (exact) return exact;

        // Nível 2: Um contém o outro (nomes truncados/estendidos)
        if (canonicalLocal.length >= 5) {
            const contains = topList.find(t => 
                (t.canonical.includes(canonicalLocal) || canonicalLocal.includes(t.canonical)) &&
                Math.min(t.canonical.length, canonicalLocal.length) >= 5
            );
            if (contains) return contains;
        }

        // Nível 3: Distância de Levenshtein (para typos)
        if (canonicalLocal.length >= 5) {
            let bestScore = Infinity;
            let bestCandidate = null;
            for (const t of topList) {
                // Skip candidates with very different lengths (optimization)
                if (Math.abs(t.canonical.length - canonicalLocal.length) > 5) continue;
                
                const maxLen = Math.max(t.canonical.length, canonicalLocal.length);
                const dist = levenshteinDistance(t.canonical, canonicalLocal);
                const ratio = dist / maxLen;
                // Aceita até 20% de diferença
                if (ratio < 0.2 && dist < bestScore) {
                    bestScore = dist;
                    bestCandidate = t;
                }
            }
            if (bestCandidate) return bestCandidate;
        }

        return null;
    }

    // ==========================================
    // API 1: Last.fm Top Tracks (COM CACHE — P5)
    // ==========================================
    async function fetchArtistTopTracks(artistName, apiKey) {
        const cacheKey = 'LASTFM_TOP_' + window.YTM.Common.cacheKey(artistName);
        
        // 1. Tenta cache local (instantâneo)
        const cached = window.YTM.Cache.get(cacheKey);
        if (cached) return cached;

        // 2. Busca na API
        try {
            const url = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=${encodeURIComponent(artistName)}&api_key=${apiKey}&format=json&limit=1000&autocorrect=1`;
            const response = await fetch(url);
            const json = await response.json();
            if (json.toptracks && json.toptracks.track) {
                const raw = json.toptracks.track.map(t => ({
                    canonical: normalizeTitle(t.name), 
                    listeners: parseInt(t.listeners),
                    originalName: t.name
                }));

                // 3. Agregar duplicatas: soma listeners de versões com mesmo canonical
                // Ex: "The Trooper" + "The Trooper - 2015 Remaster" → soma total
                const aggregated = {};
                for (const t of raw) {
                    if (aggregated[t.canonical]) {
                        aggregated[t.canonical].listeners += t.listeners;
                        // Mantém o originalName da versão com mais listeners
                        if (t.listeners > aggregated[t.canonical].maxSingle) {
                            aggregated[t.canonical].originalName = t.originalName;
                            aggregated[t.canonical].maxSingle = t.listeners;
                        }
                    } else {
                        aggregated[t.canonical] = {
                            canonical: t.canonical,
                            listeners: t.listeners,
                            originalName: t.originalName,
                            maxSingle: t.listeners
                        };
                    }
                }
                const result = Object.values(aggregated).map(t => ({
                    canonical: t.canonical,
                    listeners: t.listeners,
                    originalName: t.originalName
                }));

                // 4. Salva no cache (72h via config)
                window.YTM.Cache.set(cacheKey, result);
                return result;
            }
            return [];
        } catch (e) { return []; }
    }

    // ==========================================
    // API 1b: Last.fm Track Info — Fallback pontual (P8)
    // ==========================================
    async function fetchTrackInfo(artistName, trackName, apiKey) {
        const cacheKey = 'LASTFM_TRACK_' + window.YTM.Common.cacheKey(`${artistName}_${trackName}`);
        
        const cached = window.YTM.Cache.get(cacheKey);
        if (cached) return cached;

        try {
            const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${apiKey}&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackName)}&format=json&autocorrect=1`;
            const response = await fetch(url);
            const json = await response.json();
            if (json.track && json.track.listeners) {
                const result = { listeners: parseInt(json.track.listeners) };
                window.YTM.Cache.set(cacheKey, result);
                return result;
            }
            return null;
        } catch (e) { return null; }
    }

    // ==========================================
    // API 2: YouTube Views — Fallback com Retry (P6 + P11)
    // ==========================================
    async function buscarViewsYouTube(musica, urlEndpoint, context, maxRetries) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const payload = { context, videoId: musica.videoId };
                const response = await fetch(urlEndpoint, { 
                    method: "POST", 
                    headers: { "Content-Type": "application/json" }, 
                    body: JSON.stringify(payload) 
                });

                if (response.status === 429) {
                    // Rate limit — exponential backoff
                    const wait = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
                    window.YTM.UI.update("Rate limit...", `Aguardando ${wait/1000}s...`);
                    await new Promise(r => setTimeout(r, wait));
                    continue;
                }

                const json = await response.json();
                if (json.videoDetails && json.videoDetails.viewCount) {
                    return parseInt(json.videoDetails.viewCount, 10);
                }
                // Sem viewCount = vídeo restrito/indisponível. É "desconhecido" (-1),
                // não "0 views" — senão a música afundaria como impopular (e o 0
                // ainda ficava 72h no cache).
                return -1;
            } catch (e) {
                // Network error — retry
                await new Promise(r => setTimeout(r, 1000));
            }
        }
        return -1; // Sinaliza falha após todas as tentativas
    }

    // ==========================================
    // VALIDAÇÃO DA CHAVE LAST.FM
    // ==========================================
    // Uma chamada barata antes de processar tudo: com chave inválida, o processo
    // inteiro rodava "com sucesso" sem mudar nada e sem explicar o porquê.
    async function chaveLastFmValida(apiKey) {
        try {
            const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=cher&api_key=${apiKey}&format=json`;
            const json = await (await fetch(url)).json();
            return !(json.error === 10 || json.error === 26); // 10 = chave inválida, 26 = suspensa
        } catch (e) { return true; } // erro de rede não prova nada — segue o fluxo
    }

    // ==========================================
    // REGISTRO DO MÓDULO
    // ==========================================
    if (window.YTM && window.YTM.sorters) {
        window.YTM.sorters['VIEWS_DESC'] = {
            
            // FASE DE ENRIQUECIMENTO (BUSCA DE DADOS)
            enrich: async (listaMusicas, creds) => {
                const hasKey = creds && creds.key;
                let falhas = 0; // P12: Contagem de falhas
                let cacheTopTracks = {};
                
                if (hasKey) {
                    // --- MODO LAST.FM (TOP 1000 TRACKS + FALLBACK) ---

                    // Chave inválida: avisa e aborta em vez de "concluir" sem fazer nada.
                    if (!(await chaveLastFmValida(creds.key))) {
                        window.YTM.UI.error(t('errBadKey'));
                        const e = new Error("Invalid Last.fm API key");
                        e.handled = true;
                        throw e;
                    }

                    // P3: Normalizar artistas ANTES de deduplificar
                    const artistasUnicos = [...new Set(
                        listaMusicas.map(m => normalizeArtist(m.artistaOriginal || m.artista))
                    )];

                    // 1. Busca Top 1000 Tracks de cada artista em PARALELO controlado
                    //    (a Fila limita as chamadas simultâneas; cache continua valendo).
                    let analisados = 0;
                    await Promise.all(artistasUnicos.map(artista =>
                        window.YTM.Queue.add(async () => {
                            if (window.YTM.cancelled) return;
                            cacheTopTracks[artista] = await fetchArtistTopTracks(artista, creds.key);
                            // Pequeno delay para respeitar o rate limit do Last.fm
                            await new Promise(r => setTimeout(r, 300));
                            analisados++;
                            window.YTM.UI.update("Last.fm", `${analisados}/${artistasUnicos.length}`);
                        })
                    ));

                    if (window.YTM.cancelled) return falhas;

                    // 2. Associa dados às músicas com FUZZY MATCHING (P2)
                    for (let musica of listaMusicas) {
                        if (window.YTM.cancelled) return falhas;
                        const artista = normalizeArtist(musica.artistaOriginal || musica.artista);
                        const topList = cacheTopTracks[artista] || [];
                        const canonicalLocal = normalizeTitle(musica.tituloOriginal || musica.titulo);

                        // Tenta encontrar via matching em 3 níveis (P2)
                        const match = findBestMatch(canonicalLocal, topList);

                        if (match) {
                            musica.views = match.listeners;
                            musica.source = "Last.fm Top 1000";
                        } else {
                            // P8: Fallback pontual via track.getInfo
                            window.YTM.UI.update("Last.fm", `${t('statusSearching')} ${musica.tituloOriginal || musica.titulo}`);
                            const trackInfo = await fetchTrackInfo(
                                artista,
                                musica.tituloOriginal || musica.titulo,
                                creds.key
                            );
                            await new Promise(r => setTimeout(r, 150));

                            if (trackInfo) {
                                musica.views = trackInfo.listeners;
                                musica.source = "Last.fm Track Info";
                            } else {
                                // P4: -1 = "não encontrado" (distinguível de impopular)
                                musica.views = -1;
                                falhas++;
                            }
                        }
                    }

                } else {
                    // --- MODO YOUTUBE (P6 + P11: Queue + Cache + Retry) ---
                    const client = window.YTM.Auth.getClientInfo();
                    if (!client) return falhas;

                    const url = `https://music.youtube.com/youtubei/v1/player?key=${client.apiKey}`;
                    let processados = 0;

                    // P11: Em PARALELO controlado pela Queue, com cache por videoId
                    await Promise.all(listaMusicas.map(async (m) => {
                        if (window.YTM.cancelled) return;

                        if (!m.videoId) { m.views = 0; processados++; return; }

                        const cacheKey = `YT_VIEWS_${m.videoId}`;
                        const cached = window.YTM.Cache.get(cacheKey);
                        if (cached !== null) {
                            m.views = cached;
                            processados++;
                            return;
                        }

                        // P6 + P11: Usa Queue para throttling + retry com backoff
                        const v = await window.YTM.Queue.add(
                            () => buscarViewsYouTube(m, url, client.context, 3)
                        );
                        // null = fila cancelada pelo botão Parar
                        m.views = (v === null || v === undefined) ? -1 : v;

                        if (m.views >= 0) {
                            window.YTM.Cache.set(cacheKey, m.views);
                        } else {
                            falhas++; // -1 = desconhecido (vai para o fim)
                        }

                        processados++;
                        if (processados % 10 === 0) {
                            window.YTM.UI.update(t('statusViews'), `${processados}/${listaMusicas.length}`);
                        }
                    }));
                }

                // ===============================================
                // SALVA DIAGNÓSTICO PARA EXPORTAÇÃO
                // ===============================================
                
                // Salva dados para exportação via console
                window.YTM._diag = {
                    playlist: listaMusicas.map(m => ({
                        artista: m.artistaOriginal || m.artista,
                        titulo: m.tituloOriginal || m.titulo,
                        canonical: normalizeTitle(m.tituloOriginal || m.titulo),
                        views: m.views,
                        source: m.source || 'N/A'
                    })),
                    lastfm: hasKey ? cacheTopTracks : null
                };

                // Log resumido no console
                const found = listaMusicas.filter(m => m.views >= 0).length;
                const failed = listaMusicas.filter(m => m.views === -1).length;
                console.log(`[YTM] ✅ Enriquecimento completo: ${found} encontradas, ${failed} falharam (${listaMusicas.length} total)`);
                console.log(`[YTM] 📥 Para exportar logs, rode no console: window.YTM.exportarLogs()`);

                return falhas; // P12: Retorna contagem de falhas
            },

            // FASE DE COMPARAÇÃO (P4: Trata -1 como "desconhecido")
            compare: (a, b) => {
                const va = Number(a.views);
                const vb = Number(b.views);
                
                // Músicas sem dados (-1) vão depois de quem tem dados
                if (va === -1 && vb === -1) return 0;
                if (va === -1) return 1;
                if (vb === -1) return -1;
                
                return vb - va; // Maior para menor
            }
        };
        console.log("[YTM] Sorter 'VIEWS_DESC' v2.0 registrado.");
    }
})();