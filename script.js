let resources = [];
let dashboardData = null;
let activeCategory = 'All';
let searchQuery = '';
let currentView = 'resources'; // 'resources' or 'dashboard'

// DOM Elements
const resourcesGrid = document.getElementById('resources-grid');
const categoryFilters = document.getElementById('category-filters');
const searchInput = document.getElementById('search-input');
const mobileSearchInput = document.getElementById('mobile-search-input');
const browseView = document.getElementById('browse-view');
const viewerView = document.getElementById('viewer-view');
const dashboardView = document.getElementById('dashboard-view');
const resourceIframe = document.getElementById('resource-iframe');
const resourceTitle = document.getElementById('resource-title');
const playingTitle = document.getElementById('playing-title');
const playingCategory = document.getElementById('playing-category');
const noResults = document.getElementById('no-results');
const backButton = document.getElementById('back-button');
const closeButton = document.getElementById('close-button');
const fullscreenButton = document.getElementById('fullscreen-button');
const logo = document.getElementById('logo');
const yearSpan = document.getElementById('year');

const startScreen = document.getElementById('start-screen');
const startTitle = document.getElementById('start-title');
const startCategory = document.getElementById('start-category');
const startThumbnail = document.getElementById('start-thumbnail');
const startGameBtn = document.getElementById('start-game-btn');
const loadingSpinner = document.getElementById('loading-spinner');

let activeResource = null;

const navResources = document.getElementById('nav-resources');
const navDashboard = document.getElementById('nav-dashboard');

const assignmentsList = document.getElementById('assignments-list');
const announcementsList = document.getElementById('announcements-list');
const gradesList = document.getElementById('grades-list');

// Set current year
yearSpan.textContent = new Date().getFullYear();

// Fetch resources data
async function fetchResources() {
    try {
        const response = await fetch('resources.json');
        resources = await response.json();
        renderCategories();
        renderResources();
    } catch (error) {
        console.error('Error fetching resources:', error);
    }
}

// Fetch dashboard data
async function fetchDashboard() {
    try {
        const response = await fetch('dashboard.json');
        dashboardData = await response.json();
        renderDashboard();
    } catch (error) {
        console.error('Error fetching dashboard:', error);
    }
}

function renderCategories() {
    const categories = ['All', ...new Set(resources.map(r => r.category))];
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
            renderResources();
        };
        categoryFilters.appendChild(btn);
    });
}

function renderResources() {
    const filtered = resources.filter(resource => {
        const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || resource.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    resourcesGrid.innerHTML = '';
    
    if (filtered.length === 0) {
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
        filtered.forEach(resource => {
            const card = document.createElement('div');
            card.className = "resource-card group relative bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-emerald-500/50 transition-all cursor-pointer aspect-[4/3]";
            card.innerHTML = `
                <img
                    src="${resource.thumbnail}"
                    alt="${resource.title}"
                    class="w-full h-full object-cover opacity-60 transition-opacity duration-500"
                    referrerpolicy="no-referrer"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 flex flex-col justify-end">
                    <span class="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-1">
                        ${resource.category}
                    </span>
                    <h3 class="font-bold text-white transition-colors truncate">
                        ${resource.title}
                    </h3>
                </div>
            `;
            card.onclick = () => openResource(resource);
            resourcesGrid.appendChild(card);
        });
    }
}

function renderDashboard() {
    if (!dashboardData) return;

    // Render Assignments
    assignmentsList.innerHTML = dashboardData.assignments.map(a => `
        <div class="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-white/5">
            <div>
                <h3 class="font-bold text-zinc-100">${a.title}</h3>
                <p class="text-xs text-zinc-500">${a.subject} • Due: ${a.dueDate}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                a.status === 'Pending' ? 'bg-amber-500/20 text-amber-500' : 
                a.status === 'In Progress' ? 'bg-blue-500/20 text-blue-500' : 'bg-zinc-500/20 text-zinc-500'
            }">
                ${a.status}
            </span>
        </div>
    `).join('');

    // Render Announcements
    announcementsList.innerHTML = dashboardData.announcements.map(a => `
        <div class="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
            <div class="flex items-center justify-between mb-2">
                <h3 class="font-bold text-zinc-100">${a.title}</h3>
                <span class="text-[10px] text-zinc-500">${a.date}</span>
            </div>
            <p class="text-sm text-zinc-400">${a.content}</p>
        </div>
    `).join('');

    // Render Grades
    gradesList.innerHTML = dashboardData.grades.map(g => `
        <div class="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-white/5">
            <span class="font-medium text-zinc-300">${g.subject}</span>
            <div class="flex items-center gap-3">
                <span class="font-bold text-emerald-500">${g.score}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${
                    g.trend === 'up' ? 'text-emerald-500 rotate-0' : 
                    g.trend === 'down' ? 'text-red-500 rotate-180' : 'text-zinc-500 rotate-90'
                }">
                    <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
            </div>
        </div>
    `).join('');
}

function switchView(view) {
    currentView = view;
    if (view === 'resources') {
        browseView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
        viewerView.classList.add('hidden');
        navResources.className = 'text-emerald-500 font-medium hover:text-emerald-400 transition-colors';
        navDashboard.className = 'text-zinc-400 font-medium hover:text-white transition-colors';
    } else {
        browseView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        viewerView.classList.add('hidden');
        navResources.className = 'text-zinc-400 font-medium hover:text-white transition-colors';
        navDashboard.className = 'text-emerald-500 font-medium hover:text-emerald-400 transition-colors';
        if (!dashboardData) fetchDashboard();
    }
}

function openResource(resource) {
    activeResource = resource;
    browseView.classList.add('hidden');
    dashboardView.classList.add('hidden');
    viewerView.classList.remove('hidden');
    
    // Reset state
    resourceIframe.src = '';
    resourceIframe.classList.add('opacity-0');
    startScreen.classList.remove('hidden');
    startScreen.classList.remove('opacity-0');
    loadingSpinner.classList.add('hidden');

    // Set metadata
    resourceTitle.textContent = resource.title;
    playingTitle.textContent = resource.title;
    playingCategory.textContent = resource.category;
    
    startTitle.textContent = resource.title;
    startCategory.textContent = resource.category;
    startThumbnail.src = resource.thumbnail;

    window.scrollTo(0, 0);
}

startGameBtn.onclick = () => {
    if (!activeResource) return;
    
    startScreen.classList.add('opacity-0');
    setTimeout(() => startScreen.classList.add('hidden'), 500);
    
    loadingSpinner.classList.remove('hidden');
    
    resourceIframe.src = activeResource.iframeUrl;
    resourceIframe.onload = () => {
        loadingSpinner.classList.add('hidden');
        resourceIframe.classList.remove('opacity-0');
    };
};

function closeResource() {
    viewerView.classList.add('hidden');
    activeResource = null;
    if (currentView === 'resources') {
        browseView.classList.remove('hidden');
    } else {
        dashboardView.classList.remove('hidden');
    }
    resourceIframe.src = '';
    resourceIframe.classList.add('opacity-0');
}

// Event Listeners
searchInput.oninput = (e) => {
    searchQuery = e.target.value;
    mobileSearchInput.value = searchQuery;
    renderResources();
};

mobileSearchInput.oninput = (e) => {
    searchQuery = e.target.value;
    searchInput.value = searchQuery;
    renderResources();
};

navResources.onclick = () => switchView('resources');
navDashboard.onclick = () => switchView('dashboard');

backButton.onclick = closeResource;
closeButton.onclick = closeResource;
logo.onclick = () => {
    closeResource();
    switchView('resources');
    activeCategory = 'All';
    searchQuery = '';
    searchInput.value = '';
    mobileSearchInput.value = '';
    renderCategories();
    renderResources();
};

fullscreenButton.onclick = () => {
    if (resourceIframe.requestFullscreen) {
        resourceIframe.requestFullscreen();
    } else if (resourceIframe.webkitRequestFullscreen) { /* Safari */
        resourceIframe.webkitRequestFullscreen();
    } else if (resourceIframe.msRequestFullscreen) { /* IE11 */
        resourceIframe.msRequestFullscreen();
    }
};

// Start
fetchResources();
