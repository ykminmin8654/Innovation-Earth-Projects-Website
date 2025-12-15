// ===== FIREBASE CONFIGURATION =====
// Initialize Firebase
let db = null;
let firebaseApp = null;

// ===== GLOBAL VARIABLES =====
let currentTags = [];

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Innovation Earth Projects...');
    
    // Initialize all functionality
    initializeSectionManagement();
    initializeMobileMenu();
    initializeBannerSlider();
    initializeScrollAnimations();
    initializeCompetitionTabs();
    initializeContactForm();
    initializeQuickLinkCards();
    initializeRoleTabs();
    initializeJourneyStats();
    
    // Initialize Firebase
    initializeFirebase();
    
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
        
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        console.warn('⚠️ Falling back to local storage mode');
        showNotification('Firebase connection failed. Using local storage.', 'warning');
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

// ===== STATS ANIMATION =====
function initializeStatsAnimation() {
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target.querySelector('.stat-number');
                if (statNumber) {
                    const target = statNumber.getAttribute('data-count');
                    const statId = statNumber.id;
                    
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
                }
            }
        });
    }, { threshold: 0.5 });
    
    // Observe all stat items
    document.querySelectorAll('.stat-item').forEach(item => {
        statObserver.observe(item);
    });
}

function setStatValue(statId, value) {
    const element = document.getElementById(statId);
    if (element) {
        element.textContent = value;
        // Set data-count for animation
        element.setAttribute('data-count', value);
    }
}

function animateStatCounter(statId, targetValue) {
    const element = document.getElementById(statId);
    if (!element) {
        console.warn(`Element not found: ${statId}`);
        return;
    }
    
    // Convert to number safely
    const targetNumber = Number(targetValue);
    if (isNaN(targetNumber)) {
        console.warn(`Invalid number for ${statId}:`, targetValue);
        element.textContent = targetValue; // Show original value
        return;
    }
    
    const current = parseInt(element.textContent) || 0;
    if (current === targetNumber) return;
    
    animateCounter(element, targetNumber);
}

function initializeJourneyStats() {
    console.log('📊 Initializing journey stats...');
    loadJourneyStats();
}

// ===== SECTION MANAGEMENT =====
function initializeSectionManagement() {
    console.log('🔧 Initializing section management...');
    
    // Hide all sections except home
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show home section by default
    const homeSection = document.getElementById('home');
    if (homeSection) {
        homeSection.style.display = 'block';
        homeSection.classList.add('active');
    }
    
    // Handle navigation clicks
    document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            showSection(targetId);
            
            // Save to localStorage
            localStorage.setItem('lastActiveSection', targetId);
        });
    });
    
    // Handle URL hash changes
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash;
        if (hash) {
            showSection(hash);
            localStorage.setItem('lastActiveSection', hash);
        }
    });
    
    // Check for saved section
    const savedSection = localStorage.getItem('lastActiveSection');
    const urlHash = window.location.hash;
    
    if (urlHash && document.querySelector(urlHash)) {
        showSection(urlHash);
    } else if (savedSection && document.querySelector(savedSection)) {
        showSection(savedSection);
    } else {
        showSection('#home');
    }
}

function showSection(sectionId) {
    console.log('🔄 Showing section:', sectionId);
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.querySelector(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // Update navigation
        updateNavHighlight(sectionId);
        
        // Update URL
        const newUrl = window.location.pathname + sectionId;
        window.history.replaceState(null, null, newUrl);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Load section-specific content
        if (sectionId === '#projects') {
            console.log('📁 Loading projects for section:', sectionId);
            loadProjects();
        }
        
        console.log('✅ Section activated:', sectionId);
    } else {
        console.warn('❌ Section not found:', sectionId);
        showSection('#home');
    }
}

function updateNavHighlight(sectionId) {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current nav link
    const currentNavLink = document.querySelector(`.nav-link[href="${sectionId}"]`);
    if (currentNavLink) {
        currentNavLink.classList.add('active');
    }
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
    
    // IMPORTANT: REMOVE the statObserver from here
    // The stats animation is handled separately in initializeStatsAnimation()
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

// ===== CONTACT FORM =====
function initializeContactForm() {
    const contactForm = document.querySelector('#contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');
            
            // Validate form
            if (!name || !email || !subject || !message) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }
            
            // Simulate submission
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                showNotification(`Thank you, ${name}! Your message has been sent. We'll contact you at ${email}.`, 'success');
                
                // Reset form
                contactForm.reset();
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Save to local storage for demo
                saveContactSubmission({ name, email, subject, message, timestamp: new Date().toISOString() });
                
            }, 2000);
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

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification {
        font-family: var(--font-family);
    }
`;
document.head.appendChild(style);

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
window.showSection = showSection;
window.loadProjects = loadProjects;
window.loadDemoProjects = loadDemoProjects;
window.clearAllProjects = clearAllProjects;
window.debugFirebaseConnection = debugFirebaseConnection;
window.debugLocalStorage = debugLocalStorage;

console.log("🎉 Innovation Earth Projects JavaScript loaded successfully!");
