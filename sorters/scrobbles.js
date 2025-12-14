// sorters/scrobbles.js

(function() {
    
    async function fetchUserScrobbles(musica, key, user) {
        if (!key || !user) return 0;
        try {
            const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${key}&username=${user}&artist=${encodeURIComponent(musica.artista)}&track=${encodeURIComponent(musica.titulo)}&format=json&autocorrect=1`;
            const r = await fetch(url);
            const j = await r.json();
            if (j.track && j.track.userplaycount) return parseInt(j.track.userplaycount);
            return 0;
        } catch { return 0; }
    }

    if (window.YTM && window.YTM.sorters) {
        window.YTM.sorters['MY_SCROBBLES'] = {
            
            enrich: async (lista, creds) => {
                if (!creds || !creds.user) { 
                    window.YTM.UI.error("Configure seu usuário Last.fm!"); 
                    throw new Error("Missing User");
                }

                let proc = 0;
                const limite = 5; // Concorrência
                
                for (let i = 0; i < lista.length; i += limite) {
                    const lote = lista.slice(i, i + limite);
                    await Promise.all(lote.map(async m => {
                        m.userPlays = await fetchUserScrobbles(m, creds.key, creds.user);
                        proc++;
                    }));
                    
                    if(proc % 10 === 0) {
                        window.YTM.UI.update("Meus Scrobbles...", `Verificando ${proc}/${lista.length}`);
                    }
                    await new Promise(r => setTimeout(r, 100));
                }
            },

            compare: (a, b) => {
                return (Number(b.userPlays)||0) - (Number(a.userPlays)||0);
            }
        };
        console.log("[YTM] Sorter 'MY_SCROBBLES' registrado.");
    }
})();