// Supabase Integration for Manga Reader App
// This module handles all interactions with your existing Supabase backend

class MangaAPI {
    constructor() {
        this.baseURL = 'https://rosybrown-mouse-406916.hostingersite.com/api';
        this.mangaData = new Map();
        this.currentManga = null;
        this.currentChapter = null;
        this.init();
    }

    init() {
        this.setupAPIEndpoints();
        this.loadMangaList();
    }

    setupAPIEndpoints() {
        // API endpoints for your existing website
        this.endpoints = {
            mangaList: `${this.baseURL}/manga`,
            mangaDetails: `${this.baseURL}/manga/`,
            chapterPages: `${this.baseURL}/chapter/`,
            translations: `${this.baseURL}/translation/`,
            search: `${this.baseURL}/search`
        };
    }

    async fetchMangaList() {
        try {
            const response = await fetch(this.endpoints.mangaList);
            const data = await response.json();
            
            // Store manga data
            data.forEach(manga => {
                this.mangaData.set(manga.id, {
                    id: manga.id,
                    title: manga.title,
                    arabicTitle: manga.arabic_title || manga.title,
                    author: manga.author,
                    coverImage: manga.cover_image,
                    genre: manga.genre,
                    status: manga.status,
                    chapters: manga.chapters || [],
                    description: manga.description,
                    arabicDescription: manga.arabic_description || manga.description
                });
            });
            
            return Array.from(this.mangaData.values());
        } catch (error) {
            console.error('Error fetching manga list:', error);
            // Fallback to local data
            return this.getFallbackMangaList();
        }
    }

    async fetchMangaDetails(mangaId) {
        try {
            const response = await fetch(`${this.endpoints.mangaDetails}${mangaId}`);
            const data = await response.json();
            
            this.currentManga = {
                id: data.id,
                title: data.title,
                arabicTitle: data.arabic_title || data.title,
                author: data.author,
                coverImage: data.cover_image,
                genre: data.genre,
                status: data.status,
                chapters: data.chapters || [],
                description: data.description,
                arabicDescription: data.arabic_description || data.description
            };
            
            return this.currentManga;
        } catch (error) {
            console.error('Error fetching manga details:', error);
            return this.getFallbackMangaData(mangaId);
        }
    }

    async fetchChapterPages(mangaId, chapterNumber) {
        try {
            const response = await fetch(`${this.endpoints.chapterPages}${mangaId}/${chapterNumber}`);
            const data = await response.json();
            
            this.currentChapter = {
                mangaId: mangaId,
                chapterNumber: chapterNumber,
                pages: data.pages.map(page => ({
                    id: page.id,
                    pageNumber: page.page_number,
                    imageUrl: page.image_url,
                    arabicTranslation: page.arabic_translation || '',
                    derjaTranslation: page.derja_translation || page.arabic_translation || '',
                    position: page.position || 'bottom'
                }))
            };
            
            return this.currentChapter;
        } catch (error) {
            console.error('Error fetching chapter pages:', error);
            return this.getFallbackChapterData(mangaId, chapterNumber);
        }
    }

    async searchManga(query) {
        try {
            const response = await fetch(`${this.endpoints.search}?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error('Error searching manga:', error);
            return this.searchFallbackManga(query);
        }
    }

    // Fallback data for when API is not available
    getFallbackMangaList() {
        return [
            {
                id: 'jujutsu-kaisen',
                title: 'Jujutsu Kaisen',
                arabicTitle: 'جوجوتسو كايسن',
                author: 'Gege Akutami',
                coverImage: 'https://kimi-web-img.moonshot.cn/img/down-ph.img.susercontent.com/ddbce8f52a9e559ccaf69ee8f625ecf26f5e6ae5',
                genre: 'أكشن',
                status: 'ongoing',
                chapters: [
                    { number: 1, title: 'ريوومين واثنان من السكين', arabicTitle: 'ريوومين واثنان من السكين' },
                    { number: 2, title: 'لعنة واندر', arabicTitle: 'لعنة واندر' },
                    { number: 3, title: 'فتح العين', arabicTitle: 'فتح العين' }
                ],
                description: 'A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself.',
                arabicDescription: 'صبي يبتلاع تميمة ملعونة - إصبع شيطان - ويصبح ملعوناً بنفسه.'
            },
            {
                id: 'one-piece',
                title: 'One Piece',
                arabicTitle: 'ون بيس',
                author: 'Eiichiro Oda',
                coverImage: 'https://kimi-web-img.moonshot.cn/img/m.media-amazon.com/20e1f9b95e97fe0d118dac29bd3b22806c014da1.jpg',
                genre: 'مغامرة',
                status: 'ongoing',
                chapters: [
                    { number: 1, title: 'Romance Dawn', arabicTitle: 'فجر الرومانسية' },
                    { number: 2, title: 'They Call Him Straw Hat Luffy', arabicTitle: 'يُطلقون عليه لوفي قبعة القش' }
                ],
                description: 'Follows the adventures of Monkey D. Luffy and his pirate crew in order to find the greatest treasure ever.',
                arabicDescription: 'يتبع مغامرات مونكي دي لوفي وطاقمه القراصنة للعثور على أعظم كنز على الإطلاق.'
            }
        ];
    }

    getFallbackMangaData(mangaId) {
        const mangaList = this.getFallbackMangaList();
        return mangaList.find(manga => manga.id === mangaId) || mangaList[0];
    }

    getFallbackChapterData(mangaId, chapterNumber) {
        const samplePages = [
            {
                id: 1,
                pageNumber: 1,
                imageUrl: 'https://kimi-web-img.moonshot.cn/img/down-ph.img.susercontent.com/ddbce8f52a9e559ccaf69ee8f625ecf26f5e6ae5',
                arabicTranslation: 'كان يامادا في الثانية من المدرسة الإعدادية...',
                derjaTranslation: 'كان يامادا في الثانية من المدرسة الإعدادية...',
                position: 'bottom'
            },
            {
                id: 2,
                pageNumber: 2,
                imageUrl: 'https://kimi-web-img.moonshot.cn/img/static1.srcdn.com/8560a7e49ba63806990c4791b4309ea3d57668d3.jpg',
                arabicTranslation: 'العالم مليء بالكائنات الخارقة...',
                derjaTranslation: 'العالم مليان كائنات خارقة...',
                position: 'bottom'
            },
            {
                id: 3,
                pageNumber: 3,
                imageUrl: 'https://kimi-web-img.moonshot.cn/img/comicvine.gamespot.com/b27bf795abd45478996051000627be8d238c4e0a.jpg',
                arabicTranslation: 'إيتادوري يوجي... أنت الآن ملزم بعقد مع ساكونا!',
                derjaTranslation: 'إيتادوري يوجي... دلوقتي أنت ملزم بعقد مع ساكونا!',
                position: 'bottom'
            }
        ];

        return {
            mangaId: mangaId,
            chapterNumber: chapterNumber,
            pages: samplePages
        };
    }

    searchFallbackManga(query) {
        const mangaList = this.getFallbackMangaList();
        const lowercaseQuery = query.toLowerCase();
        
        return mangaList.filter(manga => 
            manga.title.toLowerCase().includes(lowercaseQuery) ||
            manga.arabicTitle.toLowerCase().includes(lowercaseQuery) ||
            manga.genre.toLowerCase().includes(lowercaseQuery)
        );
    }

    // Utility methods
    formatMangaTitle(manga) {
        return {
            title: manga.arabicTitle || manga.title,
            englishTitle: manga.title,
            author: manga.author
        };
    }

    getMangaGenres() {
        const mangaList = this.getFallbackMangaList();
        return [...new Set(mangaList.map(manga => manga.genre))];
    }

    getMangaByGenre(genre) {
        const mangaList = this.getFallbackMangaList();
        return mangaList.filter(manga => manga.genre === genre);
    }

    // Reading progress tracking
    saveReadingProgress(mangaId, chapterNumber, pageNumber) {
        const progress = {
            mangaId,
            chapterNumber,
            pageNumber,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(`progress_${mangaId}`, JSON.stringify(progress));
    }

    getReadingProgress(mangaId) {
        const saved = localStorage.getItem(`progress_${mangaId}`);
        return saved ? JSON.parse(saved) : null;
    }

    // Bookmark functionality
    addBookmark(mangaId, chapterNumber, pageNumber) {
        const bookmarks = this.getBookmarks();
        const newBookmark = {
            id: Date.now(),
            mangaId,
            chapterNumber,
            pageNumber,
            timestamp: new Date().toISOString()
        };
        
        bookmarks.push(newBookmark);
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        return newBookmark;
    }

    removeBookmark(bookmarkId) {
        const bookmarks = this.getBookmarks();
        const filteredBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
        localStorage.setItem('bookmarks', JSON.stringify(filteredBookmarks));
    }

    getBookmarks() {
        const saved = localStorage.getItem('bookmarks');
        return saved ? JSON.parse(saved) : [];
    }
}

// Initialize API instance
const mangaAPI = new MangaAPI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MangaAPI;
}