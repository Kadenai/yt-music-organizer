// i18n.js - Central Translation Module v1.0

(function () {
    'use strict';

    const TRANSLATIONS = {
        en: {
            // ── Modal / Content Script ──
            modalTitle: "Sort Builder",
            activeLabel: "Active Criteria",
            emptyMsg: "Click below to add criteria...",
            lblReverse: "Reverse Order",
            btnCancel: "Cancel",
            btnOrganize: "ORGANIZE",
            btnClear: "Clear all",
            statusInit: "Starting...",
            statusPrep: "Preparing engine...",
            statusDone: "Success!",
            statusDoneMsg: "Playlist organized.",
            statusWarn: "Warning",
            statusWarnMsg: "$1 tracks without data were moved.",
            statusConnect: "Connecting...",
            mainBtn: "Organize",
            securityTitle: "Are you sure?",
            securityDesc: "This action rearranges your playlist permanently. We recommend creating a backup first.",
            btnConfirm: "YES, DO IT",
            btnBack: "Back",
            statusStopping: "Stopping...",
            statusStopped: "Cancelled by user.",
            tipViews: "<b>Tip:</b> For better accuracy on 'Popularity', add your Last.fm API Key in settings.",
            errScrobbles: "<b>Locked:</b> Please add your Last.fm Username in extension settings to use this feature.",
            maxLimit: "Maximum of 2 criteria reached.",

            // ── Criteria (short names) ──
            critArtist: "Artist Name",
            descArtist: "Group by author (A-Z)",
            critAlbum: "Album (Year/Order)",
            descAlbum: "Chronological order",
            critViews: "Popularity",
            descViews: "Most played (Global)",
            critScrobbles: "My Scrobbles",
            descScrobbles: "Your Last.fm history",
            critTitle: "Track Title",
            descTitle: "Title (A-Z)",
            critDuration: "Duration",
            descDuration: "Shortest to Longest",
            critShuffle: "True Shuffle",
            descShuffle: "Randomize everything",

            // ── Fusions ──
            fusMyFavAlbums: "My Favorite Albums",
            fusExpress: "Express Session",
            fusDisco: "Classic Discography",
            fusHallFame: "Hall of Fame",
            fusTopArtists: "My Top Artists",
            fusGreatestHits: "Band's Greatest Hits",
            fusFanClub: "Fan Club",
            fusArtistDur: "Shortest first (Per Artist)",

            // ── Full descriptions ──
            txtArtist: "Artists in alphabetical order.",
            txtAlbum: "Older albums come first, songs stay according to the original album order.",
            txtViews: "Most famous songs at the top (based on Last.fm/YouTube Views).",
            txtScrobbles: "Puts the songs you listened to the most at the top (requires Last.fm account).",
            txtTitle: "Songs in alphabetical order.",
            txtDuration: "Shortest songs first.",
            txtShuffle: "Random.",
            txtFavAlbums: "Your most listened albums from Last.fm play first.",
            txtExpress: "Shortest albums play first.",
            txtDisco: "Organizes Artists (A-Z). Within each artist, organizes their albums chronologically (from oldest to newest).",
            txtHallFame: "Most popular albums play first.",
            txtTopArtists: "Favorite artists from Last.fm play first.",
            txtGreatestHits: "Band A-Z. Within the band, hits play first.",
            txtFanClub: "Band A-Z. Within the band, songs you listen to the most on Last.fm play first.",
            txtArtistDur: "Band A-Z. Within the band, shortest songs play first.",

            // ── Popup ──
            popupTitle: "YT Music Organizer",
            warnTitle: "Safety Warning",
            warnDesc: "Confirm before sorting",
            lfmTitle: "Last.fm Integration (Optional)",
            lfmDesc: "Fill in to use \"My Scrobbles\":",
            lblKey: "API Key",
            lblUser: "Username",
            linkKey: "Get API Key",
            bug: "Report Bug",
            saving: "Saving...",
            saved: "Saved!",
            phKey: "Paste your key here...",
            phUser: "Your Last.fm username",

            // ── Welcome Page ──
            welBadge: "Installation Complete",
            welTitle1: "Your ",
            welHighlight1: "Playlist",
            welTitle2: ". Your ",
            welHighlight2: "Way",
            welTitle3: ".",
            welSubtitle: "Thank you for installing YT Music Organizer. Let us show you how to get started.",

            // How it works
            welHowTitle: "How Does It Work?",
            welStep1Num: "1",
            welStep1Title: "Open a Playlist",
            welStep1Desc: "Go to YouTube Music and open any of your own editable playlists.",
            welStep2Num: "2",
            welStep2Title: "Click \"Organize\"",
            welStep2Desc: "A button will appear at the bottom-right corner of the screen. Click it to open the Sort Builder.",
            welStep3Num: "3",
            welStep3Title: "Pick Your Criteria",
            welStep3Desc: "Choose one or two sorting criteria. The extension will rearrange your playlist automatically.",

            // Criteria
            welCritTitle: "Sorting ",
            welCritHighlight: "Criteria",
            welCritDesc: "Choose how to reorganize your playlist. You can pick up to two criteria that combine into powerful fusions:",
            welCritArtistTitle: "Artist Name",
            welCritArtistDesc: "Groups all songs by artist in alphabetical order (A-Z).",
            welCritAlbumTitle: "Album (Year/Order)",
            welCritAlbumDesc: "Older albums come first. Songs stay in the original album track order.",
            welCritPopTitle: "Popularity",
            welCritPopDesc: "Most famous songs at the top, based on Last.fm listeners or YouTube views.",
            welCritScrobTitle: "My Scrobbles",
            welCritScrobDesc: "Songs you listened to the most on Last.fm come first. Requires a Last.fm account.",
            welCritTitleTitle: "Track Title",
            welCritTitleDesc: "Songs in alphabetical order by title (A-Z).",
            welCritDurTitle: "Duration",
            welCritDurDesc: "Shortest songs first, longest songs last.",
            welCritShuffleTitle: "True Shuffle",
            welCritShuffleDesc: "Completely randomizes your playlist order.",

            // Fusions
            welFusionTitle: "The ",
            welFusionHighlight: "Magic",
            welFusionTitle2: " Fusions",
            welFusionDesc: "Combine two criteria to unlock special sorting modes:",
            welHallTitle: "Hall of Fame",
            welHallDesc: "Artist A-Z + Popularity. The top tracks of each band sorted from A to Z. Greatest masterpieces first!",
            welDiscoTitle: "Classic Discography",
            welDiscoDesc: "Artist A-Z + Album chronological. Dive into each artist's career from oldest to newest album.",
            welFavAlbumsTitle: "My Favorite Albums",
            welFavAlbumsDesc: "Scrobbles + Album. Your most-listened albums from Last.fm come first.",
            welGreatestTitle: "Band's Greatest Hits",
            welGreatestDesc: "Artist A-Z + Popularity. Within each band, the biggest hits play first.",
            welFanClubTitle: "Fan Club",
            welFanClubDesc: "Artist A-Z + Scrobbles. Within each band, the songs you listen to the most play first.",
            welExpressTitle: "Express Session",
            welExpressDesc: "Duration + Album. Shortest albums play first — perfect for quick sessions.",

            // Last.fm setup
            welLfmTitle: "Last.fm ",
            welLfmHighlight: "Setup",
            welLfmDesc: "Connect your Last.fm account to unlock Scrobble-based sorting and better Popularity accuracy.",
            welLfmWhyTitle: "Why connect Last.fm?",
            welLfmWhy1: "Enables \"My Scrobbles\" sorting — organize by what YOU actually listen to",
            welLfmWhy2: "Improves Popularity accuracy with Last.fm listener data",
            welLfmWhy3: "Unlocks fusion modes: Fan Club, My Top Artists, My Favorite Albums",
            welLfmGuideTitle: "How to get your API Key",
            welLfmStep1: "Go to the Last.fm API page (link below)",
            welLfmStep2: "Log in or create a free Last.fm account",
            welLfmStep3: "Fill in any name for \"Application Name\" (e.g. \"YTM Organizer\")",
            welLfmStep4: "Copy the \"API Key\" that appears on the next page",
            welLfmGetKey: "Open Last.fm API Page →",
            welLfmFormTitle: "Quick Setup",
            welLfmFormDesc: "Paste your credentials below — they'll be saved automatically:",
            welLfmLblUser: "Last.fm Username",
            welLfmLblKey: "API Key",
            welLfmPhUser: "Your Last.fm username",
            welLfmPhKey: "Paste your API key here...",
            welLfmSaving: "Saving...",
            welLfmSaved: "✓ Saved successfully!",
            welLfmSkip: "You can also set this up later in the extension settings (popup icon).",

            welCta: "Open YouTube Music 🎧",

            // ── Update Page ──
            updBadge: "Version 2.0 - Refactored Engine",
            updTitle1: "Popularity Got ",
            updHighlight: "Smarter",
            updTitle2: ".",
            updSubtitle: "Discover the substantial improvements in our internal algorithm.",
            updNewTitle: "What's New? 🚀",
            updNewDesc: "We rewrote the **Popularity** algorithm from scratch. It is now much more robust, incredibly fast thanks to the new cache system, and solves all tracking issues with special versions and request limits.",
            updFuzzyTitle: "\"Ninja\" Title Matching (Fuzzy Match)",
            updFuzzyDesc: "Say goodbye to failures with Live, Remastered, and alternative editions. Our algorithm has fuzzy tolerance for song title differences between YT and Last.fm, ensuring results even if the title isn't 100% identical.",
            updCacheTitle: "Cache-Based System (Flash!)",
            updCacheDesc: "We hate latency. Now the organizer is super fast because it remembers what it processed up to 72 hours ago, so for large albums or additional attempts the queries are already local and instant.",
            updHallTitle: "FUS_HALL_FAME Fairer",
            updHallDesc: "We replaced the simple summation model to use \"average\", so prolific artists with a thousand obscure songs don't outweigh artists with a smaller library but with stellar global top hits.",
            updFallbackTitle: "Active Fallbacks",
            updFallbackDesc: "Our updates covered API call rate limit drops (Error 429) from YouTube by implementing intelligent retry with exponential backoff, so the order doesn't get ruined halfway through.",
            updTieTitle: "Tie Preserved",
            updTieDesc: "In complex and cross-sorted orderings, if the final criterion is a tie, the organization will try to stick to and prioritize your playlist's manual order, for better aesthetic sense than arbitrary (A-Z of original subtitle).",
            updCta: "Back to Music 🎧"
        },
        pt: {
            // ── Modal / Content Script ──
            modalTitle: "Construtor de Ordem",
            activeLabel: "Critérios Ativos",
            emptyMsg: "Clique abaixo para adicionar critérios...",
            lblReverse: "Ordem Reversa",
            btnCancel: "Cancelar",
            btnOrganize: "ORGANIZAR",
            btnClear: "Limpar tudo",
            statusInit: "Iniciando...",
            statusPrep: "Preparando motor...",
            statusDone: "Sucesso!",
            statusDoneMsg: "Playlist organizada.",
            statusWarn: "Aviso",
            statusWarnMsg: "$1 músicas sem dados foram movidas.",
            statusConnect: "Conectando...",
            mainBtn: "Organizar",
            securityTitle: "Tem certeza?",
            securityDesc: "Essa ação reordena a playlist permanentemente. Recomendamos criar um backup antes.",
            btnConfirm: "SIM, ORGANIZAR",
            btnBack: "Voltar",
            statusStopping: "Parando...",
            statusStopped: "Cancelado pelo usuário.",
            tipViews: "<b>Dica:</b> Para maior precisão em 'Popularidade', adicione sua Chave API do Last.fm nas configurações.",
            errScrobbles: "<b>Bloqueado:</b> Adicione seu Usuário Last.fm nas configurações da extensão para usar este recurso.",
            maxLimit: "Máximo de 2 critérios atingido.",

            // ── Criteria (short names) ──
            critArtist: "Nome do Artista",
            descArtist: "Agrupar por autor (A-Z)",
            critAlbum: "Álbum (Ano/Ordem)",
            descAlbum: "Ordem cronológica",
            critViews: "Popularidade",
            descViews: "Mais ouvidas (Global)",
            critScrobbles: "Meus Scrobbles",
            descScrobbles: "Seu histórico Last.fm",
            critTitle: "Nome da Música",
            descTitle: "Título (A-Z)",
            critDuration: "Duração",
            descDuration: "Curta p/ Longa",
            critShuffle: "Aleatório Real",
            descShuffle: "Embaralhar tudo",

            // ── Fusions ──
            fusMyFavAlbums: "Meus Álbuns Preferidos",
            fusExpress: "Sessão Expressa",
            fusDisco: "Discografia Clássica",
            fusHallFame: "Hall da Fama",
            fusTopArtists: "Meu Top Artistas",
            fusGreatestHits: "Greatest Hits da Banda",
            fusFanClub: "Fã Clube",
            fusArtistDur: "Curta p/ Longa (Por Artista)",

            // ── Full descriptions ──
            txtArtist: "Artistas em ordem alfabética.",
            txtAlbum: "Álbuns mais antigos vêm primeiro, músicas ficam de acordo com a ordem original do álbum.",
            txtViews: "Músicas mais famosas no topo (baseado em Last.fm/YouTube Views).",
            txtScrobbles: "Coloca as músicas que você mais ouviu no topo (requer conta Last.fm).",
            txtTitle: "Músicas em ordem alfabética.",
            txtDuration: "Músicas mais curtas primeiro.",
            txtShuffle: "Aleatório.",
            txtFavAlbums: "Seus álbuns mais ouvidos do Last.fm tocam primeiro.",
            txtExpress: "Álbuns mais curtos tocam primeiro.",
            txtDisco: "Organiza Artistas (A-Z). Dentro de cada artista, organiza seus álbuns cronologicamente (do mais antigo ao último lançado).",
            txtHallFame: "Álbuns mais populares tocam primeiro.",
            txtTopArtists: "Artistas preferidos do Last.fm tocam primeiro.",
            txtGreatestHits: "Banda A-Z. Dentro da banda, os sucessos tocam primeiro.",
            txtFanClub: "Banda A-Z. Dentro da banda, as músicas que você mais ouve no Last.fm tocam primeiro.",
            txtArtistDur: "Banda A-Z. Dentro da banda, as músicas mais curtas tocam primeiro.",

            // ── Popup ──
            popupTitle: "YT Music Organizer",
            warnTitle: "Aviso de Segurança",
            warnDesc: "Confirmar antes de ordenar",
            lfmTitle: "Integração Last.fm (Opcional)",
            lfmDesc: "Preencha para usar \"Meus Scrobbles\":",
            lblKey: "Chave da API",
            lblUser: "Usuário",
            linkKey: "Obter Chave",
            bug: "Reportar Bug",
            saving: "Salvando...",
            saved: "Salvo!",
            phKey: "Cole sua chave aqui...",
            phUser: "Seu usuário Last.fm",

            // ── Welcome Page ──
            welBadge: "Instalação Concluída",
            welTitle1: "A sua ",
            welHighlight1: "Playlist",
            welTitle2: ". Do seu ",
            welHighlight2: "Jeito",
            welTitle3: ".",
            welSubtitle: "Obrigado por instalar o YT Music Organizer. Vamos te mostrar por onde começar.",

            // How it works
            welHowTitle: "Como Funciona?",
            welStep1Num: "1",
            welStep1Title: "Abra uma Playlist",
            welStep1Desc: "Vá ao YouTube Music e abra qualquer uma das suas playlists editáveis.",
            welStep2Num: "2",
            welStep2Title: "Clique em \"Organizar\"",
            welStep2Desc: "Um botão aparecerá no canto inferior direito da tela. Clique nele para abrir o Construtor de Ordem.",
            welStep3Num: "3",
            welStep3Title: "Escolha seus Critérios",
            welStep3Desc: "Selecione um ou dois critérios de ordenação. A extensão vai reorganizar sua playlist automaticamente.",

            // Criteria
            welCritTitle: "Critérios de ",
            welCritHighlight: "Ordenação",
            welCritDesc: "Escolha como reorganizar sua playlist. Você pode selecionar até dois critérios que se combinam em fusões poderosas:",
            welCritArtistTitle: "Nome do Artista",
            welCritArtistDesc: "Agrupa todas as músicas por artista em ordem alfabética (A-Z).",
            welCritAlbumTitle: "Álbum (Ano/Ordem)",
            welCritAlbumDesc: "Álbuns mais antigos vêm primeiro. As músicas ficam na ordem original do álbum.",
            welCritPopTitle: "Popularidade",
            welCritPopDesc: "Músicas mais famosas no topo, baseado em ouvintes do Last.fm ou views do YouTube.",
            welCritScrobTitle: "Meus Scrobbles",
            welCritScrobDesc: "As músicas que você mais ouviu no Last.fm vêm primeiro. Requer conta no Last.fm.",
            welCritTitleTitle: "Nome da Música",
            welCritTitleDesc: "Músicas em ordem alfabética por título (A-Z).",
            welCritDurTitle: "Duração",
            welCritDurDesc: "Músicas mais curtas primeiro, mais longas por último.",
            welCritShuffleTitle: "Aleatório Real",
            welCritShuffleDesc: "Embaralha completamente a ordem da sua playlist.",

            // Fusions
            welFusionTitle: "As Fusões ",
            welFusionHighlight: "Mágicas",
            welFusionTitle2: "",
            welFusionDesc: "Combine dois critérios para desbloquear modos especiais de ordenação:",
            welHallTitle: "Hall da Fama",
            welHallDesc: "Artista A-Z + Popularidade. O Top Músicas de cada banda separados da A a Z. As maiores master-pieces primeiro!",
            welDiscoTitle: "Discografia Clássica",
            welDiscoDesc: "Artista A-Z + Álbum cronológico. Mergulhe na carreira de cada artista do álbum mais antigo ao mais recente.",
            welFavAlbumsTitle: "Meus Álbuns Preferidos",
            welFavAlbumsDesc: "Scrobbles + Álbum. Seus álbuns mais ouvidos do Last.fm tocam primeiro.",
            welGreatestTitle: "Greatest Hits da Banda",
            welGreatestDesc: "Artista A-Z + Popularidade. Dentro de cada banda, os maiores sucessos tocam primeiro.",
            welFanClubTitle: "Fã Clube",
            welFanClubDesc: "Artista A-Z + Scrobbles. Dentro de cada banda, as músicas que você mais ouve tocam primeiro.",
            welExpressTitle: "Sessão Expressa",
            welExpressDesc: "Duração + Álbum. Álbuns mais curtos tocam primeiro — perfeito para sessões rápidas.",

            // Last.fm setup
            welLfmTitle: "Configurar ",
            welLfmHighlight: "Last.fm",
            welLfmDesc: "Conecte sua conta do Last.fm para desbloquear ordenação por Scrobbles e melhorar a precisão da Popularidade.",
            welLfmWhyTitle: "Por que conectar o Last.fm?",
            welLfmWhy1: "Habilita a ordenação \"Meus Scrobbles\" — organize pelo que VOCÊ realmente ouve",
            welLfmWhy2: "Melhora a precisão da Popularidade com dados de ouvintes do Last.fm",
            welLfmWhy3: "Desbloqueia fusões: Fã Clube, Meu Top Artistas, Meus Álbuns Preferidos",
            welLfmGuideTitle: "Como obter sua Chave de API",
            welLfmStep1: "Acesse a página de API do Last.fm (link abaixo)",
            welLfmStep2: "Faça login ou crie uma conta gratuita no Last.fm",
            welLfmStep3: "Preencha qualquer nome em \"Application Name\" (ex: \"YTM Organizer\")",
            welLfmStep4: "Copie a \"API Key\" que aparece na página seguinte",
            welLfmGetKey: "Abrir Página de API do Last.fm →",
            welLfmFormTitle: "Configuração Rápida",
            welLfmFormDesc: "Cole suas credenciais abaixo — elas serão salvas automaticamente:",
            welLfmLblUser: "Usuário Last.fm",
            welLfmLblKey: "Chave da API",
            welLfmPhUser: "Seu usuário Last.fm",
            welLfmPhKey: "Cole sua chave de API aqui...",
            welLfmSaving: "Salvando...",
            welLfmSaved: "✓ Salvo com sucesso!",
            welLfmSkip: "Você também pode configurar isso depois nas configurações da extensão (ícone do popup).",

            welCta: "Abrir YouTube Music 🎧",

            // ── Update Page ──
            updBadge: "Versão 2.0 - Motor Refatorado",
            updTitle1: "A Popularidade Ficou ",
            updHighlight: "Inteligente",
            updTitle2: ".",
            updSubtitle: "Descubra as melhorias substanciais no nosso algoritmo interno.",
            updNewTitle: "O Que Há De Novo? 🚀",
            updNewDesc: "Reescrevemos o algoritmo de **Popularidade** do zero. Agora ele é muito mais robusto, incrivelmente rápido graças ao novo sistema de cache e resolve todos os problemas de rastreamento com versões especiais e limites de requisição.",
            updFuzzyTitle: "Match de Títulos \"Ninja\" (Fuzzy Match)",
            updFuzzyDesc: "Diga adeus as falhas com versões Ao Vivo, Remasterizadas e edições alternativas. Nosso algoritmo tem uma tolerância em formato fuzzy com as grafias da música no YT e no Last.fm, garantindo resultados mesmo se o título não for 100% idêntico.",
            updCacheTitle: "Sistema Baseado em Cache (Flash!)",
            updCacheDesc: "Odiamos latência. Agora o organizador é super rápido pois se lembra do que processou até 72 horas atrás, então para álbuns extensos ou tentativas adicionais as consultas já estão locais e instantâneas.",
            updHallTitle: "FUS_HALL_FAME Mais Justo",
            updHallDesc: "Substituímos o modelo de somatória simples para usar \"média\", logo, artistas prolíficos com mil e um sons mais obscuros não sobrepõem os artistas com menor biblioteca mas com hits estelares de topo global.",
            updFallbackTitle: "Fallbacks Ativos",
            updFallbackDesc: "Nossas atualizações cobriram as quedas de limite de chamadas Error 429 da API do YouTube implementando re-try inteligente com decaimento exponencial, para a ordem não ser arruinada na metade.",
            updTieTitle: "Empate Preservado",
            updTieDesc: "Nas ordenações complexas e cruzadas, se empatar o critério final, a organização tentará se apegar e priorizar a ordem manual da sua playlist, para fazer mais sentido estético do que o arbitrário (A-Z do subtítulo original).",
            updCta: "Voltar para a Música 🎧"
        }
    };

    /**
     * Detects the user's language based on `navigator.language`.
     * pt-BR, pt-PT, es-* → 'pt' (Portuguese version)
     * Everything else → 'en'
     */
    function detectLang() {
        const lang = (navigator.language || 'en').toLowerCase();
        if (lang.startsWith('pt') || lang.startsWith('es')) return 'pt';
        return 'en';
    }

    const currentLang = detectLang();

    /**
     * Returns the translated string for the given key.
     * Falls back to English if the key is missing in the current language,
     * and returns the raw key if not found at all.
     */
    function t(key) {
        return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key])
            || TRANSLATIONS.en[key]
            || key;
    }

    // Expose globally
    window.I18N = {
        t: t,
        lang: currentLang,
        TRANSLATIONS: TRANSLATIONS
    };
})();
