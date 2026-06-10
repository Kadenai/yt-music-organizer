🎵 YT Music Organizer

[English below]

🇧🇷 Português

Organize suas playlists do YouTube Music automaticamente com critérios avançados e metadados reais.

O YT Music Organizer é uma extensão para Firefox que injeta superpoderes na interface do YouTube Music. Diferente de organizadores simples que apenas alfabetizam títulos, esta ferramenta consulta bancos de dados externos (iTunes, MusicBrainz, Last.fm) para entender o contexto da sua música — Ano de Lançamento, Número da Faixa, Popularidade Global e seu Histórico de Reprodução pessoal.

✨ Principais Funcionalidades

Ordenação Inteligente: Organize por Título, Artista, Duração, Popularidade ou Ano do Álbum.

Sistema de Alquimia (Fusões): Combine dois critérios para criar uma nova lógica de agrupamento.

Metadados Reais: Busca o ano original de lançamento e a ordem correta das faixas (evitando bagunça com Singles e Coletâneas).

Scroll Inteligente: Carrega playlists gigantes (+500 itens) automaticamente antes de ordenar.

Performance Otimizada: Sistema de Cache e Fila de Requisições para não travar o navegador, mesmo em computadores mais antigos.

Segurança: Detecta Álbuns Oficiais (que não podem ser editados) e esconde o botão para evitar erros.

⚗️ A Alquimia (Fusões de Ouro)

O recurso exclusivo desta extensão. Ao selecionar dois critérios compatíveis, eles se fundem em um Critério Dourado, criando uma regra de organização complexa:

🏆 Hall da Fama (Popularidade + Artista)

Agrupa artistas. O artista com a melhor média de views por música toca primeiro (com toda sua discografia). A média evita que artistas com muitas músicas medianas passem na frente de quem tem hits gigantes.

❤️ Meu Top Artistas (Scrobbles + Artista)

Seus artistas mais ouvidos (baseado no Last.fm) tocam primeiro.

🎸 Discografia Clássica (Artista + Álbum)

Organiza Artistas (A-Z). Dentro de cada artista, ordena os álbuns cronologicamente (1990 > 1995 > 2000...).

💿 Meus Álbuns Preferidos (Scrobbles + Álbum)

Os álbuns que você mais ouve na vida tocam primeiro (inteiros).

⚡ Sessão Expressa (Duração + Álbum)

Álbuns curtos e EPs tocam primeiro. Ótimo para sessões rápidas.

🌟 Greatest Hits da Banda (Artista + Popularidade)

Agrupa por Artista. Dentro do artista, os maiores sucessos tocam primeiro.

🛠️ Como Funciona (Técnico)

Injeção: A extensão injeta scripts (main.js e os sorters) no contexto da página para acessar a API interna do YouTube (GAPI).

Enriquecimento:

iTunes API: Usada para descobrir o Ano Original e o Número da Faixa (Track Number) para garantir a ordem correta do álbum.

MusicBrainz: Atua como "Auditor". Se houver dúvida entre um Álbum e um Single, ele analisa a pontuação para priorizar o álbum completo.

Last.fm: Usado para dados de Popularidade Global e Scrobbles pessoais.

Processamento:

Utiliza localStorage para cachear resultados de API (reduzindo o tempo de execuções futuras a zero).

Implementa Throttling para limitar requisições simultâneas e evitar sobrecarga de rede.

Implementa Yielding para manter a interface responsiva durante cálculos pesados (permitindo o uso do botão Parar).

🇺🇸 English

Automatically organize your YouTube Music playlists using advanced criteria and real metadata.

YT Music Organizer is a Firefox extension that injects superpowers into the YouTube Music interface. Unlike simple sorters that just alphabetize titles, this tool queries external databases (iTunes, MusicBrainz, Last.fm) to understand the context of your music — Original Release Year, Track Number, Global Popularity, and your personal Listening History.

✨ Key Features

Smart Sorting: Sort by Title, Artist, Duration, Popularity, or Album Year.

Alchemy System (Fusions): Combine two criteria to create a brand new grouping logic.

Real Metadata: Fetches the original release year and correct track order (avoiding mess with Singles and Compilations).

Smart Scroll: Automatically loads massive playlists (+500 items) before sorting.

Optimized Performance: Uses Caching and Request Queuing systems to prevent browser freezing, even on older hardware.

Safety: Detects Official Albums (read-only) and hides the button to prevent errors.

⚗️ The Alchemy (Golden Fusions)

The unique feature of this extension. When you select two compatible criteria, they merge into a Golden Criterion, creating a complex organization rule:

🏆 Hall of Fame (Popularity + Artist)

Groups artists. The artist with the highest average views per song plays first (with their full discography). Using the average prevents artists with many mid-tier songs from outranking artists with massive hits.

❤️ My Top Artists (Scrobbles + Artist)

Your most-listened-to artists (based on Last.fm) play first.

🎸 Classic Discography (Artist + Album)

Sorts Artists (A-Z). Within each artist, sorts albums chronologically (1990 > 1995 > 2000...).

💿 My Favorite Albums (Scrobbles + Album)

The albums you listen to the most play first (in their entirety).

⚡ Express Session (Duration + Album)

Short albums and EPs play first. Great for quick listening sessions.

🌟 Band's Greatest Hits (Artist + Popularity)

Groups by Artist. Within the band, their biggest hits play first.

🛠️ How It Works (Technical)

Injection: The extension injects scripts (main.js and the sorters) into the page context to access YouTube's internal API (GAPI).

Enrichment:

iTunes API: Used to discover the Original Year and Track Number to ensure correct album order.

MusicBrainz: Acts as an "Auditor". If there's ambiguity between an Album and a Single, it scores releases to prioritize the full album.

Last.fm: Used for Global Popularity and Personal Scrobbles data.

Processing:

Uses localStorage to cache API results (reducing future execution time to near zero).

Implements Throttling to limit simultaneous requests and avoid network overload.

Implements Yielding to keep the UI responsive during heavy calculations (allowing the use of the Stop button).
