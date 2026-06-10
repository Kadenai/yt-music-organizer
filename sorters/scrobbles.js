// sorters/scrobbles.js

(function() {

    const t = (key) => (window.I18N && window.I18N.t) ? window.I18N.t(key) : key;

    async function fetchUserScrobbles(musica, key, user) {
        try {
            const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${key}&username=${user}&artist=${encodeURIComponent(musica.artistaOriginal || musica.artista)}&track=${encodeURIComponent(musica.tituloOriginal || musica.titulo)}&format=json&autocorrect=1`;
            const r = await fetch(url);
            const j = await r.json();
            if (j.error) return null; // erro da API = "desconhecido", não "0 plays"
            if (j.track && j.track.userplaycount) return parseInt(j.track.userplaycount);
            return 0; // faixa encontrada, usuário nunca ouviu
        } catch { return null; } // erro de rede = "desconhecido", não "0 plays"
    }

    // Valida chave + usuário com UMA chamada barata antes de processar a playlist
    // inteira: antes, credencial errada virava silenciosamente "0 plays" em tudo.
    async function validarCredenciais(key, user) {
        try {
            const url = `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${encodeURIComponent(user)}&api_key=${key}&format=json`;
            const j = await (await fetch(url)).json();
            if (j.error === 10 || j.error === 26) return 'key';  // chave inválida/suspensa
            if (j.error === 6) return 'user';                    // usuário não existe
            return 'ok';
        } catch { return 'ok'; } // erro de rede não prova nada — segue o fluxo
    }

    if (window.YTM && window.YTM.sorters) {
        window.YTM.sorters['MY_SCROBBLES'] = {

            enrich: async (lista, creds) => {
                if (!creds || !creds.user || !creds.key) {
                    window.YTM.UI.error(t('errNoUser'));
                    const e = new Error("Missing Last.fm credentials");
                    e.handled = true;
                    throw e;
                }

                const status = await validarCredenciais(creds.key, creds.user);
                if (status !== 'ok') {
                    window.YTM.UI.error(status === 'key' ? t('errBadKey') : t('errBadUser'));
                    const e = new Error("Invalid Last.fm credentials");
                    e.handled = true;
                    throw e;
                }

                let falhas = 0;
                let proc = 0;
                const limite = 5; // Concorrência

                for (let i = 0; i < lista.length; i += limite) {
                    if (window.YTM.cancelled) return falhas;
                    const lote = lista.slice(i, i + limite);
                    await Promise.all(lote.map(async m => {
                        const plays = await fetchUserScrobbles(m, creds.key, creds.user);
                        if (plays === null) {
                            m.userPlays = -1; // desconhecido → ordena depois de quem tem dado
                            falhas++;
                        } else {
                            m.userPlays = plays;
                        }
                        proc++;
                    }));

                    if (proc % 10 === 0) {
                        window.YTM.UI.update(t('statusScrobbles'), `${proc}/${lista.length}`);
                    }
                    await new Promise(r => setTimeout(r, 100));
                }

                return falhas;
            },

            compare: (a, b) => {
                return (Number(b.userPlays)||0) - (Number(a.userPlays)||0);
            }
        };
        console.log("[YTM] Sorter 'MY_SCROBBLES' registrado.");
    }
})();
