// sorters/title.js

(function() {
    // Registra o comparador no objeto global
    if (window.YTM && window.YTM.sorters) {
        
        window.YTM.sorters['TITLE_AZ'] = {
            // Não precisa de enriquecimento (dados já vêm do DOM)
            enrich: async (list) => { /* Nada a fazer */ },
            
            // Função de Comparação
            compare: (a, b) => {
                // numeric: "Track 2" antes de "Track 10" (ordem natural de números)
                return a.titulo.localeCompare(b.titulo, undefined, { numeric: true, sensitivity: 'base' });
            }
        };
        
        console.log("[YTM] Sorter 'TITLE_AZ' registrado.");
    }
})();