// sorters/duration.js

(function() {
    if (window.YTM && window.YTM.sorters) {
        
        // 1. Duração (Curta -> Longa)
        window.YTM.sorters['DURATION'] = {
            enrich: async (list) => { /* Nada a fazer */ },

            compare: (a, b) => {
                // Duração desconhecida (0 = não conseguiu ler) vai para o FIM,
                // não para o topo como se fosse a música mais curta.
                const da = a.duration > 0 ? a.duration : Number.MAX_SAFE_INTEGER;
                const db = b.duration > 0 ? b.duration : Number.MAX_SAFE_INTEGER;
                return da - db;
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