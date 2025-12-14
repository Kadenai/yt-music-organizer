// sorters/title.js

(function() {
    // Registra o comparador no objeto global
    if (window.YTM && window.YTM.sorters) {
        
        window.YTM.sorters['TITLE_AZ'] = {
            // Não precisa de enriquecimento (dados já vêm do DOM)
            enrich: async (list) => { /* Nada a fazer */ },
            
            // Função de Comparação
            compare: (a, b) => {
                return a.titulo.localeCompare(b.titulo);
            }
        };
        
        console.log("[YTM] Sorter 'TITLE_AZ' registrado.");
    }
})();