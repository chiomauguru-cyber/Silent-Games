let games = [];
let activeCategory = 'All';
let searchQuery = '';

// DOM Elements
const gamesGrid = document.getElementById('games-grid');
const categoryFilters = document.getElementById('category-filters');
const searchInput = document.getElementById('search-input');
const mobileSearchInput = document.getElementById('mobile-search-input');
const browseView = document.getElementById('browse-view');
const playerView = document.getElementById('player-view');
const gameIframe = document.getElementById('game-iframe');
const gameTitle = document.getElementById('game-title');
const playingTitle = document.getElementById('playing-title');
const playingCategory = document.getElementById('playing-category');
const noResults = document.getElementById('no-results');
const backButton = document.getElementById('back-button');
const closeButton = document.getElementById('close-button');
const fullscreenButton = document.getElementById('fullscreen-button');
const logo = document.getElementById('logo');
const yearSpan = document.getElementById('year');
const gameCanvas = document.getElementById('game-canvas');
const internalUI = document.getElementById('internal-game-ui');

// Set current year
yearSpan.textContent = new Date().getFullYear();

// Fetch games data
async function fetchGames() {
    try {
        const response = await fetch('games.json');
        games = await response.json();
        renderCategories();
        renderGames();
    } catch (error) {
        console.error('Error fetching games:', error);
    }
}

function renderCategories() {
    const categories = ['All', ...new Set(games.map(g => g.category))];
    categoryFilters.innerHTML = '';
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat;
        btn.className = `px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            activeCategory === cat 
                ? 'bg-emerald-500 text-black' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
        }`;
        btn.onclick = () => {
            activeCategory = cat;
            renderCategories();
            renderGames();
        };
        categoryFilters.appendChild(btn);
    });
}

function renderGames() {
    const filtered = games.filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || game.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    gamesGrid.innerHTML = '';
    
    if (filtered.length === 0) {
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
        filtered.forEach(game => {
            const card = document.createElement('div');
            card.className = "game-card group relative bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-emerald-500/50 transition-all cursor-pointer aspect-[4/3]";
            card.innerHTML = `
                <img
                    src="${game.thumbnail}"
                    alt="${game.title}"
                    class="w-full h-full object-cover opacity-60 transition-opacity duration-500"
                    referrerpolicy="no-referrer"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 flex flex-col justify-end">
                    <span class="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-1">
                        ${game.category}
                    </span>
                    <h3 class="font-bold text-white transition-colors truncate">
                        ${game.title}
                    </h3>
                </div>
            `;
            card.onclick = () => openGame(game);
            gamesGrid.appendChild(card);
        });
    }
}

function openGame(game) {
    browseView.classList.add('hidden');
    playerView.classList.remove('hidden');
    
    if (game.isInternal) {
        gameIframe.classList.add('hidden');
        if (game.id === 'retro-snake' && window.SnakeGame) {
            window.SnakeGame.start();
        } else if (game.id === 'car-chase' && window.CarChaseGame) {
            window.CarChaseGame.start();
        }
    } else {
        gameIframe.classList.remove('hidden');
        gameIframe.src = game.iframeUrl;
    }

    gameTitle.textContent = game.title;
    playingTitle.textContent = game.title;
    playingCategory.textContent = game.category;
    window.scrollTo(0, 0);
}

function closeGame() {
    playerView.classList.add('hidden');
    browseView.classList.remove('hidden');
    gameIframe.src = '';
    
    // Stop internal games
    if (window.SnakeGame) window.SnakeGame.stop();
    if (window.CarChaseGame) window.CarChaseGame.stop();
}

// Event Listeners
searchInput.oninput = (e) => {
    searchQuery = e.target.value;
    mobileSearchInput.value = searchQuery;
    renderGames();
};

mobileSearchInput.oninput = (e) => {
    searchQuery = e.target.value;
    searchInput.value = searchQuery;
    renderGames();
};

backButton.onclick = closeGame;
closeButton.onclick = closeGame;
logo.onclick = () => {
    closeGame();
    activeCategory = 'All';
    searchQuery = '';
    searchInput.value = '';
    mobileSearchInput.value = '';
    renderCategories();
    renderGames();
};

fullscreenButton.onclick = () => {
    if (gameIframe.requestFullscreen) {
        gameIframe.requestFullscreen();
    } else if (gameIframe.webkitRequestFullscreen) { /* Safari */
        gameIframe.webkitRequestFullscreen();
    } else if (gameIframe.msRequestFullscreen) { /* IE11 */
        gameIframe.msRequestFullscreen();
    }
};

// Start
fetchGames();
