// sorters/artist.js

(function() {
    if (window.YTM && window.YTM.sorters) {
        
        window.YTM.sorters['ARTIST_AZ'] = {
            enrich: async (list) => { /* Nada a fazer */ },
            
            compare: (a, b) => {
                return a.artista.localeCompare(b.artista);
            }
        };
        
        console.log("[YTM] Sorter 'ARTIST_AZ' registrado.");
    }
})();