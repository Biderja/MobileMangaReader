js
// Manga Reader App - Main JavaScript (Updated with Supabase Integration)
class MangaReader {
    constructor() {
        this.currentPage = 0;
        this.totalPages = 0;
        this.currentChapter = 1;
        this.currentMangaId = 'jujutsu-kaisen';
        this.readingDirection = 'rtl';
        this.isAnimating = false;
        this.mangaAPI = new MangaAPI();
        this.mangaData = null;
        this.chapterData = null;
        this.init();
    }

    async init() {
        await this.loadMangaData();
        this.setupEventListeners();
        this.initializeAnimations();
        this.setupTouchGestures();
    }

    async loadMangaData() {
        try {
            const mangaDetails = await this.mangaAPI.fetchMangaDetails(this.currentMangaId);
            const chapterData = await this.mangaAPI.fetchChapterPages(this.currentMangaId, this.currentChapter);
            
            this.mangaData = {
                title: mangaDetails.arabicTitle,
                englishTitle: mangaDetails.title,
                chapter: `الفصل ${this.currentChapter}`,
                pages: chapterData.pages.map(page => ({
                    id: page.id,
                    image: page.imageUrl
                    // translation property removed
                }))
            };
            
            this.totalPages = this.mangaData.pages.length;
            this.updatePageDisplay();
            
        } catch (error) {
            console.error('Error loading manga data:', error);
            this.loadFallbackData();
        }
    }

    loadFallbackData() {
        this.mangaData = this.initializeMangaData();
        this.totalPages = this.mangaData.pages.length;
        this.updatePageDisplay();
    }

    setupEventListeners() {
        document.getElementById('prevPage')?.addEventListener('click', () => this.previousPage());
        document.getElementById('nextPage')?.addEventListener('click', () => this.nextPage());
        document.getElementById('chapterSelect')?.addEventListener('change', (e) => {
            this.loadChapter(parseInt(e.target.value));
        });
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            window.location.href = 'settings.html';
        });
        document.getElementById('libraryBtn')?.addEventListener('click', () => {
            window.location.href = 'library.html';
        });
        document.getElementById('directionToggle')?.addEventListener('click', () => {
            this.toggleReadingDirection();
        });
    }

    setupTouchGestures() {
        let startX = 0;
        let startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    this.nextPage();
                } else {
                    this.previousPage();
                }
            }
            
            startX = 0;
            startY = 0;
        });
    }

    initializeAnimations() {
        if (typeof Splitting !== 'undefined') {
            Splitting();
        }

        if (typeof Typed !== 'undefined') {
            new Typed('#welcomeText', {
                strings: ['أهلاً بك في قارئ المانغا المتقدم', 'Welcome to Advanced Manga Reader'],
                typeSpeed: 50,
                backSpeed: 30,
                loop: true,
                showCursor: false
            });
        }
    }

    async nextPage() {
        if (this.isAnimating || this.currentPage >= this.totalPages - 1) return;
        
        this.isAnimating = true;
        await this.animatePageFlip('next');
        this.currentPage++;
        this.updatePageDisplay();
        this.isAnimating = false;
    }

    async previousPage() {
        if (this.isAnimating || this.currentPage <= 0) return;
        
        this.isAnimating = true;
        await this.animatePageFlip('prev');
        this.currentPage--;
        this.updatePageDisplay();
        this.isAnimating = false;
    }

    animatePageFlip(direction) {
        return new Promise((resolve) => {
            const currentPageEl = document.getElementById('currentPage');
            const nextPageEl = document.getElementById('nextPage');
            
            if (!currentPageEl || !nextPageEl) {
                resolve();
                return;
            }

            const nextPageIndex = direction === 'next' ? this.currentPage + 1 : this.currentPage - 1;
            if (nextPageIndex >= 0 && nextPageIndex < this.totalPages) {
                const pageData = this.mangaData.pages[nextPageIndex];
                // Removed translation overlay div from here
                nextPageEl.innerHTML = `
                    <img src="${pageData.image}" alt="Page ${nextPageIndex + 1}" class="w-full h-full object-contain">
                `;
            }

            if (typeof anime !== 'undefined') {
                anime({
                    targets: currentPageEl,
                    rotateY: direction === 'next' ? -180 : 180,
                    duration: 600,
                    easing: 'easeInOutCubic',
                    complete: () => {
                        currentPageEl.style.transform = 'rotateY(0deg)';
                        resolve();
                    }
                });
            } else {
                currentPageEl.style.transition = 'transform 0.6s ease-in-out';
                currentPageEl.style.transform = `rotateY(${direction === 'next' ? '-180deg' : '180deg'})`;
                setTimeout(() => {
                    currentPageEl.style.transform = 'rotateY(0deg)';
                    resolve();
                }, 600);
            }
        });
    }

    updatePageDisplay() {
        const currentPageEl = document.getElementById('currentPage');
        const pageInfoEl = document.getElementById('pageInfo');
        // Removed translationEl because no translation display
        
        if (currentPageEl && this.mangaData.pages[this.currentPage]) {
            const pageData = this.mangaData.pages[this.currentPage];
            currentPageEl.innerHTML = `
                <img src="${pageData.image}" alt="Page ${this.currentPage + 1}" class="w-full h-full object-contain">
            `;
            
            if (pageInfoEl) {
                pageInfoEl.textContent = `${this.currentPage + 1} / ${this.totalPages}`;
            }
        }
        
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) prevBtn.disabled = this.currentPage === 0;
        if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages - 1;
    }

    loadChapter(chapterNum) {
        this.currentChapter = chapterNum;
        this.currentPage = 0;
        this.updatePageDisplay();
        this.showLoadingAnimation();
    }

    toggleReadingDirection() {
        this.readingDirection = this.readingDirection === 'rtl' ? 'ltr' : 'rtl';
        document.body.style.direction = this.readingDirection;
        
        const btn = document.getElementById('directionToggle');
        if (btn) {
            btn.textContent = this.readingDirection === 'rtl' ? 'RTL' : 'LTR';
        }
    }

    showLoadingAnimation() {
        const loader = document.getElementById('loadingOverlay');
        if (loader) {
            loader.classList.remove('hidden');
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 1500);
        }
    }

    async initializeLibrary() {
        const mangaGrid = document.getElementById('mangaGrid');
        if (!mangaGrid) return;

        try {
            const mangaList = await this.mangaAPI.fetchMangaList();
            
            mangaGrid.innerHTML = mangaList.map(manga => `
                <div class="manga-card bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform duration-300 hover:scale-105" onclick="selectManga('${manga.id}')">
                    <img src="${manga.coverImage}" alt="${manga.arabicTitle}" class="w-full h-48 object-cover">
                    <div class="p-4">
                        <h3 class="font-bold text-lg mb-1 font-arabic">${manga.arabicTitle}</h3>
                        <p class="text-gray-600 text-sm mb-2">${manga.title}</p>
                        <div class="flex items-center justify-between">
                            <span class="inline-block bg-coral text-white text-xs px-2 py-1 rounded-full">${manga.genre}</span>
                            <span class="text-xs text-gray-500">${manga.chapters?.length || 0} فصول</span>
                        </div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading library:', error);
            this.initializeFallbackLibrary();
        }
    }

    initializeFallbackLibrary() {
        const mangaGrid = document.getElementById('mangaGrid');
        if (!mangaGrid) return;

        const mangaList = this.mangaAPI.getFallbackMangaList();
        
        mangaGrid.innerHTML = mangaList.map(manga => `
            <div class="manga-card bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform duration-300 hover:scale-105" onclick="selectManga('${manga.id}')">
                <img src="${manga.coverImage}" alt="${manga.arabicTitle}" class="w-full h-48 object-cover">
                <div class="p-4">
                    <h3 class="font-bold text-lg mb-1 font-arabic">${manga.arabicTitle}</h3>
                    <p class="text-gray-600 text-sm mb-2">${manga.title}</p>
                    <div class="flex items-center justify-between">
                        <span class="inline-block bg-coral text-white text-xs px-2 py-1 rounded-full">${manga.genre}</span>
                        <span class="text-xs text-gray-500">${manga.chapters?.length || 0} فصول</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    initializeSettings() {
        const themeToggle = document.getElementById('themeToggle');
        const fontSizeSlider = document.getElementById('fontSize');
        const brightnessSlider = document.getElementById('brightness');
        
        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                document.body.classList.toggle('dark-theme', e.target.checked);
            });
        }
        
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                document.documentElement.style.setProperty('--font-size', e.target.value + 'px');
            });
        }
        
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', (e) => {
                document.body.style.filter = `brightness(${e.target.value}%)`;
            });
        }
    }
}

// Global functions
function selectManga(mangaTitle) {
    localStorage.setItem('selectedManga', mangaTitle);
    window.location.href = 'index.html';
}

function showComingSoon() {
    alert('[translate:قريباً! هذه الميزة قيد التطوير.]');
}

document.addEventListener('DOMContentLoaded', () => {
    const mangaReader = new MangaReader();
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    switch (currentPage) {
        case 'library.html':
            mangaReader.initializeLibrary();
            break;
        case 'settings.html':
            mangaReader.initializeSettings();
            break;
        default:
            mangaReader.updatePageDisplay();
            break;
    }
});