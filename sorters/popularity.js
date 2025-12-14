// sorters/popularity.js

(function() {
    // Funções Auxiliares Internas
    
    // API 1: Last.fm Top Tracks
    async function fetchArtistTopTracks(artistName, apiKey) {
        try {
            const url = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=${encodeURIComponent(artistName)}&api_key=${apiKey}&format=json&limit=200&autocorrect=1`;
            const response = await fetch(url);
            const json = await response.json();
            if (json.toptracks && json.toptracks.track) {
                // Mapeia para um formato fácil de buscar
                return json.toptracks.track.map(t => ({
                    canonical: window.YTM.Common.createCanonicalId(t.name), 
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
                    // --- MODO LAST.FM (RÁPIDO) ---
                    const artistasUnicos = [...new Set(listaMusicas.map(m => m.artistaOriginal))];
                    const cacheTopTracks = {};

                    // 1. Busca Top Tracks de cada artista
                    for (let i = 0; i < artistasUnicos.length; i++) {
                        const artista = artistasUnicos[i];
                        window.YTM.UI.update("Last.fm...", `Top Tracks: ${artista}`);
                        cacheTopTracks[window.YTM.Common.cleanText(artista)] = await fetchArtistTopTracks(artista, creds.key);
                        // Pequeno delay para ser gentil com a API
                        await new Promise(r => setTimeout(r, 200));
                    }

                    // 2. Associa dados às músicas
                    for (let musica of listaMusicas) {
                        const topList = cacheTopTracks[window.YTM.Common.cleanText(musica.artistaOriginal)] || [];
                        // Tenta encontrar a música na lista top do artista
                        const match = topList.find(t => t.canonical === musica.canonical);
                        
                        musica.views = match ? match.listeners : 0;
                        if (match) musica.source = "Last.fm Top";
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