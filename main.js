// main.js - Versão 10.0 (Scroller v4 — scrollIntoView Only)

(function() {

    let isCancelled = false; 

    const FUSION_STRATEGIES = {
        'FUS_FAV_ALBUMS': { type: 'GROUP_BY_ALBUM', scoreFn: (t) => t.reduce((s, x) => s + (Number(x.userPlays)||0), 0), descending: true },
        'FUS_EXPRESS': { type: 'GROUP_BY_ALBUM', scoreFn: (t) => t.reduce((s, x) => s + x.duration, 0), descending: false },
        'FUS_DISCO': { type: 'GROUP_BY_ALBUM', scoreFn: (t) => t[0].year || 9999, descending: false, specialSort: 'DISCOGRAPHY' },
        'FUS_HALL_FAME': { type: 'GROUP_BY_ARTIST', scoreFn: (tracks) => {
            const validViews = tracks.map(x => Number(x.views)).filter(v => v > 0);
            if (validViews.length === 0) return 0;
            return validViews.reduce((s, v) => s + v, 0) / validViews.length;
        }, descending: true },
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
                artistName: tracks[0].artistaOriginal || tracks[0].artista, 
                albumName: tracks[0].album || "",
                year: tracks[0].year || 9999
            };
        });

        groupList.sort((a, b) => {
            if (strategy.specialSort === 'DISCOGRAPHY') {
                const artA = a.artistName.toLowerCase();
                const artB = b.artistName.toLowerCase();
                if (artA < artB) return -1;
                if (artA > artB) return 1;
                if (a.year !== b.year) return a.year - b.year;
                return a.albumName.localeCompare(b.albumName);
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
            // P10: Preserva ordem original como fallback
            if (a.originalIndex !== undefined && b.originalIndex !== undefined) {
                return a.originalIndex - b.originalIndex;
            }
            return a.titulo.localeCompare(b.titulo);
        });
    }

    // =========================================================
    // SCROLLER v6.0 — Determinístico (TUDO ou ERRO)
    // =========================================================

    function getLoadedCount() {
        return document.querySelectorAll('ytmusic-responsive-list-item-renderer').length;
    }

    /**
     * Tenta carregar mais itens usando TODAS as técnicas conhecidas.
     */
    function tentarCarregar() {
        const items = document.querySelectorAll('ytmusic-responsive-list-item-renderer');
        if (items.length === 0) return;

        // Técnica 1: scrollIntoView no último item (block:'end')
        items[items.length - 1].scrollIntoView({ behavior: 'instant', block: 'end' });

        // Técnica 2: Busca e scroll até o spinner/continuation
        const spinner = document.querySelector(
            'tp-yt-paper-spinner-lite, ' +
            'yt-next-continuation, ' +
            '#continuations'
        );
        if (spinner) {
            spinner.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
    }

    /**
     * Espera novos itens aparecerem (polling a cada 400ms, até timeoutMs).
     */
    async function esperarNovoConteudo(countAntes, timeoutMs) {
        const inicio = Date.now();
        while (Date.now() - inicio < timeoutMs) {
            await new Promise(r => setTimeout(r, 400));
            if (getLoadedCount() > countAntes) return true;
        }
        return false;
    }

    /**
     * @returns {number} Total de itens carregados, ou -1 se houve erro/cancel.
     */
    async function realizarScrollCompleto() {
        const metaTotal = window.YTM.Parser.getTotalPlaylistCount();
        
        // SEM TOTAL = ERRO. Não prosseguir sem saber quantas músicas tem.
        if (!metaTotal) {
            window.YTM.UI.error("Não foi possível identificar o total de músicas da playlist.");
            return -1;
        }

        console.log(`[YTM] Scroll v6: Preciso carregar ${metaTotal} itens.`);
        window.YTM.UI.update("Carregando...", `0 / ${metaTotal} itens...`);

        const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos de timeout absoluto
        const inicio = Date.now();
        let semProgressoConsecutivo = 0;

        while (true) {
            if (isCancelled) return -1;

            const currentCount = getLoadedCount();
            window.YTM.UI.update("Carregando...", `${currentCount} / ${metaTotal} itens...`);

            // CHEGOU NO TOTAL → SUCESSO
            if (currentCount >= metaTotal) {
                console.log(`[YTM] ✅ Todas as ${metaTotal} músicas carregadas!`);
                return currentCount;
            }

            // TIMEOUT ABSOLUTO
            if (Date.now() - inicio > TIMEOUT_MS) {
                window.YTM.UI.error(`Timeout: só carregou ${currentCount} de ${metaTotal} músicas.`);
                return -1;
            }

            // Tenta carregar mais
            tentarCarregar();

            // Espera até 6s por novos itens
            const carregou = await esperarNovoConteudo(currentCount, 6000);

            if (carregou) {
                semProgressoConsecutivo = 0;
                const newCount = getLoadedCount();
                console.log(`[YTM] Progresso: ${currentCount} → ${newCount}`);
            } else {
                semProgressoConsecutivo++;
                console.warn(`[YTM] Sem progresso #${semProgressoConsecutivo}. Atual: ${currentCount}/${metaTotal}`);

                // Recovery: scroll pra itens anteriores e volta
                const items = document.querySelectorAll('ytmusic-responsive-list-item-renderer');
                const jumpBack = Math.min(20, Math.floor(items.length / 2));
                if (items.length > jumpBack) {
                    // Volta jumpBack itens
                    items[items.length - jumpBack].scrollIntoView({ behavior: 'instant', block: 'start' });
                    await new Promise(r => setTimeout(r, 1500));
                    // Scroll progressivo de volta ao final
                    for (let i = items.length - jumpBack; i < items.length; i += 5) {
                        items[Math.min(i, items.length - 1)].scrollIntoView({ behavior: 'instant', block: 'end' });
                        await new Promise(r => setTimeout(r, 300));
                    }
                    // Tenta carregar de novo
                    tentarCarregar();
                    await new Promise(r => setTimeout(r, 3000));
                }

                // Depois de muitas tentativas sem progresso, tenta block:'start' no último
                if (semProgressoConsecutivo > 3) {
                    items[items.length - 1].scrollIntoView({ behavior: 'instant', block: 'start' });
                    await new Promise(r => setTimeout(r, 3000));
                }
            }
        }
    }

    // =========================================================
    // ENVIO PARA YOUTUBE
    // =========================================================

    async function enviarParaYouTube(lista, topId, pid) {
        const client = window.YTM.Auth.getClientInfo();
        const ah = await window.YTM.Auth.generateHeader();
        if(!ah) return window.YTM.UI.error("Auth Error");
        
        let t = topId;
        const tot = Math.ceil(lista.length / window.YTM.config.BATCH_SIZE);

        for (let i=0; i<lista.length; i+=window.YTM.config.BATCH_SIZE) {
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
            
            await window.YTM.Common.yield();
        }
        window.YTM.UI.success();
    }

    // =========================================================
    // PROCESSO PRINCIPAL
    // =========================================================

    async function iniciarProcesso(modes, isReverse, creds) {
        try {
            isCancelled = false; 
            window.YTM.Queue.clear();
            window.YTM.UI.send('UI_START');
            
            const scrollResult = await realizarScrollCompleto();
            if (scrollResult === -1) {
                // Erro ou cancelamento — a mensagem já foi exibida pelo scroller
                if (isCancelled) window.YTM.UI.send('UI_STOPPED');
                return;
            }

            window.YTM.UI.update("Lendo...", "Processando lista...");
            const renderer = document.querySelector('ytmusic-playlist-shelf-renderer');
            if (!renderer?.data) return window.YTM.UI.error("Erro F5.");

            let lista = renderer.data.contents
                .map(i => i.musicResponsiveListItemRenderer)
                .filter(i => i && i.playlistItemData)
                .map(window.YTM.Parser.extrairDadosBasicos)
                .filter(m => m !== null);

            // Verificação de integridade
            const domCount = getLoadedCount();
            console.log(`[YTM] Dados extraídos: ${lista.length} (DOM: ${domCount})`);
            
            if (lista.length < domCount) {
                console.warn(`[YTM] Data model incompleto (${lista.length} vs DOM ${domCount}). Re-sync...`);
                await new Promise(r => setTimeout(r, 1500));
                if (renderer.data?.contents) {
                    lista = renderer.data.contents
                        .map(i => i.musicResponsiveListItemRenderer)
                        .filter(i => i && i.playlistItemData)
                        .map(window.YTM.Parser.extrairDadosBasicos)
                        .filter(m => m !== null);
                    console.log(`[YTM] Re-sync: ${lista.length} itens`);
                }
            }

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
                if (isCancelled) { window.YTM.UI.send('UI_STOPPED'); return; }
                const f = await sorter.enrich(lista, creds);
                if (f) falhas += f;
            }

            if (isCancelled) { window.YTM.UI.send('UI_STOPPED'); return; }

            window.YTM.UI.update("Ordenando...", "Calculando nova ordem...");
            
            if (fusionId) {
                lista = sortFusedGroup(lista, fusionId);
            } else {
                lista = sortMultilevel(lista, modes);
            }

            if (!isReverse) lista.reverse();

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
            isCancelled = true;
            window.YTM.Queue.clear();
        }
    });

})();
