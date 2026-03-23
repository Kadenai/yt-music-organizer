// sorters/popularity.js

(function() {
    // Funções Auxiliares Internas
    
    // Normalize title to increase match rate
    function normalizeTitle(text) {
        if (!text) return "";
        let clean = text.toLowerCase();
        // Remove parens and brackets and their contents (e.g., "(Live)", "[Official Audio]")
        clean = clean.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '');
        // Remove common suffixes after hyphens
        clean = clean.replace(/\s+-\s+(live|remaster|remastered|bonus|acoustic).*/gi, '');
        // Remove feats
        clean = clean.split(/\s(?:feat\.|ft\.|part\.|with)\s/)[0];
        // Strip everything but letters and numbers
        return clean.replace(/[^a-z0-9]/g, '');
    }

    // API 1: Last.fm Top Tracks (Fazemos o cache das top 1000 músicas do artista)
    async function fetchArtistTopTracks(artistName, apiKey) {
        try {
            const url = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=${encodeURIComponent(artistName)}&api_key=${apiKey}&format=json&limit=1000&autocorrect=1`;
            const response = await fetch(url);
            const json = await response.json();
            if (json.toptracks && json.toptracks.track) {
                return json.toptracks.track.map(t => ({
                    canonical: normalizeTitle(t.name), 
                    listeners: parseInt(t.listeners)
                }));
            }
            return [];
        } catch (e) { return []; }
    }

    // API 2: YouTube Views (Fallback)
    async function buscarViewsYouTube(musica, urlEndpoint, context) {
        try {
            const payload = { context, videoId: musica.videoId };
            const response = await fetch(urlEndpoint, { 
                method: "POST", 
                headers: { "Content-Type": "application/json" }, 
                body: JSON.stringify(payload) 
            });
            if (response.status === 429) throw new Error("429"); // Rate limit
            const json = await response.json();
            if (json.videoDetails && json.videoDetails.viewCount) {
                return parseInt(json.videoDetails.viewCount, 10);
            }
            return 0;
        } catch (e) { return 0; }
    }

    // REGISTRO DO MÓDULO
    if (window.YTM && window.YTM.sorters) {
        window.YTM.sorters['VIEWS_DESC'] = {
            
            // FASE DE ENRIQUECIMENTO (BUSCA DE DADOS)
            enrich: async (listaMusicas, creds) => {
                const hasKey = creds && creds.key;
                
                if (hasKey) {
                    // --- MODO LAST.FM (TOP 1000 TRACKS) ---
                    const artistasUnicos = [...new Set(listaMusicas.map(m => m.artistaOriginal || m.artista))];
                    const cacheTopTracks = {};

                    // 1. Busca Top 1000 Tracks de cada artista para um índice incrivelmente preciso
                    for (let i = 0; i < artistasUnicos.length; i++) {
                        let artista = artistasUnicos[i];
                        if (artista.includes(" • ")) artista = artista.split(" • ")[0].trim();
                        
                        window.YTM.UI.update("Last.fm...", `Analisando artista: ${artista}`);
                        cacheTopTracks[artista] = await fetchArtistTopTracks(artista, creds.key);
                        // Pequeno delay
                        await new Promise(r => setTimeout(r, 200));
                    }

                    // 2. Associa dados às músicas usando um normalizador robusto
                    for (let musica of listaMusicas) {
                        let artista = musica.artistaOriginal || musica.artista || "";
                        if (artista.includes(" • ")) artista = artista.split(" • ")[0].trim();
                        
                        const topList = cacheTopTracks[artista] || [];
                        const canonicalLocal = normalizeTitle(musica.tituloOriginal || musica.titulo);
                        
                        // Tenta encontrar a música na lista de 1000 top do artista
                        const match = topList.find(t => t.canonical === canonicalLocal);
                        
                        musica.views = match ? match.listeners : 0;
                        if (match) musica.source = "Last.fm Top 1000";
                    }

                } else {
                    // --- MODO YOUTUBE (LENTO / FALLBACK) ---
                    const client = window.YTM.Auth.getClientInfo();
                    if (!client) return;
                    
                    const url = `https://music.youtube.com/youtubei/v1/player?key=${client.apiKey}`;
                    let processados = 0;
                    
                    // Processa em lotes de 3 para não travar o navegador
                    for (let i = 0; i < listaMusicas.length; i += 3) {
                        const lote = listaMusicas.slice(i, i + 3);
                        await Promise.all(lote.map(async m => {
                            if(m.videoId) m.views = await buscarViewsYouTube(m, url, client.context);
                            else m.views = 0;
                            processados++;
                        }));
                        
                        if(processados % 10 === 0) {
                            window.YTM.UI.update("YouTube Views...", `${processados}/${listaMusicas.length}`);
                        }
                        await new Promise(r => setTimeout(r, 150));
                    }
                }
            },

            // FASE DE COMPARAÇÃO (MAIOR PARA MENOR)
            compare: (a, b) => {
                return (Number(b.views)||0) - (Number(a.views)||0);
            }
        };
        console.log("[YTM] Sorter 'VIEWS_DESC' registrado.");
    }
})();