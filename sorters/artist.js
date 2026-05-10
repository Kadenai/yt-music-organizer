// sorters/artist.js

(function() {
    if (window.YTM && window.YTM.sorters) {
        
        window.YTM.sorters['ARTIST_AZ'] = {
            enrich: async (list) => { /* Nada a fazer */ },
            
            compare: (a, b) => {
                return (a.artistaOriginal || a.artista).localeCompare(b.artistaOriginal || b.artista, undefined, { sensitivity: 'base' });
            }
        };
        
        console.log("[YTM] Sorter 'ARTIST_AZ' registrado.");
    }
})();