// sorters/album.js - Versão 8.0 (Performance Engine: Cache + Queue)

(function() {
    
    // --- HELPER DE LIMPEZA (Mantido igual) ---
    function cleanAlbumTitle(title) {
        if (!title) return "";
        return title
            .replace(/\s*\(.*?(remaster|deluxe|anniversary|edition|expanded|re-recorded|version).*\)/yi, '')
            .replace(/\s*\[.*?(remaster|deluxe|anniversary|edition|expanded|re-recorded|version).*\]/yi, '')
            .replace(/\s-\s(EP|Single|Remaster).*$/i, '')
            .trim();
    }

    // --- FUNÇÃO DE FETCH (Agora envelopada para ser usada na Fila) ---
    async function _fetchFromITunesAPI(artist, albumName) {
        try {
            const query = encodeURIComponent(`${artist} ${albumName}`);
            const url = `https://itunes.apple.com/search?term=${query}&media=music&entity=album&limit=15`;
            
            const response = await fetch(url);
            const json = await response.json();
            
            if (json.resultCount > 0) {
                const candidates = json.results.filter(r => 
                    r.collectionName && 
                    r.collectionName.toLowerCase().includes(albumName.toLowerCase())
                );

                if (candidates.length > 0) {
                    // Ordenação de Prioridade (Track Count > Date)
                    candidates.sort((a, b) => {
                        if (b.trackCount !== a.trackCount) return b.trackCount - a.trackCount; 
                        const da = a.releaseDate ? new Date(a.releaseDate).getFullYear() : 9999;
                        const db = b.releaseDate ? new Date(b.releaseDate).getFullYear() : 9999;
                        return da - db;
                    });

                    const bestMatch = candidates[0];
                    const bestYear = bestMatch.releaseDate ? new Date(bestMatch.releaseDate).getFullYear() : 9999;

                    // Busca faixas (Lookup)
                    const tracksUrl = `https://itunes.apple.com/lookup?id=${bestMatch.collectionId}&entity=song&limit=200`;
                    const tracksRes = await fetch(tracksUrl);
                    const tracksJson = await tracksRes.json();

                    const rawSongs = tracksJson.results.filter(x => x.wrapperType === 'track').map(t => ({
                        name: t.trackName,
                        cleanName: window.YTM.Common.createCanonicalId(t.trackName),
                        track: t.trackNumber,
                        disc: t.discCount > 1 ? t.discNumber : 1
                    }));

                    const trackMap = {};
                    rawSongs.forEach(s => {
                        trackMap[s.cleanName] = { track: s.track, disc: s.disc };
                    });

                    return {
                        year: bestYear,
                        name: bestMatch.collectionName,
                        map: trackMap,
                        rawSongs: rawSongs,
                        source: "iTunes (Cached)"
                    };
                }
            }
            return null;
        } catch (e) { return null; }
    }

    // --- GERENCIADOR DE REQUISIÇÃO (Cache -> Queue -> API) ---
    async function getAlbumData(artist, albumNameRaw) {
        const albumName = cleanAlbumTitle(albumNameRaw);
        const cacheKey = `ALBUM_${artist}|${albumName}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        // 1. Tenta Cache Local (Instantâneo)
        const cached = window.YTM.Cache.get(cacheKey);
        if (cached) return cached;

        // 2. Se não tem, agenda na Fila (Throttling)
        const result = await window.YTM.Queue.add(() => _fetchFromITunesAPI(artist, albumName));
        
        // 3. Salva no Cache para o futuro
        if (result) {
            window.YTM.Cache.set(cacheKey, result);
        }
        
        return result;
    }


    // --- MUSICBRAINZ (Agora também otimizado com Fila) ---
    async function _fetchFromMusicBrainzAPI(musica) {
        try {
            // Pequeno delay nativo para respeitar o rate limit do MB
            await new Promise(r => setTimeout(r, 1200)); 
            
            let query = `artist:"${musica.artista}" AND recording:"${musica.titulo}"`;
            if (musica.albumOriginal && musica.albumOriginal !== "Desconhecido") {
                query += ` AND release:"${cleanAlbumTitle(musica.albumOriginal)}"`;
            }

            const url = `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(query)}&fmt=json`;
            const response = await fetch(url, { headers: { 'User-Agent': 'YTMOrganizer/8.0 ( contact@example.com )' } });
            const json = await response.json();
            
            if (json.recordings && json.recordings.length > 0) {
                const rec = json.recordings[0];
                if (rec.releases && rec.releases.length > 0) {
                    
                    // Lógica do Auditor Anti-Single
                    const targetAlbumClean = cleanAlbumTitle(musica.albumOriginal || "");
                    
                    const releases = rec.releases.sort((a, b) => {
                        let scoreA = 0;
                        let scoreB = 0;

                        if (/single/i.test(a.title) || /single/i.test(a.disambiguation)) scoreA -= 50;
                        if (/single/i.test(b.title) || /single/i.test(b.disambiguation)) scoreB -= 50;

                        if (targetAlbumClean) {
                            if (a.title.toLowerCase() === targetAlbumClean.toLowerCase()) scoreA += 20;
                            if (b.title.toLowerCase() === targetAlbumClean.toLowerCase()) scoreB += 20;
                        }

                        const da = a.date ? parseInt(a.date.substring(0,4)) : 9999;
                        const db = b.date ? parseInt(b.date.substring(0,4)) : 9999;
                        
                        if (scoreA !== scoreB) return scoreB - scoreA;
                        return da - db;
                    });
                    
                    const bestRelease = releases[0];
                    const year = bestRelease.date ? parseInt(bestRelease.date.substring(0, 4)) : 9999;
                    const media = bestRelease.media && bestRelease.media[0] ? bestRelease.media[0] : { 'track-offset': 0, position: 1 };
                    
                    return { 
                        album: bestRelease.title, 
                        year: year || 9999, 
                        trackNumber: (media['track-offset'] || 0) + 1, 
                        discNumber: media.position || 1, 
                        source: "MusicBrainz (Cached)" 
                    };
                }
            }
            return null;
        } catch (e) { return null; }
    }

    // Wrapper do MB para Fila + Cache
    async function getTrackDataMB(musica) {
        // Cache Key baseada em Artista + Música (MB é por faixa)
        const cacheKey = `MB_TRACK_${musica.artista}|${musica.titulo}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        const cached = window.YTM.Cache.get(cacheKey);
        if (cached) return cached;

        const result = await window.YTM.Queue.add(() => _fetchFromMusicBrainzAPI(musica));
        
        if (result) window.YTM.Cache.set(cacheKey, result);
        return result;
    }


    if (window.YTM && window.YTM.sorters) {
        window.YTM.sorters['ALBUM_ORD'] = {
            
            enrich: async (listaMusicas, creds) => {
                let falhas = 0;

                const albunsParaBuscar = {}; 
                const musicasSemAlbum = [];

                for (let m of listaMusicas) {
                    if (m.albumOriginal && m.albumOriginal.length > 1 && m.albumOriginal !== "Desconhecido") {
                        const key = `${m.artistaOriginal}|${m.albumOriginal}`;
                        if (!albunsParaBuscar[key]) albunsParaBuscar[key] = [];
                        albunsParaBuscar[key].push(m);
                    } else {
                        musicasSemAlbum.push(m);
                    }
                }

                const chaves = Object.keys(albunsParaBuscar);
                
                // Processamento em Lote (Agora gerenciado pela Queue)
                for (let i = 0; i < chaves.length; i++) {
                    const key = chaves[i];
                    const [artist, albumNameRaw] = key.split('|');
                    const grupoMusicas = albunsParaBuscar[key];

                    window.YTM.UI.update("Discografia...", `Processando: ${albumNameRaw} (${i+1}/${chaves.length})`);

                    // Chama a função otimizada (Cache -> Queue -> API)
                    const dadosAlbum = await getAlbumData(artist, albumNameRaw);

                    if (dadosAlbum) {
                        for (let m of grupoMusicas) {
                            m.year = dadosAlbum.year;
                            m.album = dadosAlbum.name;
                            m.source = dadosAlbum.source;
                            
                            let trackInfo = dadosAlbum.map[m.canonical];

                            if (!trackInfo && dadosAlbum.rawSongs) {
                                const cleanTitleYTM = m.canonical;
                                const resgate = dadosAlbum.rawSongs.find(s => 
                                    s.cleanName.includes(cleanTitleYTM) || 
                                    cleanTitleYTM.includes(s.cleanName)
                                );
                                if (resgate) trackInfo = { track: resgate.track, disc: resgate.disc };
                            }

                            if (trackInfo) {
                                m.trackNumber = trackInfo.track;
                                m.discNumber = trackInfo.disc;
                            } else {
                                // Falhou no álbum, tenta fallback individual
                                musicasSemAlbum.push(m);
                            }
                        }
                    } else {
                        musicasSemAlbum.push(...grupoMusicas);
                    }
                    
                    // Yield: Pausa para a UI respirar e processar botão Stop
                    await window.YTM.Common.yield();
                }

                // Processamento Individual (MusicBrainz)
                if (musicasSemAlbum.length > 0) {
                    for (let i = 0; i < musicasSemAlbum.length; i++) {
                        const m = musicasSemAlbum[i];
                        window.YTM.UI.update("Auditando...", `${i+1}/${musicasSemAlbum.length}: ${m.titulo}`);
                        
                        const dados = await getTrackDataMB(m);
                        if (dados) {
                            Object.assign(m, dados);
                        } else {
                            m.album = m.albumOriginal || "Desconhecido";
                            m.source = "Falha"; 
                            falhas++;
                        }
                        await window.YTM.Common.yield();
                    }
                }

                return falhas;
            },

            compare: (a, b) => {
                if (a.source === "Falha" && b.source !== "Falha") return 1;
                if (a.source !== "Falha" && b.source === "Falha") return -1;
                
                if (a.year !== b.year) return a.year - b.year;
                const ac = (a.album||"").localeCompare(b.album||"");
                if (ac !== 0) return ac;
                if (a.discNumber !== b.discNumber) return a.discNumber - b.discNumber;
                return a.trackNumber - b.trackNumber;
            }
        };
        console.log("[YTM] Sorter 'ALBUM_ORD' (v8 Performance) registrado.");
    }
})();