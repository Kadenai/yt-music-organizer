// sorters/duration.js

(function() {
    if (window.YTM && window.YTM.sorters) {
        
        // 1. Duração (Curta -> Longa)
        window.YTM.sorters['DURATION'] = {
            enrich: async (list) => { /* Nada a fazer */ },
            
            compare: (a, b) => {
                return a.duration - b.duration;
            }
        };

        // 2. Shuffle (Aleatório Real)
        // Usa o randomSeed gerado no parsing inicial
        window.YTM.sorters['SHUFFLE'] = {
            enrich: async (list) => { /* Nada a fazer */ },
            
            compare: (a, b) => {
                return a.randomSeed - b.randomSeed;
            }
        };
        
        console.log("[YTM] Sorters 'DURATION' e 'SHUFFLE' registrados.");
    }
})();