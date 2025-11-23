// ===== MAIN SCRIPT FOR INNOVATION EARTH PROJECTS =====
// Fixed version with all issues resolved

// Firebase configuration
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
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

// Main initialization when DOM is ready
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
        
        console.log('✅ Section activated:', sectionId);
    } else {
        console.warn('❌ Section not found:', sectionId);
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
            });
            
            const targetCategory = document.getElementById(category);
            if (targetCategory) {
                targetCategory.classList.add('active');
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

// ===== ADMIN PANEL =====
function toggleAdmin() {
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

async function addCard() {
    const title = document.getElementById('cardTitle').value;
    const description = document.getElementById('cardDesc').value;
    
    if (!title || !description) {
        alert('Please fill in both fields');
        return;
    }
    
    try {
        if (db) {
            await db.collection("projects").add({
                title: title,
                description: description,
                createdAt: new Date()
            });
            alert('Project added successfully!');
            document.getElementById('cardTitle').value = '';
            document.getElementById('cardDesc').value = '';
        } else {
            alert('Firebase not available. Using local storage.');
            // Fallback to local storage
            const projects = JSON.parse(localStorage.getItem('projects') || '[]');
            projects.push({ title, description, createdAt: new Date() });
            localStorage.setItem('projects', JSON.stringify(projects));
        }
    } catch (error) {
        console.error('Error adding card:', error);
        alert('Error adding project: ' + error.message);
    }
}

// ===== LOAD PROJECTS =====
async function loadProjects() {
    try {
        let projects = [];
        
        if (db) {
            // Load from Firebase
            const querySnapshot = await db.collection("projects").get();
            projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
            // Load from local storage
            projects = JSON.parse(localStorage.getItem('projects') || '[]');
        }
        
        const container = document.getElementById('projects-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (projects.length === 0) {
            container.innerHTML = '<p>No projects yet. Add some through the admin panel!</p>';
            return;
        }
        
        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <small>Added: ${new Date(project.createdAt).toLocaleDateString()}</small>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Auto-load projects when projects section is shown
document.addEventListener('DOMContentLoaded', function() {
    // Observe section changes to load projects when needed
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                if (target.id === 'projects' && target.style.display !== 'none') {
                    loadProjects();
                }
            }
        });
    });
    
    observer.observe(document.getElementById('projects'), { attributes: true });
});