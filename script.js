let dictionaryData = [];
let filteredWords = [];
let isLoading = true;
let currentWordData = null;

// DOM Elements
const homepage = document.getElementById('homepage');
const wordPage = document.getElementById('wordPage');
const searchInput = document.getElementById('searchInput');
const wordList = document.getElementById('wordList');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const searchInfo = document.getElementById('searchInfo');
const wordTitle = document.getElementById('wordTitle');
const partOfSpeech = document.getElementById('partOfSpeech');
const wordDefinition = document.getElementById('wordDefinition');
const variantsSection = document.getElementById('variantsSection');
const variantsList = document.getElementById('variantsList');
const pronunciationSection = document.getElementById('pronunciationSection');
const wordPronunciation = document.getElementById('wordPronunciation');
const verbFormsSection = document.getElementById('verbFormsSection');
const verbFormsList = document.getElementById('verbFormsList');
const exampleSection = document.getElementById('exampleSection');
const wordExample = document.getElementById('wordExample');
const aiExampleSection = document.getElementById('aiExampleSection');
const aiExampleText = document.getElementById('aiExampleText');
const aiExampleLoading = document.getElementById('aiExampleLoading');
const regenerateBtn = document.getElementById('regenerateBtn');
const themeToggle = document.getElementById('themeToggle');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    initTheme();
    setupEventListeners();
    
    try {
        const response = await fetch('dictionary.json');
        if (!response.ok) throw new Error('Failed to load dictionary');
        const data = await response.json();
        dictionaryData = data.words;
        filteredWords = [...dictionaryData];
        
        loading.style.display = 'none';
        isLoading = false;
        
        renderWordList(filteredWords);
        updateSearchInfo();
    } catch (error) {
        console.error('Error loading dictionary:', error);
        loading.innerHTML = '<p style="color: #e74c3c;">Error loading dictionary. Please refresh the page.</p>';
    }
}

function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);
    regenerateBtn.addEventListener('click', generateAIExample);
    
    searchInput.addEventListener('input', handleSearch);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && wordPage.classList.contains('active')) {
            showHomepage();
        }
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
    });
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('.theme-icon');
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Render word list
function renderWordList(words) {
    if (words.length === 0) {
        wordList.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    wordList.style.display = 'block';

    const fragment = document.createDocumentFragment();
    
    words.forEach(word => {
        const div = document.createElement('div');
        div.className = 'word-item';
        
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = word.w;
        link.onclick = (e) => showWordPage(e, word);
        
        div.appendChild(link);
        fragment.appendChild(div);
    });

    wordList.innerHTML = '';
    wordList.appendChild(fragment);
}

// Show word page
function showWordPage(event, wordData) {
    if (event) event.preventDefault();
    
    currentWordData = wordData;
    wordTitle.textContent = wordData.w;
    partOfSpeech.textContent = wordData.p;
    wordDefinition.textContent = wordData.d;
    
    // Show pronunciation if it exists
    if (wordData.pron) {
        pronunciationSection.style.display = 'block';
        wordPronunciation.textContent = wordData.pron;
    } else {
        pronunciationSection.style.display = 'none';
    }
    
    // Show verb forms if they exist
    if (wordData.forms && wordData.p === 'verb') {
        verbFormsSection.style.display = 'block';
        verbFormsList.innerHTML = '';
        
        const formLabels = [
            { key: 'past', label: 'Past Simple' },
            { key: 'pp', label: 'Past Participle' },
            { key: 'ger', label: 'Gerund' },
            { key: 'third', label: 'Third Person' }
        ];
        
        formLabels.forEach(({ key, label }) => {
            if (wordData.forms[key]) {
                const formItem = document.createElement('div');
                formItem.className = 'verb-form-item';
                formItem.innerHTML = `
                    <span class="verb-form-label">${label}:</span>
                    <span class="verb-form-value">${wordData.forms[key]}</span>
                `;
                verbFormsList.appendChild(formItem);
            }
        });
    } else {
        verbFormsSection.style.display = 'none';
    }
    
    // Show example if it exists
    if (wordData.example) {
        exampleSection.style.display = 'block';
        wordExample.textContent = wordData.example;
    } else {
        exampleSection.style.display = 'none';
    }
    
    // Show variants if they exist
    if (wordData.v && Object.values(wordData.v).some(v => v)) {
        variantsSection.style.display = 'block';
        variantsList.innerHTML = '';
        
        const variantInfo = [
            { key: 'us', label: 'American English', flag: '🇺🇸' },
            { key: 'uk', label: 'British English', flag: '🇬🇧' },
            { key: 'au', label: 'Australian English', flag: '🇦🇺' }
        ];
        
        variantInfo.forEach(({ key, label, flag }) => {
            if (wordData.v[key]) {
                const badge = document.createElement('div');
                badge.className = 'variant-badge';
                badge.innerHTML = `
                    <span class="flag">${flag}</span>
                    <span class="region">${label}:</span>
                    <span class="word">${wordData.v[key]}</span>
                `;
                variantsList.appendChild(badge);
            }
        });
    } else {
        variantsSection.style.display = 'none';
    }
    
    // Generate AI example
    generateAIExample();
    
    homepage.classList.remove('active');
    wordPage.classList.add('active');
    window.scrollTo(0, 0);
}

// AI Example Generation
async function generateAIExample() {
    if (!currentWordData) return;
    
    aiExampleSection.style.display = 'block';
    aiExampleText.textContent = '';
    aiExampleLoading.style.display = 'flex';
    regenerateBtn.style.display = 'none';
    
    try {
        const response = await fetch('/.netlify/functions/generate-example', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                word: currentWordData.w,
                partOfSpeech: currentWordData.p,
                definition: currentWordData.d
            })
        });
        
        const data = await response.json();
        console.log('AI Response status:', response.status);
        console.log('AI Response data:', data);
        
        if (response.ok && data.example) {
            aiExampleText.textContent = data.example;
        } else {
            console.warn('AI failed, using dictionary fallback. Error:', data.error);
            aiExampleText.textContent = currentWordData.example || 'Example not available for this word.';
        }
    } catch (error) {
        console.error('Error generating AI example:', error);
        aiExampleText.textContent = currentWordData.example || 'Unable to generate example.';
    }
    
    aiExampleLoading.style.display = 'none';
    regenerateBtn.style.display = 'inline-block';
}

// Show homepage
function showHomepage(event) {
    if (event) event.preventDefault();
    
    wordPage.classList.remove('active');
    homepage.classList.add('active');
    searchInput.focus();
}

// Search functionality
let searchTimeout;
function handleSearch(e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = e.target.value.trim().toLowerCase();
        
        if (query === '') {
            filteredWords = [...dictionaryData];
        } else {
            filteredWords = dictionaryData.filter(word => {
                const wordLower = word.w.toLowerCase();
                const defLower = word.d.toLowerCase();
                
                // Search in word and definition
                if (wordLower.includes(query) || defLower.includes(query)) {
                    return true;
                }
                
                // Search in variants
                if (word.v) {
                    return Object.values(word.v).some(v => 
                        v && v.toLowerCase().includes(query)
                    );
                }
                
                return false;
            });
            
            // Sort: exact matches first, then prefix matches, then contains
            filteredWords.sort((a, b) => {
                const aLower = a.w.toLowerCase();
                const bLower = b.w.toLowerCase();
                
                if (aLower === query && bLower !== query) return -1;
                if (bLower === query && aLower !== query) return 1;
                if (aLower.startsWith(query) && !bLower.startsWith(query)) return -1;
                if (bLower.startsWith(query) && !aLower.startsWith(query)) return 1;
                return aLower.localeCompare(bLower);
            });
        }
        
        renderWordList(filteredWords);
        updateSearchInfo();
    }, 150);
}

// Update search info
function updateSearchInfo() {
    const total = dictionaryData.length;
    const shown = filteredWords.length;
    
    if (searchInput.value.trim()) {
        searchInfo.textContent = `Showing ${shown} of ${total} words`;
    } else {
        searchInfo.textContent = `${total} words in dictionary`;
    }
}

// Expose showHomepage to window for onclick handlers
window.showHomepage = showHomepage;