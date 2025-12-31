// ===== FIREBASE CONFIGURATION =====
// Handle 404 redirects
if (window.location.search.includes('redirect=')) {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectPath = urlParams.get('redirect');
    
    if (redirectPath && redirectPath !== '/') {
        // Remove the query parameter
        const cleanUrl = redirectPath;
        window.history.replaceState({}, '', cleanUrl);
        
        // Show the correct section
        const section = redirectPath.substring(1); // Remove leading slash
        setTimeout(() => {
            if (typeof navigateTo === 'function') {
                navigateTo(section);
            }
        }, 100);
    }
}

// ===== HANDLE 404 REDIRECTS (GitHub Pages Fix) =====
(function handle404Redirect() {
    // Only run if we have a 404.html redirect
    if (sessionStorage.redirect) {
        const redirectPath = sessionStorage.redirect;
        delete sessionStorage.redirect;
        
        console.log('🔄 Handling 404 redirect from:', redirectPath);
        
        // Define valid sections
        const validSections = ['home', 'about', 'projects', 'competitions', 'join', 'contact'];
        
        // Extract section from path
        let section = redirectPath === '/' ? 'home' : redirectPath.substring(1);
        
        // Validate section
        if (!validSections.includes(section)) {
            section = 'home';
        }
        
        // Update URL to clean version
        const cleanPath = section === 'home' ? '/' : `/${section}`;
        window.history.replaceState({ section: section }, '', cleanPath);
        
        // Wait for DOM to be ready, then navigate
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => handleRedirectNavigation(section), 100);
            });
        } else {
            setTimeout(() => handleRedirectNavigation(section), 100);
        }
    }
    
    function handleRedirectNavigation(section) {
        console.log('📍 Navigating to section after redirect:', section);
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(sectionEl => {
            sectionEl.classList.remove('active');
            sectionEl.style.display = 'none';
        });
        
        // Show target section
        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            
            // Update navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            const activeLink = document.querySelector(`.nav-link[data-section="${section}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
            
            // Load content if needed
            if (section === 'projects' && typeof loadProjects === 'function') {
                setTimeout(() => loadProjects(), 200);
            }
            
            console.log(`✅ Redirected to: ${section}`);
        }
    }
})();

// Initialize Firebase
let db = null;
let firebaseApp = null;

// ===== GLOBAL VARIABLES =====
let currentTags = [];

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Innovation Earth Projects...');
    
    // Initialize all functionality EXCEPT journey stats
    initializeMobileMenu();
    initializeBannerSlider();
    initializeScrollAnimations();
    initializeCompetitionTabs();
    initializeQuickLinkCards();
    initializeRoleTabs();
    
    // Initialize Firebase FIRST, then initialize other Firebase-dependent features
    initializeFirebase().then(() => {
        // Firebase is now ready, so initialize Firebase-dependent features
        initializeJourneyStats();
        initializeInitiatives(); // Initialize initiatives
    }).catch(error => {
        console.error('❌ Firebase initialization failed:', error);
        // Still try to initialize with fallback
        initializeJourneyStats();
        initializeInitiatives();
    });
    
    // Load projects if on projects section
    if (window.location.hash === '#projects' || document.getElementById('projects').classList.contains('active')) {
        console.log('📁 Loading projects for projects section...');
        setTimeout(() => loadProjects(), 300);
    }
    
    console.log('✅ All functionality loaded successfully!');
});

// ===== FIREBASE INITIALIZATION =====
async function initializeFirebase() {
    console.log('🔥 Initializing Firebase...');
    
    try {
        // Your Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyCgV39r2JAR68jXqt2tSLMoW_2vKtJEFV0",
            authDomain: "innovation-earth-projects.firebaseapp.com",
            projectId: "innovation-earth-projects",
            storageBucket: "innovation-earth-projects.firebasestorage.app",
            messagingSenderId: "1061525102040",
            appId: "1:1061525102040:web:737c648bc2a548e90ce6ad",
            measurementId: "G-GBZCTX7LBL"
        };
        
        // Initialize Firebase
        if (firebase.apps.length === 0) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
        } else {
            firebaseApp = firebase.app();
        }
        
        // Initialize Firestore
        db = firebase.firestore();
        
        console.log('✅ Firebase initialized successfully');
        console.log('📡 Firestore database connected');
        
        // Test connection
        await testFirebaseConnection();
        
        return true;
        
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        console.warn('⚠️ Falling back to local storage mode');
        showNotification('Firebase connection failed. Using local storage.', 'warning');
        throw error;
    }
}

async function testFirebaseConnection() {
    try {
        const testDoc = await db.collection('test').doc('connection').get();
        console.log('✅ Firebase connection test successful');
    } catch (error) {
        console.warn('⚠️ Firebase test failed:', error);
    }
}

// ===== CLEAN URL ROUTING =====
let currentSection = 'home';

function initializeCleanRouting() {
    console.log('🚀 Setting up clean URL routing...');
    
    // Handle navigation clicks
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[data-section], a[href^="/"]');
        if (link && link.getAttribute('href') !== '#') {
            e.preventDefault();
            
            let section = link.getAttribute('data-section');
            
            // If no data-section, extract from href
            if (!section && link.getAttribute('href')) {
                const href = link.getAttribute('href');
                section = href === '/' ? 'home' : href.substring(1);
            }
            
            if (section) {
                navigateTo(section);
            }
        }
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.section) {
            showSection(e.state.section, false);
        } else {
            const path = window.location.pathname;
            const section = path === '/' ? 'home' : path.substring(1);
            showSection(section, false);
        }
    });
    
    // Handle initial load
    handleInitialRoute();
    
    console.log('✅ Clean routing initialized');
}

function handleInitialRoute() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    console.log('📍 Initial route - Path:', path, 'Hash:', hash);
    
    let section = 'home';
    
    if (path && path !== '/') {
        // Clean URL
        section = path.substring(1);
    } else if (hash && hash !== '#') {
        // Hash URL (fallback for old bookmarks)
        section = hash.substring(1);
    }
    
    // Validate section
    const validSections = ['home', 'about', 'projects', 'initiatives', 'competitions', 'join', 'contact'];
    if (!validSections.includes(section)) {
        section = 'home';
    }
    
    // Update URL to clean version
    const cleanPath = section === 'home' ? '/' : `/${section}`;
    window.history.replaceState({ section: section }, '', cleanPath);
    
    // Show the section
    showSection(section, false);
}

function navigateTo(section) {
    console.log(`➡️ Navigating to: ${section}`);
    
    // Update URL
    const path = section === 'home' ? '/' : `/${section}`;
    window.history.pushState({ section: section }, '', path);
    
    // Show section
    showSection(section, false);
    
    // Close mobile menu if open
    closeMobileMenu();
}

function showSection(section, updateHistory = true) {
    console.log(`📂 Showing section: ${section}`);
    
    // Update current section
    currentSection = section;
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(sectionEl => {
        sectionEl.classList.remove('active');
        sectionEl.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(section);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // Update navigation highlight
        updateActiveNav(section);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Load section content
        loadSectionContent(section);
        
        console.log(`✅ Section shown: ${section}`);
    } else {
        console.error(`❌ Section not found: ${section}`);
        // Fallback to home
        if (section !== 'home') {
            navigateTo('home');
        }
    }
}

function updateActiveNav(activeSection) {
    // Remove active from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current nav link
    const currentNavLink = document.querySelector(`.nav-link[data-section="${activeSection}"]`);
    if (currentNavLink) {
        currentNavLink.classList.add('active');
    }
}

function loadSectionContent(section) {
    switch(section) {
        case 'projects':
            console.log('📁 Loading projects...');
            if (typeof loadProjects === 'function') {
                setTimeout(() => loadProjects(), 100);
            }
            break;
            
        case 'initiatives':
            console.log('📚 Loading initiatives...');
            if (typeof loadInitiatives === 'function') {
                setTimeout(() => loadInitiatives(), 100);
            }
            break;
            
        default:
            // No special content to load
            break;
    }
}

function closeMobileMenu() {
    const navList = document.querySelector('.nav-list');
    const mobileToggle = document.getElementById('mobile-menu');
    
    if (navList && navList.classList.contains('show')) {
        navList.classList.remove('show');
        if (mobileToggle) {
            mobileToggle.setAttribute('aria-expanded', 'false');
            mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    }
}

// Make functions available globally
window.navigateTo = navigateTo;

// Update your DOMContentLoaded initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Innovation Earth Projects...');
    
    // Initialize clean routing FIRST
    initializeCleanRouting();
    
    // Initialize other functionality
    initializeMobileMenu();
    initializeBannerSlider();
    initializeScrollAnimations();
    initializeCompetitionTabs();
    initializeQuickLinkCards();
    initializeRoleTabs();
    
    // Initialize Firebase
    initializeFirebase().then(() => {
        // Firebase is now ready
        initializeJourneyStats();
        initializeInitiatives();
    }).catch(error => {
        console.error('❌ Firebase initialization failed:', error);
        // Still try to initialize with fallback
        initializeJourneyStats();
        initializeInitiatives();
    });
    
    console.log('✅ All functionality loaded successfully!');
});

// ===== JOURNEY STATS MANAGEMENT =====
async function loadJourneyStats() {
    try {
        if (!db) {
            console.log('Firebase not available, using default stats');
            return;
        }

        const statsDoc = await db.collection('siteStats').doc('journeyStats').get();
        
        if (statsDoc.exists) {
            const stats = statsDoc.data();
            updateStatsDisplay(stats);
            console.log('✅ Journey stats loaded from Firebase');
        } else {
            await createDefaultStats();
        }
    } catch (error) {
        console.error('❌ Error loading journey stats:', error);
        updateStatsDisplay(getDefaultStats());
    }
}

async function createDefaultStats() {
    const defaultStats = getDefaultStats();
    try {
        await db.collection('siteStats').doc('journeyStats').set(defaultStats);
        updateStatsDisplay(defaultStats);
        console.log('✅ Default journey stats created in Firebase');
    } catch (error) {
        console.error('❌ Error creating default stats:', error);
    }
}

function getDefaultStats() {
    return {
        projectsCompleted: 0,
        activeMembers: 3,
        newOrganization: 1,
        opportunitiesAhead: "∞",
        lastUpdated: new Date().toISOString()
    };
}

function updateStatsDisplay(stats) {
    console.log('📊 updateStatsDisplay called with:', stats);
    
    // Safely convert and validate numbers
    const projects = Number(stats.projectsCompleted) || 0;
    const members = Number(stats.activeMembers) || 0;
    const organization = Number(stats.newOrganization) || 0;
    const opportunities = stats.opportunitiesAhead || "∞";
    
    console.log('✅ Validated stats:', { projects, members, organization, opportunities });
    
    // Set initial values
    setStatValue('stat-projects-completed', projects);
    setStatValue('stat-active-members', members);
    setStatValue('stat-new-organization', organization);
    setStatValue('stat-opportunities-ahead', opportunities);
    
    // Initialize stats animation
    initializeStatsAnimation();
}

function setStatValue(statId, value) {
    const element = document.getElementById(statId);
    if (element) {
        element.textContent = value;
        // Set data-count for animation
        element.setAttribute('data-count', value);
    }
}

function initializeJourneyStats() {
    console.log('📊 Initializing journey stats...');
    
    // Check if Firebase is ready
    if (db) {
        console.log('✅ Firebase is ready, loading stats...');
        loadJourneyStats();
    } else {
        console.log('⏳ Firebase not ready yet, waiting...');
        
        // Try again after a short delay
        setTimeout(() => {
            if (db) {
                console.log('✅ Firebase is now ready, loading stats...');
                loadJourneyStats();
            } else {
                console.log('❌ Firebase still not ready, using defaults');
                updateStatsDisplay(getDefaultStats());
            }
        }, 1000);
    }
}

// ===== INITIATIVES MANAGEMENT =====
async function loadInitiatives() {
    console.log('🚀 Loading initiatives from Firebase...');
    
    const container = document.getElementById('initiatives-container');
    const loadingState = document.getElementById('initiatives-loading');
    const emptyState = document.getElementById('initiatives-empty');
    const errorState = document.getElementById('initiatives-error');
    
    if (!container) {
        console.error('❌ Initiatives container not found');
        return;
    }
    
    // Show loading state
    if (loadingState) loadingState.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
    
    try {
        let initiatives = [];
        
        // Try to load from Firebase first
        if (db) {
            try {
                console.log('📡 Loading from Firebase initiatives collection...');
                const querySnapshot = await db.collection("initiatives").get();
                initiatives = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log(`✅ Loaded ${initiatives.length} initiatives from Firebase`);
            } catch (firebaseError) {
                console.error('❌ Firebase error:', firebaseError);
                throw new Error('Firebase connection failed');
            }
        } else {
            // Fallback to local storage
            console.log('💾 Loading from localStorage...');
            const stored = localStorage.getItem('initiatives');
            initiatives = stored ? JSON.parse(stored) : [];
            console.log(`✅ Loaded ${initiatives.length} initiatives from localStorage`);
        }
        
        // Hide loading state
        if (loadingState) loadingState.style.display = 'none';
        
        // Check if we have initiatives
        if (!initiatives || initiatives.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            container.innerHTML = '';
            container.appendChild(emptyState);
            return;
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Sort initiatives by progress (highest first)
        initiatives.sort((a, b) => (b.progress || 0) - (a.progress || 0));
        
        // Render initiatives
        initiatives.forEach((initiative, index) => {
            const initiativeCard = createInitiativeCard(initiative, index);
            if (initiativeCard) {
                container.appendChild(initiativeCard);
            }
        });
        
        // Initialize scroll animations for new cards
        initializeScrollAnimations();
        
        console.log(`✅ Successfully rendered ${initiatives.length} initiatives`);
        
    } catch (error) {
        console.error('❌ Error loading initiatives:', error);
        
        // Hide loading state
        if (loadingState) loadingState.style.display = 'none';
        
        // Show error state
        if (errorState) {
            errorState.style.display = 'block';
            const errorParagraph = errorState.querySelector('p');
            if (errorParagraph) {
                errorParagraph.textContent = `Error: ${error.message}`;
            }
        }
        
        showNotification('Failed to load initiatives. Please try again.', 'error');
    }
}

function createInitiativeCard(initiative, index) {
    const card = document.createElement('article');
    card.className = 'initiative-card animate-on-scroll';
    card.dataset.id = initiative.id;
    card.dataset.animation = 'fade-up';
    card.dataset.delay = index * 200;
    
    // Get icon class
    const iconClass = getInitiativeIcon(initiative.icon || 'rocket');
    
    // Create progress bar
    const progress = initiative.progress || 0;
    const progressBar = progress > 0 ? `
        <div class="initiative-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <span>${initiative.status || `${progress}% Complete`}</span>
        </div>
    ` : '';
    
    card.innerHTML = `
        <div class="initiative-icon">
            <i class="fas fa-${iconClass}"></i>
        </div>
        <h3>${initiative.title || 'Untitled Initiative'}</h3>
        <p>${initiative.description || 'No description available.'}</p>
        ${progressBar}
        <div class="initiative-meta">
            <span><i class="fas fa-sync-alt"></i> Updated ${formatRelativeTime(initiative.lastUpdated)}</span>
        </div>
    `;
    
    return card;
}

function getInitiativeIcon(iconName) {
    const iconMap = {
        'seedling': 'seedling',
        'robot': 'robot',
        'graduation-cap': 'graduation-cap',
        'rocket': 'rocket',
        'lightbulb': 'lightbulb',
        'users': 'users',
        'code': 'code',
        'flask': 'flask',
        'chart-line': 'chart-line',
        'handshake': 'handshake'
    };
    return iconMap[iconName] || 'rocket';
}

function formatRelativeTime(timestamp) {
    if (!timestamp) return 'recently';
    
    let date;
    try {
        // Handle both Firestore timestamp and ISO string
        if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }
    } catch (error) {
        console.warn('Invalid timestamp:', timestamp);
        return 'recently';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

function initializeInitiatives() {
    console.log('📚 Initializing initiatives...');
    loadInitiatives();
}

// ===== MOBILE MENU =====
function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu');
    const navList = document.querySelector('.nav-list');
    
    if (mobileMenuToggle && navList) {
        mobileMenuToggle.addEventListener('click', function() {
            navList.classList.toggle('show');
            const isExpanded = navList.classList.contains('show');
            this.setAttribute('aria-expanded', isExpanded);
            this.innerHTML = isExpanded ? 
                '<i class="fas fa-times"></i>' : 
                '<i class="fas fa-bars"></i>';
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navList.classList.remove('show');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }
}

// ===== BANNER SLIDER =====
function initializeBannerSlider() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.dot');
    const totalSlides = slides.length;
    
    if (slides.length === 0) return;
    
    function showSlide(index) {
        // Update slides
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
        
        // Update dots
        dots.forEach(dot => dot.classList.remove('active'));
        dots[index].classList.add('active');
        
        currentSlide = index;
    }
    
    // Dot click events
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => showSlide(index));
    });
    
    // Navigation buttons
    const prevBtn = document.querySelector('.banner-prev');
    const nextBtn = document.querySelector('.banner-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            showSlide(currentSlide);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % totalSlides;
            showSlide(currentSlide);
        });
    }
    
    // Auto-slide every 5 seconds
    setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }, 5000);
}

// ===== SCROLL ANIMATIONS =====
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// ===== STATS ANIMATION =====
let statsAnimationTriggered = false; // ADD THIS FLAG

function initializeStatsAnimation() {
    if (statsAnimationTriggered) return; // Don't reinitialize
    
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !statsAnimationTriggered) {
                statsAnimationTriggered = true; // Set flag
                
                // Animate ALL stats at once
                document.querySelectorAll('.stat-number').forEach(statNumber => {
                    const target = statNumber.getAttribute('data-count');
                    
                    // Handle infinity symbol
                    if (target === "∞") {
                        statNumber.textContent = "∞";
                        return;
                    }
                    
                    // Convert to number
                    const targetValue = Number(target);
                    if (!isNaN(targetValue)) {
                        animateCounter(statNumber, targetValue);
                    }
                });
                
                // Stop observing after first trigger
                document.querySelectorAll('.stat-item').forEach(item => {
                    statObserver.unobserve(item);
                });
            }
        });
    }, { threshold: 0.3 }); // Reduced threshold
    
    // Observe all stat items
    document.querySelectorAll('.stat-item').forEach(item => {
        statObserver.observe(item);
    });
}

function resetStatsAnimation() {
    statsAnimationTriggered = false;
    initializeStatsAnimation();
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const duration = 2000;
    const stepTime = duration / 100;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            if (element) {
                element.textContent = target;
            }
            clearInterval(timer);
        } else {
            if (element) {
                element.textContent = Math.floor(current);
            }
        }
    }, stepTime);
}

function createInitiativeCard(initiative, index) {
    const card = document.createElement('article');
    card.className = 'initiative-card animate-on-scroll';
    card.dataset.id = initiative.id;
    card.dataset.animation = 'fade-up';
    card.dataset.delay = index * 200;
    
    // Get icon class
    const iconClass = getInitiativeIcon(initiative.icon || 'rocket');
    
    // Create progress bar
    const progress = initiative.progress || 0;
    const progressBar = progress > 0 ? `
        <div class="initiative-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <span>${initiative.status || `${progress}% Complete`}</span>
        </div>
    ` : '';
    
    // REMOVED: Social share buttons section
    card.innerHTML = `
        <div class="initiative-icon">
            <i class="fas fa-${iconClass}"></i>
        </div>
        <h3>${initiative.title || 'Untitled Initiative'}</h3>
        <p>${initiative.description || 'No description available.'}</p>
        ${progressBar}
        <div class="initiative-meta">
            <span><i class="fas fa-sync-alt"></i> Updated ${formatRelativeTime(initiative.lastUpdated)}</span>
        </div>
    `;
    
    return card;
}

// ===== COMPETITION TABS =====
function initializeCompetitionTabs() {
    const competitionTabs = document.querySelectorAll('#competitions .category-tab');
    
    if (competitionTabs.length > 0) {
        competitionTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                
                // Update active tab
                competitionTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Hide all categories
                const competitionCategories = document.querySelectorAll('#competitions .competition-category');
                competitionCategories.forEach(cat => {
                    cat.classList.remove('active');
                    cat.style.display = 'none';
                });
                
                // Show selected category
                const targetCategory = document.getElementById(category);
                if (targetCategory) {
                    targetCategory.classList.add('active');
                    targetCategory.style.display = 'block';
                }
            });
        });
    }
}

// ===== ROLE TABS (Join Us Section) =====
function initializeRoleTabs() {
    const roleTabs = document.querySelectorAll('#join .category-tab');
    
    if (roleTabs.length > 0) {
        roleTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                
                // Update active tab
                roleTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Hide all role categories
                const roleCategories = document.querySelectorAll('#join .role-category');
                roleCategories.forEach(cat => {
                    cat.classList.remove('active');
                    cat.style.display = 'none';
                });
                
                // Show selected category
                const targetCategory = document.getElementById(category);
                if (targetCategory) {
                    targetCategory.classList.add('active');
                    targetCategory.style.display = 'block';
                }
            });
        });
    }
}

function saveContactSubmission(data) {
    try {
        const submissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
        submissions.push(data);
        localStorage.setItem('contactSubmissions', JSON.stringify(submissions));
        console.log('💾 Contact submission saved:', data);
    } catch (error) {
        console.error('❌ Error saving contact submission:', error);
    }
}

// ===== QUICK LINK CARDS =====
function initializeQuickLinkCards() {
    document.querySelectorAll('.quick-link-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't trigger if user clicked on the button inside
            if (e.target.closest('a') || e.target.closest('button')) {
                return;
            }
            
            // Get the target section from the card's content
            const link = this.querySelector('a[href^="#"]');
            if (link) {
                const targetSection = link.getAttribute('href');
                showSection(targetSection);
            }
        });
    });
}

// ===== PROJECT MANAGEMENT =====
async function loadProjects() {
    console.log('📁 Loading projects...');
    
    const projectsContainer = document.getElementById('projects-container');
    const loadingState = document.getElementById('projects-loading');
    const emptyState = document.getElementById('projects-empty');
    const errorState = document.getElementById('projects-error');
    
    if (!projectsContainer) {
        console.error('❌ Projects container not found');
        return;
    }
    
    // Show loading state
    if (loadingState) loadingState.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
    
    try {
        let projects = [];
        
        // Try to load from Firebase first
        if (db) {
            try {
                console.log('📡 Loading from Firebase...');
                const querySnapshot = await db.collection("projects").get();
                projects = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log(`✅ Loaded ${projects.length} projects from Firebase`);
            } catch (firebaseError) {
                console.error('❌ Firebase error:', firebaseError);
                throw new Error('Firebase connection failed');
            }
        } else {
            // Fallback to local storage
            console.log('💾 Loading from localStorage...');
            const stored = localStorage.getItem('projects');
            projects = stored ? JSON.parse(stored) : [];
            console.log(`✅ Loaded ${projects.length} projects from localStorage`);
        }
        
        // Hide loading state
        if (loadingState) loadingState.style.display = 'none';
        
        // Check if we have projects
        if (!projects || projects.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            projectsContainer.innerHTML = '';
            updateProjectStats(0);
            return;
        }
        
        // Clear container
        projectsContainer.innerHTML = '';
        
        // Sort projects by date (newest first)
        projects.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.id || 0);
            const dateB = new Date(b.createdAt || b.id || 0);
            return dateB - dateA;
        });
        
        // Render projects
        projects.forEach((project, index) => {
            const projectCard = createProjectCard(project, index);
            if (projectCard) {
                projectsContainer.appendChild(projectCard);
            }
        });
        
        // Update stats
        updateProjectStats(projects.length);
        
        // Initialize scroll animations for new cards
        initializeScrollAnimations();
        
        console.log(`✅ Successfully rendered ${projects.length} projects`);
        
    } catch (error) {
        console.error('❌ Error loading projects:', error);
        
        // Hide loading state
        if (loadingState) loadingState.style.display = 'none';
        
        // Show error state
        if (errorState) {
            errorState.style.display = 'block';
            errorState.querySelector('p').textContent = `Error: ${error.message}`;
        }
        
        showNotification('Failed to load projects. Please try again.', 'error');
    }
}

function createProjectCard(project, index) {
    const card = document.createElement('article');
    card.className = 'project-card animate-on-scroll';
    card.dataset.id = project.id;
    
    // Format date
    const date = project.createdAt ? 
        new Date(project.createdAt.seconds * 1000 || project.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : 'Recently added';
    
    // Create status badge
    const statusClass = getStatusClass(project.status || 'idea');
    const statusText = getStatusText(project.status || 'idea');
    
    // Create priority badge
    const priorityClass = getPriorityClass(project.priority || 'medium');
    const priorityText = getPriorityText(project.priority || 'medium');
    
    // Create image HTML
    let imageHtml = '';
    if (project.imageUrl) {
        imageHtml = `
            <div class="project-image">
                <img src="${project.imageUrl}" alt="${project.title}" loading="lazy" 
                     onerror="this.style.display='none'; this.parentNode.innerHTML='<div class=\"project-image-placeholder\"><i class=\"fas fa-project-diagram\"></i></div>';">
            </div>
        `;
    } else {
        imageHtml = `
            <div class="project-image-placeholder">
                <i class="fas fa-project-diagram"></i>
            </div>
        `;
    }
    
    // Create tags HTML
    const tagsHtml = (project.tags || []).map(tag => 
        `<span class="project-tag">${tag}</span>`
    ).join('');
    
    // Progress bar
    const progress = project.progress || 0;
    const progressBar = progress > 0 ? `
        <div class="project-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <span>${progress}% Complete</span>
        </div>
    ` : '';
    
    // Links
    const linksHtml = project.url ? `
        <div class="project-links">
            <a href="${project.url}" target="_blank" class="btn btn-secondary">
                <i class="fas fa-external-link-alt"></i> View Project
            </a>
        </div>
    ` : '';
    
    card.innerHTML = `
        <div class="project-header">
            ${imageHtml}
            <div class="project-badge ${priorityClass}">${priorityText}</div>
            <div class="project-badge ${statusClass}" style="top: 3.5rem;">${statusText}</div>
        </div>
        <div class="project-content">
            <h3>${project.title || 'Untitled Project'}</h3>
            <p>${project.description || 'No description available.'}</p>
            <div class="project-meta">
                <span><i class="fas fa-calendar"></i> ${date}</span>
                <span><i class="fas fa-user"></i> ${project.author || 'Team'}</span>
            </div>
            ${progressBar}
            ${linksHtml}
        </div>
        ${tagsHtml ? `<div class="project-footer">${tagsHtml}</div>` : ''}
    `;
    
    return card;
}

function getStatusClass(status) {
    const statusClasses = {
        'idea': 'status-idea',
        'planning': 'status-planning',
        'development': 'status-development',
        'testing': 'status-testing',
        'completed': 'status-completed'
    };
    return statusClasses[status] || 'status-idea';
}

function getStatusText(status) {
    const statusTexts = {
        'idea': 'Idea Phase',
        'planning': 'Planning',
        'development': 'In Development',
        'testing': 'Testing',
        'completed': 'Completed'
    };
    return statusTexts[status] || 'Idea Phase';
}

function getPriorityClass(priority) {
    const priorityClasses = {
        'low': 'priority-low',
        'medium': 'priority-medium',
        'high': 'priority-high',
        'critical': 'priority-critical'
    };
    return priorityClasses[priority] || 'priority-medium';
}

function getPriorityText(priority) {
    const priorityTexts = {
        'low': 'Low Priority',
        'medium': 'Medium Priority',
        'high': 'High Priority',
        'critical': 'Critical'
    };
    return priorityTexts[priority] || 'Medium Priority';
}

function updateProjectStats(count) {
    // This function is now handled by updateStatsDisplay
    console.log('Projects count updated:', count);
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Set styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    // Set background color based on type
    const colors = {
        'success': '#28a745',
        'error': '#dc3545',
        'warning': '#ffc107',
        'info': '#17a2b8'
    };
    
    notification.style.background = colors[type] || colors.info;
    
    // Add icon
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas fa-${icons[type] || 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Social media analytics and interaction tracking
function setupSocialAnalytics() {
    const socialButtons = document.querySelectorAll('.social-btn');
    
    socialButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const platform = this.classList[1]; // instagram, youtube, tiktok, etc.
            const url = this.href;
            
            console.log(`📱 Social click: ${platform} - ${url}`);
            
            // Track in Firebase if you want
            if (db) {
                db.collection('socialClicks').add({
                    platform: platform,
                    url: url,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent
                });
            }
            
            // Optional: Track with Google Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'social_click', {
                    'event_category': 'Social Media',
                    'event_label': platform,
                    'transport_type': 'beacon'
                });
            }
        });
    });
}

// Add follower count display (if you want to show counts)
async function displayFollowerCounts() {
    // This is a placeholder - you'd need to implement API calls
    // to get actual follower counts from each platform
    
    const followerData = {
        instagram: 0,
        youtube: 0,
        tiktok: 0
    };
    
    // You could:
    // 1. Use platform APIs (requires authentication)
    // 2. Store counts manually in Firebase
    // 3. Skip this feature if it's too complex
    
    // For now, let's just show a simple message
    const followerElement = document.querySelector('.social-followers');
    if (followerElement) {
        followerElement.innerHTML = 'Join our growing community of innovators and changemakers';
    }
}

// ===== DEBUG FUNCTIONS =====
function debugFirebaseConnection() {
    console.log('🔍 Debugging Firebase connection...');
    console.log('Firebase app:', firebaseApp ? '✅ Initialized' : '❌ Not initialized');
    console.log('Firestore database:', db ? '✅ Connected' : '❌ Not connected');
    
    if (db) {
        // Test a simple query
        db.collection('test').limit(1).get()
            .then(() => console.log('✅ Firestore query successful'))
            .catch(error => console.error('❌ Firestore query failed:', error));
    }
}

function debugLocalStorage() {
    console.log('🔍 Debugging localStorage...');
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    console.log(`📁 Projects in localStorage: ${projects.length}`);
    projects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.title} (${project.status})`);
    });
    
    const contacts = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
    console.log(`📧 Contact submissions: ${contacts.length}`);
}

// ===== EXPORT FUNCTIONS =====
window.loadProjects = loadProjects;
window.loadInitiatives = loadInitiatives;
window.debugFirebaseConnection = debugFirebaseConnection;
window.debugLocalStorage = debugLocalStorage;

console.log("🎉 Innovation Earth Projects JavaScript loaded successfully!");
