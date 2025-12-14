// main.js - Versão 7.0 (Emergency Stop & Abort Logic)

(function() {

    let isCancelled = false; // Bandeira de Cancelamento Global

    const FUSION_STRATEGIES = {
        'FUS_FAV_ALBUMS': { type: 'GROUP_BY_ALBUM', scoreFn: (t) => t.reduce((s, x) => s + (Number(x.userPlays)||0), 0), descending: true },
        'FUS_EXPRESS': { type: 'GROUP_BY_ALBUM', scoreFn: (t) => t.reduce((s, x) => s + x.duration, 0), descending: false },
        'FUS_DISCO': { type: 'GROUP_BY_ALBUM', scoreFn: (t) => t[0].year || 9999, descending: false, specialSort: 'DISCOGRAPHY' },
        'FUS_HALL_FAME': { type: 'GROUP_BY_ARTIST', scoreFn: (t) => t.reduce((s, x) => s + (Number(x.views)||0), 0), descending: true },
        'FUS_TOP_ARTISTS': { type: 'GROUP_BY_ARTIST', scoreFn: (t) => t.reduce((s, x) => s + (Number(x.userPlays)||0), 0), descending: true },
        'FUS_GREATEST_HITS': { type: 'CASCADE', modes: ['ARTIST_AZ', 'VIEWS_DESC'] },
        'FUS_FAN_CLUB':      { type: 'CASCADE', modes: ['ARTIST_AZ', 'MY_SCROBBLES'] },
        'FUS_ARTIST_DUR':    { type: 'CASCADE', modes: ['ARTIST_AZ', 'DURATION'] }
    };

    function sortFusedGroup(lista, fusionId) {
        const strategy = FUSION_STRATEGIES[fusionId];
        if (!strategy) return lista;
        if (strategy.type === 'CASCADE') return sortMultilevel(lista, strategy.modes);

        const groups = {};
        lista.forEach(track => {
            let key;
            if (strategy.type === 'GROUP_BY_ALBUM') {
                key = `${track.artistaOriginal}|${track.albumOriginal || track.album || "Unknown"}`;
            } else {
                key = track.artistaOriginal;
            }
            if (!groups[key]) groups[key] = [];
            groups[key].push(track);
        });

        const groupList = Object.keys(groups).map(key => {
            const tracks = groups[key];
            if (strategy.type === 'GROUP_BY_ALBUM') {
                tracks.sort((a, b) => {
                    if (a.discNumber !== b.discNumber) return a.discNumber - b.discNumber;
                    return a.trackNumber - b.trackNumber;
                });
            }
            return {
                key: key,
                tracks: tracks,
                score: strategy.scoreFn ? strategy.scoreFn(tracks) : 0,
                artistName: tracks[0].artista, 
                year: tracks[0].year || 9999
            };
        });

        groupList.sort((a, b) => {
            if (strategy.specialSort === 'DISCOGRAPHY') {
                const artistCompare = a.artistName.localeCompare(b.artistName);
                if (artistCompare !== 0) return artistCompare;
                return a.year - b.year;
            }
            const diff = strategy.descending ? (b.score - a.score) : (a.score - b.score);
            if (diff !== 0) return diff;
            return a.artistName.localeCompare(b.artistName);
        });
        return groupList.flatMap(g => g.tracks);
    }

    function sortMultilevel(lista, modes) {
        return lista.sort((a, b) => {
            for (let mode of modes) {
                const sorter = window.YTM.sorters[mode];
                if (sorter && sorter.compare) {
                    const res = sorter.compare(a, b);
                    if (res !== 0) return res;
                }
            }
            return a.titulo.localeCompare(b.titulo);
        });
    }

    async function realizarScrollCompleto() {
        const metaTotal = window.YTM.Parser.getTotalPlaylistCount();
        let currentCount = 0;
        let retries = 0;
        const MAX_RETRIES = 5;

        window.YTM.UI.update("Carregando...", "Analisando tamanho da playlist...");
        
        while (true) {
            // CHECKPOINT DE PARADA
            if (isCancelled) return false;

            currentCount = document.querySelectorAll('ytmusic-responsive-list-item-renderer').length;

            if (metaTotal) {
                 window.YTM.UI.update("Carregando...", `${currentCount} / ${metaTotal} itens...`);
                 if (currentCount >= metaTotal) break;
            } else {
                 window.YTM.UI.update("Carregando...", `${currentCount} itens...`);
            }

            window.scrollTo(0, document.documentElement.scrollHeight);
            await new Promise(r => setTimeout(r, 1500));

            const newCount = document.querySelectorAll('ytmusic-responsive-list-item-renderer').length;
            
            if (newCount === currentCount) {
                retries++;
                window.scrollBy(0, -500);
                await new Promise(r => setTimeout(r, 500));
                window.scrollTo(0, document.documentElement.scrollHeight);
                if (retries >= MAX_RETRIES) break;
            } else {
                retries = 0;
            }
        }
        return true;
    }

    async function enviarParaYouTube(lista, topId, pid) {
        const client = window.YTM.Auth.getClientInfo();
        const ah = await window.YTM.Auth.generateHeader();
        if(!ah) return window.YTM.UI.error("Auth Error");
        
        let t = topId;
        const tot = Math.ceil(lista.length / window.YTM.config.BATCH_SIZE);

        for (let i=0; i<lista.length; i+=window.YTM.config.BATCH_SIZE) {
            // CHECKPOINT DE PARADA
            if (isCancelled) { window.YTM.UI.send('UI_STOPPED'); return; }

            const ch = lista.slice(i, i+window.YTM.config.BATCH_SIZE);
            window.YTM.UI.update("Salvando...", `Lote ${Math.floor(i/window.YTM.config.BATCH_SIZE)+1}/${tot}`);
            let acts = [];
            for (let m of ch) { 
                if (m.id === t) continue; 
                acts.push({ action: "ACTION_MOVE_VIDEO_BEFORE", setVideoId: m.id, movedSetVideoIdSuccessor: t }); 
                t = m.id; 
            }
            if (acts.length) { 
                try { 
                    await fetch(`https://music.youtube.com/youtubei/v1/browse/edit_playlist?key=${client.apiKey}`, { 
                        method: "POST", 
                        headers: { "Content-Type": "application/json", "Authorization": ah, "X-Origin": window.location.origin, "X-Goog-AuthUser": client.authUser, "X-Youtube-Client-Name": client.clientName, "X-Youtube-Client-Version": client.clientVersion }, 
                        body: JSON.stringify({ context: client.context, playlistId: pid, actions: acts }), 
                        credentials: 'include' 
                    }); 
                } catch(e){} 
                await new Promise(r => setTimeout(r, window.YTM.config.DELAY_BATCH)); 
            }
        }
        window.YTM.UI.success();
    }

    async function iniciarProcesso(modes, isReverse, creds) {
        try {
            isCancelled = false; // Reset da bandeira
            window.YTM.UI.send('UI_START');
            
            // 1. Scroll
            const scrollOk = await realizarScrollCompleto();
            if (!scrollOk && isCancelled) { window.YTM.UI.send('UI_STOPPED'); return; }

            window.YTM.UI.update("Lendo...", "Processando lista...");
            const renderer = document.querySelector('ytmusic-playlist-shelf-renderer');
            if (!renderer?.data) return window.YTM.UI.error("Erro F5.");

            let lista = renderer.data.contents
                .map(i => i.musicResponsiveListItemRenderer)
                .filter(i => i && i.playlistItemData)
                .map(window.YTM.Parser.extrairDadosBasicos)
                .filter(m => m !== null);

            if (lista.length === 0) return window.YTM.UI.error("Vazia.");
            const topId = lista[0].id;

            let realModes = new Set();
            let fusionId = null;

            if (modes.length === 1 && modes[0].startsWith('FUS_')) {
                fusionId = modes[0];
                if (['FUS_HALL_FAME', 'FUS_GREATEST_HITS'].includes(fusionId)) realModes.add('VIEWS_DESC');
                if (['FUS_FAV_ALBUMS', 'FUS_TOP_ARTISTS', 'FUS_FAN_CLUB'].includes(fusionId)) realModes.add('MY_SCROBBLES');
                if (['FUS_FAV_ALBUMS', 'FUS_EXPRESS', 'FUS_DISCO'].includes(fusionId)) realModes.add('ALBUM_ORD');
                if (['FUS_EXPRESS', 'FUS_ARTIST_DUR'].includes(fusionId)) realModes.add('DURATION');
                realModes.add('ARTIST_AZ');
            } else {
                modes.forEach(m => realModes.add(m));
            }

            const activeSorters = Array.from(realModes)
                .map(m => window.YTM.sorters[m])
                .filter(s => s && typeof s.enrich === 'function');

            let falhas = 0;
            for (const sorter of activeSorters) {
                // CHECKPOINT DE PARADA ENTRE CADA ETAPA
                if (isCancelled) { window.YTM.UI.send('UI_STOPPED'); return; }
                
                const f = await sorter.enrich(lista, creds);
                if (f) falhas += f;
            }

            // Ultima checagem antes de ordenar
            if (isCancelled) { window.YTM.UI.send('UI_STOPPED'); return; }

            window.YTM.UI.update("Ordenando...", "Calculando nova ordem...");
            
            if (fusionId) {
                lista = sortFusedGroup(lista, fusionId);
            } else {
                lista = sortMultilevel(lista, modes);
            }

            if (!isReverse) lista.reverse();

            // Salvar (Checkpoints internos)
            await enviarParaYouTube(lista, topId, renderer.data.playlistId);

        } catch (err) {
            console.error(err);
            window.YTM.UI.error("Erro: " + err.message);
        }
    }

    window.addEventListener("message", (ev) => {
        if (ev.origin !== window.location.origin) return;
        
        if (ev.data && ev.data.type === "CMD_START_SORT") {
            iniciarProcesso(ev.data.modes, ev.data.reverse, ev.data.creds);
        }
        
        if (ev.data && ev.data.type === "CMD_STOP_SORT") {
            console.log("[YTM] Sinal de Parada recebido.");
            isCancelled = true;
        }
    });

})();