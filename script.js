// ===== MAIN SCRIPT FOR INNOVATION EARTH PROJECTS =====
// Fixed version with all syntax errors resolved

// Firebase configuration
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
let db;
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log('✅ Firebase initialized successfully');
    }
} catch (error) {
    console.warn('⚠️ Firebase initialization failed:', error);
}

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Innovation Earth Projects...');
    
    // Initialize all functionality in correct order
    initializeSectionManagement();
    initializeMobileMenu();
    initializeBannerSlider();
    initializeScrollAnimations();
    initializeCategoryTabs();
    initializeCompetitionTabs();
    initializeContactForm();
    initializeSmoothScrolling();
    initializeQuickLinkCards();
    initializeAdminPanel();
    
    // Load projects if on projects section
    if (window.location.hash === '#projects') {
        loadProjects();
    }
    
    console.log('✅ All functionality loaded successfully!');
});

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
        });
    });
    
    // Handle URL hash changes
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash;
        if (hash) {
            showSection(hash);
        }
    });
    
    // Show section based on current URL hash
    if (window.location.hash) {
        showSection(window.location.hash);
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
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Load section-specific content
        if (sectionId === '#projects') {
            loadProjects();
        }
        
        console.log('✅ Section activated:', sectionId);
    } else {
        console.warn('❌ Section not found:', sectionId);
        // Fallback to home
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
    
    // Auto-slide
    setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }, 5000);
}

// ===== SCROLL ANIMATIONS =====
function initializeScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// ===== CATEGORY TABS =====
function initializeCategoryTabs() {
    // Project category tabs
    document.querySelectorAll('.category-tab[data-category]').forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active tab
            this.closest('.category-list').querySelectorAll('.category-tab').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            // Show/hide categories
            const container = this.closest('.container');
            container.querySelectorAll('.project-category, .competition-category, .role-category').forEach(cat => {
                cat.classList.remove('active');
                cat.style.display = 'none';
            });
            
            const targetCategory = document.getElementById(category);
            if (targetCategory) {
                targetCategory.classList.add('active');
                targetCategory.style.display = 'block';
            }
        });
    });
}

// ===== COMPETITION TABS =====
function initializeCompetitionTabs() {
    const competitionTabs = document.querySelectorAll('#competitions .category-tab');
    const competitionCategories = document.querySelectorAll('#competitions .competition-category');
    
    competitionTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update tabs
            competitionTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update categories
            competitionCategories.forEach(cat => {
                cat.classList.remove('active');
                cat.style.display = 'none';
            });
            
            const targetCategory = document.getElementById(category);
            if (targetCategory) {
                targetCategory.classList.add('active');
                targetCategory.style.display = 'block';
            }
        });
    });
}

// ===== SMOOTH SCROLLING =====
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ===== CONTACT FORM =====
function initializeContactForm() {
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            
            // Simulate submission
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                alert(`Thank you, ${name}! Your message has been sent. We'll contact you at ${email}.`);
                contactForm.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
}

// ===== QUICK LINK CARDS =====
function initializeQuickLinkCards() {
    console.log('🔗 Initializing quick link cards...');
    
    // Add click handlers to all quick link cards
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

    // Add specific click handlers for the buttons to prevent event bubbling
    document.querySelectorAll('.quick-link-card .btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent the card click event
            const targetSection = this.getAttribute('href');
            if (targetSection) {
                showSection(targetSection);
            }
        });
    });
}

// ===== ADMIN PANEL =====
function initializeAdminPanel() {
    console.log('🔧 Setting up admin panel...');
    
    // Admin toggle button
    const adminBtn = document.querySelector('.admin-toggle-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', toggleAdminPanel);
    }
    
    // Add card button
    const addCardBtn = document.querySelector('button[onclick="addCard()"]');
    if (addCardBtn) {
        addCardBtn.onclick = addCard;
    }
}

function toggleAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

// Enhanced addCard function with categories
async function addCard() {
    const title = document.getElementById('cardTitle').value;
    const description = document.getElementById('cardDesc').value;
    const status = document.getElementById('cardStatus').value;
    const priority = document.getElementById('cardPriority').value;
    
    if (!title || !description) {
        alert('Please fill in both title and description');
        return;
    }
    
    try {
        const cardData = {
            title: title,
            description: description,
            status: status,
            priority: priority,
            createdAt: new Date(),
            progress: calculateProgress(status)
        };
        
        console.log('💾 Saving project:', cardData);
        
        if (db) {
            await db.collection("projects").add(cardData);
            alert('✅ Project added successfully!');
            
            // Clear form
            document.getElementById('cardTitle').value = '';
            document.getElementById('cardDesc').value = '';
            document.getElementById('cardStatus').value = 'idea';
            document.getElementById('cardPriority').value = 'medium';
            
            // Load projects
            loadProjects();
            
        } else {
            alert('Firebase not available. Using local storage.');
            const projects = JSON.parse(localStorage.getItem('projects') || '[]');
            projects.push(cardData);
            localStorage.setItem('projects', JSON.stringify(projects));
            loadProjects();
        }
    } catch (error) {
        console.error('❌ Error adding project:', error);
        alert('Error adding project: ' + error.message);
    }
}

// Helper function to get category label
function getCategoryLabel(category) {
    const labels = {
        'concepts': 'Project Concepts',
        'planning': 'Planning Stage', 
        'future': 'Future Concepts'
    };
    return labels[category] || 'Projects';
}

// Enhanced loadProjects function with categories
// Debug function to check your data
async function debugProjects() {
    try {
        if (db) {
            const querySnapshot = await db.collection("projects").get();
            console.log('🐛 DEBUG - All projects in database:');
            querySnapshot.forEach((doc) => {
                console.log('📄 Document ID:', doc.id);
                console.log('📊 Data:', doc.data());
                console.log('---');
            });
        } else {
            const projects = JSON.parse(localStorage.getItem('projects') || '[]');
            console.log('🐛 DEBUG - All projects in local storage:');
            projects.forEach((project, index) => {
                console.log(`📄 Project ${index}:`, project);
                console.log('---');
            });
        }
    } catch (error) {
        console.error('❌ Debug error:', error);
    }
}
   
async function loadProjects() {
    let projects = [];

    try {
        if (db) {
            const querySnapshot = await db.collection("projects").get();
            querySnapshot.forEach((doc) => {
                projects.push(Object.assign({ id: doc.id }, doc.data()));
            });
        } else {
            projects = JSON.parse(localStorage.getItem('projects') || '[]');
        }

        console.log('📂 All projects loaded:', projects);
        
        // Get the single projects container
        const projectsContainer = document.getElementById('projects-container');
        if (!projectsContainer) {
            console.error('❌ Projects container not found');
            return;
        }
        
        // Clear container
        projectsContainer.innerHTML = '';
        
        if (projects.length === 0) {
            projectsContainer.innerHTML = getEmptyState();
            return;
        }
        
        // Sort by creation date (newest first)
        projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Render all projects in one container
        projects.forEach((project, index) => {
            const card = createProjectCard(project, index);
            projectsContainer.appendChild(card);
        });
        
        console.log(`✅ Loaded ${projects.length} projects`);
    } catch (error) {
        console.error('❌ Error loading projects:', error);
        const projectsContainer = document.getElementById('projects-container');
        if (projectsContainer) {
            projectsContainer.innerHTML = getErrorState();
        }
    }
}

// Helper function to create project cards
function createProjectCard(project, index) {
    const card = document.createElement('div');
    card.className = 'dynamic-project-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    // FIX: Use status and priority only (no category)
    const statusConfig = getStatusConfig(project.status);
    const priorityConfig = getPriorityConfig(project.priority);
    
    card.innerHTML = `
        <div class="card-image" style="background: linear-gradient(135deg, #3498db, #2980b9)">
            <i class="fas fa-project-diagram"></i>
        </div>
        
        <span class="card-status ${statusConfig.class}">${statusConfig.label}</span>
        <span class="card-priority ${priorityConfig.class}">${priorityConfig.label}</span>
        
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        
        <div class="card-tags">
            <span class="card-tag">${statusConfig.label}</span>
            <span class="card-tag">${priorityConfig.label}</span>
        </div>
        
        <div class="card-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${project.progress || 0}%"></div>
            </div>
            <div class="progress-text">${project.progress || 0}% Complete</div>
        </div>
        
        <div class="project-meta">
            <span class="project-date">
                <i class="fas fa-calendar-plus"></i>
                Added: ${new Date(project.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                })}
            </span>
            <div class="project-actions">
                <button class="btn-small btn-edit" onclick="editProject('${project.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-small btn-delete" onclick="deleteProject('${project.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Add this function if it's missing
function calculateProgress(status) {
    const progressMap = {
        'idea': 10,
        'planning': 30,
        'development': 60,
        'testing': 80,
        'completed': 100
    };
    return progressMap[status] || 0;
}

// Helper functions for category configurations
function getCategoryConfig(category) {
    const configs = {
        concepts: { label: 'Concept', icon: 'fas fa-lightbulb', color1: '#FFD700', color2: '#FFA500' },
        planning: { label: 'Planning', icon: 'fas fa-tasks', color1: '#3498db', color2: '#2980b9' },
        future: { label: 'Future', icon: 'fas fa-rocket', color1: '#9b59b6', color2: '#8e44ad' }
    };
    return configs[category] || configs.concepts;
}

function getPriorityConfig(priority) {
    const configs = {
        low: { label: 'Low Priority', class: 'priority-low' },
        medium: { label: 'Medium Priority', class: 'priority-medium' },
        high: { label: 'High Priority', class: 'priority-high' },
        critical: { label: 'Critical', class: 'priority-critical' }
    };
    return configs[priority] || configs.medium;
}

function getEmptyState() {
    return `
        <div class="empty-state">
            <i class="fas fa-lightbulb"></i>
            <h3>No Projects Yet</h3>
            <p>Start by adding your first project using the admin panel!</p>
            <button class="btn btn-primary" onclick="toggleAdminPanel()">
                <i class="fas fa-plus"></i> Add Your First Project
            </button>
        </div>
    `;
}

function getErrorState() {
    return `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error Loading Projects</h3>
            <p>Please check your connection and try again.</p>
        </div>
    `;
}

// Category tab functionality
function initializeCategoryTabs() {
    document.querySelectorAll('.category-tab[data-category]').forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            switchCategory(category);
        });
    });
}

function switchCategory(category) {
    // Update active tab
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });
    
    const activeTab = document.querySelector(`.category-tab[data-category="${category}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
    }
    
    // Update active content
    document.querySelectorAll('.project-category').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    const activeContent = document.getElementById(category);
    if (activeContent) {
        activeContent.classList.add('active');
        activeContent.style.display = 'block';
    }
}
// ===== DELETE PROJECT =====
async function deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project?')) {
        try {
            if (db) {
                await db.collection("projects").doc(projectId).delete();
            } else {
                let projects = JSON.parse(localStorage.getItem('projects') || '[]');
                projects = projects.filter(p => p.id !== projectId);
                localStorage.setItem('projects', JSON.stringify(projects));
            }
            alert('✅ Project deleted successfully!');
            loadProjects();
        } catch (error) {
            console.error('❌ Error deleting project:', error);
            alert('Error deleting project');
        }
    }
}

// ===== AUTO-LOAD PROJECTS WHEN PROJECTS SECTION IS VIEWED =====
document.addEventListener('DOMContentLoaded', function() {
    const projectsSection = document.getElementById('projects');
    if (projectsSection) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (projectsSection.style.display !== 'none') {
                        loadProjects();
                    }
                }
            });
        });
        
        observer.observe(projectsSection, { attributes: true });
    }
});

console.log("✅ Innovation Earth Projects script loaded successfully!");
