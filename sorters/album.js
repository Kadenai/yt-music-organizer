// sorters/album.js - Versão 8.0 (Performance Engine: Cache + Queue)

(function() {

    const t = (key) => (window.I18N && window.I18N.t) ? window.I18N.t(key) : key;

    // --- HELPER DE LIMPEZA ---
    function cleanAlbumTitle(title) {
        if (!title) return "";
        // Flag 'g' (global): a antiga 'y' (sticky) só casava se o título COMEÇASSE
        // com "(", então "(Deluxe Edition)" etc. nunca era removido de verdade.
        return title
            .replace(/\s*\(.*?(remaster|deluxe|anniversary|edition|expanded|re-recorded|version).*\)/gi, '')
            .replace(/\s*\[.*?(remaster|deluxe|anniversary|edition|expanded|re-recorded|version).*\]/gi, '')
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
                    // Ordenação de Prioridade (Track Count > Date) — a edição com MAIS
                    // faixas (deluxe etc.) tem o mapa de faixas mais completo.
                    candidates.sort((a, b) => {
                        if (b.trackCount !== a.trackCount) return b.trackCount - a.trackCount;
                        const da = a.releaseDate ? new Date(a.releaseDate).getFullYear() : 9999;
                        const db = b.releaseDate ? new Date(b.releaseDate).getFullYear() : 9999;
                        return da - db;
                    });

                    const bestMatch = candidates[0];

                    // ANO: o MENOR ano entre as edições = lançamento original.
                    // (Sem isso, a Deluxe de 2011 dava ano 2011 a um álbum de 1991
                    // e quebrava a ordem cronológica da discografia.)
                    const anos = candidates
                        .map(c => c.releaseDate ? new Date(c.releaseDate).getFullYear() : null)
                        .filter(y => y && y > 1900 && y < 2100);
                    const bestYear = anos.length > 0 ? Math.min(...anos) : 9999;

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
        const cacheKey = 'ALBUM_' + window.YTM.Common.cacheKey(`${artist}|${albumName}`);
        
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

                    // O tipo REAL do lançamento vem em release-group (primary-type /
                    // secondary-types). Procurar a palavra "single" no título quase
                    // nunca funcionava — singles raramente se chamam "... Single".
                    const scoreRelease = (r) => {
                        let score = 0;
                        const rg = r['release-group'] || {};
                        const primary = rg['primary-type'] || '';
                        const secondary = rg['secondary-types'] || [];
                        if (primary === 'Album') score += 20;
                        if (primary === 'Single') score -= 50;
                        if (primary === 'EP') score -= 10;
                        if (secondary.includes('Compilation')) score -= 30; // "Greatest Hits" etc.
                        if (secondary.includes('Live')) score -= 15;
                        // Heurística antiga mantida como reforço
                        if (/single/i.test(r.title || '') || /single/i.test(r.disambiguation || '')) score -= 50;
                        if (targetAlbumClean && (r.title || '').toLowerCase() === targetAlbumClean.toLowerCase()) score += 25;
                        return score;
                    };

                    const releases = rec.releases.sort((a, b) => {
                        const scoreA = scoreRelease(a);
                        const scoreB = scoreRelease(b);

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
        const cacheKey = 'MB_TRACK_' + window.YTM.Common.cacheKey(`${musica.artista}|${musica.titulo}`);
        
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
                        // Guarda artista/álbum no objeto (e não na chave) — nomes com "|"
                        // quebravam o split antigo.
                        if (!albunsParaBuscar[key]) albunsParaBuscar[key] = { artist: m.artistaOriginal, albumNameRaw: m.albumOriginal, musicas: [] };
                        albunsParaBuscar[key].musicas.push(m);
                    } else {
                        musicasSemAlbum.push(m);
                    }
                }

                const grupos = Object.values(albunsParaBuscar);
                let concluidos = 0;

                // Busca os álbuns em PARALELO controlado: a Fila (Queue) limita as
                // chamadas simultâneas. Antes era um por vez e a fila ficava ociosa.
                await Promise.all(grupos.map(async (grupo) => {
                    if (window.YTM.cancelled) return;

                    // Chama a função otimizada (Cache -> Queue -> API)
                    const dadosAlbum = await getAlbumData(grupo.artist, grupo.albumNameRaw);
                    concluidos++;
                    window.YTM.UI.update(t('statusDisco'), `${concluidos}/${grupos.length}`);
                    if (window.YTM.cancelled) return;

                    if (dadosAlbum) {
                        for (let m of grupo.musicas) {
                            m.year = dadosAlbum.year;
                            m.album = dadosAlbum.name;
                            m.source = dadosAlbum.source;

                            let trackInfo = null;
                            if (m.canonical) {
                                trackInfo = dadosAlbum.map[m.canonical];

                                // Resgate por inclusão: exige identidades com tamanho
                                // mínimo — identidade vazia/curta "está contida" em
                                // qualquer texto e casava com a faixa errada.
                                if (!trackInfo && dadosAlbum.rawSongs && m.canonical.length >= 3) {
                                    const cleanTitleYTM = m.canonical;
                                    const resgate = dadosAlbum.rawSongs.find(s =>
                                        s.cleanName && s.cleanName.length >= 3 &&
                                        (s.cleanName.includes(cleanTitleYTM) ||
                                         cleanTitleYTM.includes(s.cleanName))
                                    );
                                    if (resgate) trackInfo = { track: resgate.track, disc: resgate.disc };
                                }
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
                        musicasSemAlbum.push(...grupo.musicas);
                    }
                }));

                if (window.YTM.cancelled) return falhas;

                // Processamento Individual (MusicBrainz) — serial DE PROPÓSITO:
                // o MusicBrainz limita a 1 requisição por segundo.
                if (musicasSemAlbum.length > 0) {
                    for (let i = 0; i < musicasSemAlbum.length; i++) {
                        if (window.YTM.cancelled) return falhas;
                        const m = musicasSemAlbum[i];
                        window.YTM.UI.update(t('statusAudit'), `${i+1}/${musicasSemAlbum.length}: ${m.titulo}`);

                        const dados = await getTrackDataMB(m);
                        if (dados) {
                            Object.assign(m, dados);
                        } else if (m.year !== 9999) {
                            // O iTunes já achou o álbum e o ANO; só o nº da faixa ficou
                            // desconhecido (999 = fim do álbum). Não rebaixar para
                            // "Falha" — senão a música seria expulsa para o fim da
                            // playlist mesmo com o ano correto.
                            falhas++;
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