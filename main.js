// main.js - Versão 11.0 (Production Cleanup)

(function() {

    let isCancelled = false;

    const log = (...a) => window.YTM?.debugMode && console.log(...a);
    const warn = (...a) => window.YTM?.debugMode && console.warn(...a);

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
            if (a.originalIndex !== undefined && b.originalIndex !== undefined) {
                return a.originalIndex - b.originalIndex;
            }
            return a.titulo.localeCompare(b.titulo);
        });
    }

    // =========================================================
    // SCROLLER v6.0 — Determinístico (TUDO ou ERRO)
    // =========================================================

    // Conta itens REAIS de playlist em data.contents (exclui Sugestões abaixo da
    // playlist e o marcador continuationItemRenderer). É a fonte da verdade —
    // contar DOM nodes inclui as Sugestões e infla o número.
    function getLoadedCount() {
        const r = document.querySelector('ytmusic-playlist-shelf-renderer');
        if (!r?.data?.contents) return 0;
        return r.data.contents.filter(c => c && c.musicResponsiveListItemRenderer).length;
    }

    // True se ainda existe um continuationItemRenderer pendente em data.contents
    // — significa que o YT Music tem mais itens server-side prontos pra carregar.
    function temContinuacaoPendente() {
        const r = document.querySelector('ytmusic-playlist-shelf-renderer');
        if (!r?.data?.contents) return false;
        return r.data.contents.some(c => c && c.continuationItemRenderer);
    }

    function tentarCarregar() {
        // Técnica 1: scroll até o DOM element do continuationItemRenderer (mais preciso).
        const contItem = document.querySelector('ytmusic-continuation-item-renderer');
        if (contItem) {
            contItem.scrollIntoView({ behavior: 'instant', block: 'end' });
            return;
        }

        const items = document.querySelectorAll('ytmusic-responsive-list-item-renderer');
        if (items.length === 0) return;

        // Técnica 2: scroll no último item.
        items[items.length - 1].scrollIntoView({ behavior: 'instant', block: 'end' });

        // Técnica 3: scroll até spinner/continuation antigo.
        const spinner = document.querySelector(
            'tp-yt-paper-spinner-lite, ' +
            'yt-next-continuation, ' +
            '#continuations'
        );
        if (spinner) {
            spinner.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
    }

    async function esperarNovoConteudo(countAntes, timeoutMs) {
        const inicio = Date.now();
        while (Date.now() - inicio < timeoutMs) {
            await new Promise(r => setTimeout(r, 400));
            if (getLoadedCount() > countAntes) return true;
        }
        return false;
    }

    async function realizarScrollCompleto() {
        const metaTotal = window.YTM.Parser.getTotalPlaylistCount();

        if (!metaTotal) {
            window.YTM.UI.error("Não foi possível identificar o total de músicas da playlist.");
            return -1;
        }

        log(`[YTM] Scroll v6: Preciso carregar ${metaTotal} itens.`);
        window.YTM.UI.update("Carregando...", `0 / ${metaTotal} itens...`);

        const TIMEOUT_MS = 5 * 60 * 1000;
        const inicio = Date.now();
        let semProgressoConsecutivo = 0;

        while (true) {
            if (isCancelled) return -1;

            const currentCount = getLoadedCount();
            const continuacao = temContinuacaoPendente();
            window.YTM.UI.update("Carregando...", `${currentCount} / ${metaTotal} itens...`);

            if (currentCount >= metaTotal && !continuacao) {
                log(`[YTM] ✅ Todas as ${metaTotal} músicas carregadas (sem continuação pendente)!`);
                return currentCount;
            }

            if (Date.now() - inicio > TIMEOUT_MS) {
                window.YTM.UI.error(`Timeout: só carregou ${currentCount} de ${metaTotal} músicas.`);
                return -1;
            }

            tentarCarregar();

            const carregou = await esperarNovoConteudo(currentCount, 6000);

            if (carregou) {
                semProgressoConsecutivo = 0;
                const newCount = getLoadedCount();
                log(`[YTM] Progresso: ${currentCount} → ${newCount}`);
            } else {
                semProgressoConsecutivo++;
                warn(`[YTM] Sem progresso #${semProgressoConsecutivo}. Atual: ${currentCount}/${metaTotal}`);

                const items = document.querySelectorAll('ytmusic-responsive-list-item-renderer');
                const jumpBack = Math.min(20, Math.floor(items.length / 2));
                if (items.length > jumpBack) {
                    items[items.length - jumpBack].scrollIntoView({ behavior: 'instant', block: 'start' });
                    await new Promise(r => setTimeout(r, 1500));
                    for (let i = items.length - jumpBack; i < items.length; i += 5) {
                        items[Math.min(i, items.length - 1)].scrollIntoView({ behavior: 'instant', block: 'end' });
                        await new Promise(r => setTimeout(r, 300));
                    }
                    tentarCarregar();
                    await new Promise(r => setTimeout(r, 3000));
                }

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

    async function enviarParaYouTube(lista, topId, pid, falhas) {
        const client = window.YTM.Auth.getClientInfo();
        const ah = await window.YTM.Auth.generateHeader();
        if(!ah) return window.YTM.UI.error("Auth Error");

        const diag = window.YTM._sortDiag || { batches: [] };
        let t = topId;
        const tot = Math.ceil(lista.length / window.YTM.config.BATCH_SIZE);

        for (let i=0; i<lista.length; i+=window.YTM.config.BATCH_SIZE) {
            if (isCancelled) { window.YTM.UI.send('UI_STOPPED'); return; }

            const ch = lista.slice(i, i+window.YTM.config.BATCH_SIZE);
            const batchNum = Math.floor(i/window.YTM.config.BATCH_SIZE)+1;
            window.YTM.UI.update("Salvando...", `Lote ${batchNum}/${tot}`);

            let acts = [];
            const skipped = [];
            for (let m of ch) {
                if (m.id === t) { skipped.push({ id: m.id, titulo: m.titulo || '?', motivo: 'm.id === t' }); continue; }
                if (!m.id) { skipped.push({ id: null, titulo: m.titulo || '?', motivo: 'sem setVideoId' }); continue; }
                acts.push({ action: "ACTION_MOVE_VIDEO_BEFORE", setVideoId: m.id, movedSetVideoIdSuccessor: t });
                t = m.id;
            }
            const batchInfo = { batchNum, items: ch.length, acts: acts.length, skipped, status: null, errorBody: null, attempts: 0 };

            if (acts.length) {
                const MAX_ATTEMPTS = 4;
                let resp = null;
                for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                    batchInfo.attempts = attempt;
                    try {
                        resp = await fetch(`https://music.youtube.com/youtubei/v1/browse/edit_playlist?key=${client.apiKey}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": ah, "X-Origin": window.location.origin, "X-Goog-AuthUser": client.authUser, "X-Youtube-Client-Name": client.clientName, "X-Youtube-Client-Version": client.clientVersion },
                            body: JSON.stringify({ context: client.context, playlistId: pid, actions: acts }),
                            credentials: 'include'
                        });
                        batchInfo.status = resp.status;
                        if (resp.ok) break;
                        try { batchInfo.errorBody = (await resp.text()).slice(0, 500); } catch (e) {}
                        warn(`[YTM-DIAG] Lote ${batchNum} HTTP ${resp.status} tentativa ${attempt}/${MAX_ATTEMPTS}`);
                    } catch(e) {
                        batchInfo.status = 'fetch-error';
                        batchInfo.errorBody = e.message;
                        warn(`[YTM-DIAG] Lote ${batchNum} fetch erro tentativa ${attempt}/${MAX_ATTEMPTS}:`, e.message);
                    }
                    if (attempt < MAX_ATTEMPTS) {
                        const delay = 1500 * Math.pow(2, attempt - 1);
                        await new Promise(r => setTimeout(r, delay));
                    }
                }

                if (!resp || !resp.ok) {
                    // ABORT — continuar com lotes seguintes corromperia toda a ordem
                    warn(`[YTM-DIAG] Lote ${batchNum} falhou após ${MAX_ATTEMPTS} tentativas. ABORTANDO sort.`);
                    diag.batches.push(batchInfo);
                    if (window.YTM.debugMode) {
                        try { window.YTM.exportarSortLogs(); } catch (e) {}
                    }
                    window.YTM.UI.error(`Falha persistente no lote ${batchNum}/${tot} (HTTP ${batchInfo.status}). Ordenação abortada para evitar bagunçar a playlist. Aguarde alguns minutos e tente novamente.`);
                    return;
                }

                await new Promise(r => setTimeout(r, window.YTM.config.DELAY_BATCH));
            }
            diag.batches.push(batchInfo);
            await window.YTM.Common.yield();
        }
        window.YTM.UI.success(falhas);
    }

    // =========================================================
    // PROCESSO PRINCIPAL
    // =========================================================

    async function iniciarProcesso(modes, isReverse, creds) {
        try {
            isCancelled = false;
            window.YTM.Queue.clear();
            window.YTM.UI.send('UI_START');

            const diag = {
                version: 'v2.1.0',
                ts: new Date().toISOString(),
                modes, isReverse,
                metaTotal: null,
                domCount: null,
                contentsCount: null,
                listaCount: null,
                rendererOrphans: [],
                domOnlyOrphans: [],
                listaSample: { primeiros: [], ultimos: [] },
                sortedSample: { primeiros: [], ultimos: [] },
                batches: [],
                topId: null
            };
            if (window.YTM.debugMode) window.YTM._sortDiag = diag;
            log(`[YTM-DIAG] ===== INÍCIO ${diag.version} ===== modes=${JSON.stringify(modes)} reverse=${isReverse}`);

            const scrollResult = await realizarScrollCompleto();
            if (scrollResult === -1) {
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

            const domCount = getLoadedCount();
            diag.metaTotal = window.YTM.Parser.getTotalPlaylistCount();
            diag.contentsCount = renderer.data.contents.length;
            diag.domCount = domCount;
            log(`[YTM-DIAG] meta=${diag.metaTotal}  contents=${diag.contentsCount}  dom=${domCount}  lista(pré)=${lista.length}`);

            if (lista.length < domCount) {
                warn(`[YTM] Data model incompleto (${lista.length} vs DOM ${domCount}). Re-sync...`);
                await new Promise(r => setTimeout(r, 1500));
                if (renderer.data?.contents) {
                    lista = renderer.data.contents
                        .map(i => i.musicResponsiveListItemRenderer)
                        .filter(i => i && i.playlistItemData)
                        .map(window.YTM.Parser.extrairDadosBasicos)
                        .filter(m => m !== null);
                    diag.contentsCount = renderer.data.contents.length;
                    log(`[YTM-DIAG] Re-sync: contents=${diag.contentsCount}  lista=${lista.length}`);
                }
            }
            diag.listaCount = lista.length;

            if (lista.length === 0) return window.YTM.UI.error("Vazia.");
            const topId = lista[0].id;
            diag.topId = topId;

            // ÓRFÃOS — duas fontes:
            // (1) renderer.data.contents: itens com playlistItemData mas que falharam no parser.
            // (2) DOM: itens renderizados mas ausentes de renderer.data.contents
            //     (caso de timing do lit-element ou virtualização).
            const seenIds = new Set(lista.map(m => m.id));
            const orfaos = [];

            // (1) órfãos via renderer.data.contents
            for (const c of renderer.data.contents) {
                const it = c?.musicResponsiveListItemRenderer;
                if (!it || !it.playlistItemData) continue;
                const id = it.playlistItemData.playlistSetVideoId;
                if (!id || seenIds.has(id)) continue;
                seenIds.add(id);
                const tituloHint = it?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || '?';
                const artistaHint = it?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || '?';
                const o = { id, videoId: it.playlistItemData.videoId, isOrphan: true, source: 'renderer', titulo: tituloHint, artista: artistaHint };
                orfaos.push(o);
                diag.rendererOrphans.push(o);
            }

            // (2) órfãos só no DOM
            const domNodes = Array.from(document.querySelectorAll('ytmusic-responsive-list-item-renderer'));
            for (const node of domNodes) {
                try {
                    const data = node.data || node.__data;
                    const pid = data?.playlistItemData;
                    if (!pid?.playlistSetVideoId) continue;
                    if (seenIds.has(pid.playlistSetVideoId)) continue;
                    const tituloHint = data?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text
                        || node.querySelector('.title')?.textContent?.trim()
                        || '?';
                    const artistaHint = data?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || '?';
                    seenIds.add(pid.playlistSetVideoId);
                    const o = { id: pid.playlistSetVideoId, videoId: pid.videoId, isOrphan: true, source: 'dom-only', titulo: tituloHint, artista: artistaHint };
                    orfaos.push(o);
                    diag.domOnlyOrphans.push(o);
                } catch (e) { /* skip */ }
            }

            log(`[YTM-DIAG] Órfãos: total=${orfaos.length}  via-renderer=${diag.rendererOrphans.length}  via-dom=${diag.domOnlyOrphans.length}`);
            if (orfaos.length > 0) {
                warn(`[YTM-DIAG] Órfãos detalhados:`);
                orfaos.forEach(o => warn(`   [${o.source}] "${o.titulo}" — ${o.artista}  (setVideoId=${o.id})`));
            }

            diag.listaSample.primeiros = lista.slice(0, 3).map(m => `"${m.titulo}" — ${m.artista}`);
            diag.listaSample.ultimos = lista.slice(-3).map(m => `"${m.titulo}" — ${m.artista}`);

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

            diag.sortedSample.primeiros = lista.slice(0, 5).map(m => `"${m.titulo}" — ${m.artista}`);
            diag.sortedSample.ultimos = lista.slice(-5).map(m => `"${m.titulo}" — ${m.artista}`);
            log(`[YTM-DIAG] Sort OK. Primeiros 5:`, diag.sortedSample.primeiros);
            log(`[YTM-DIAG] Sort OK. Últimos 5:`, diag.sortedSample.ultimos);

            // Anexa órfãos ao final do bloco ordenado.
            if (orfaos.length > 0) {
                lista = lista.concat(orfaos);
                falhas += orfaos.length;
                log(`[YTM-DIAG] +${orfaos.length} órfãos anexados ao fim. lista total = ${lista.length}`);
            }

            if (!isReverse) lista.reverse();

            await enviarParaYouTube(lista, topId, renderer.data.playlistId, falhas);
            log(`[YTM-DIAG] ===== FIM ===== Para exportar diagnóstico: window.YTM.debugMode = true e repita o sort.`);

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
