// ===== COMPLETE JAVASCRIPT FILE FOR INNOVATION EARTH PROJECTS =====
// Fixed version with proper form handling and admin panel functionality

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

// ===== GLOBAL VARIABLES =====
let currentTags = [];
let imageUploader = null;

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Innovation Earth Projects...');
    
    // Initialize all functionality
    initializeSectionManagement();
    initializeMobileMenu();
    initializeBannerSlider();
    initializeScrollAnimations();
    initializeCategoryTabs();
    initializeCompetitionTabs();
    initializeContactForm();
    initializeSmoothScrolling();
    initializeQuickLinkCards();
    
    // Initialize admin panel and form components
    initializeAdminPanel();
    initializeTagSystem();
    initializeProgressBar();
    initializeImageUpload();
    
    // Load projects if on projects section
    if (window.location.hash === '#projects') {
        setTimeout(() => loadProjects(), 100);
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
            
            // Save to localStorage so it persists on refresh
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
    
    // On page load, check what section to show (priority order)
    const savedSection = localStorage.getItem('lastActiveSection');
    const urlHash = window.location.hash;
    
    if (urlHash && document.querySelector(urlHash)) {
        // Priority 1: URL hash
        showSection(urlHash);
        console.log('✅ Showing section from URL hash:', urlHash);
    } else if (savedSection && document.querySelector(savedSection)) {
        // Priority 2: Saved section from localStorage
        showSection(savedSection);
        console.log('✅ Showing saved section:', savedSection);
    } else {
        // Priority 3: Default to home
        showSection('#home');
        console.log('✅ Defaulting to home section');
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
        
        // Update URL hash (without triggering hashchange event)
        const newUrl = window.location.pathname + sectionId;
        window.history.replaceState(null, null, newUrl);
        
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
    const projectTabs = document.querySelectorAll('#projects .category-tab');
    
    if (projectTabs.length > 0) {
        projectTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                
                // Update active tab
                projectTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Show/hide categories
                const projectCategories = document.querySelectorAll('#projects .project-category');
                projectCategories.forEach(cat => {
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
}

// ===== COMPETITION TABS =====
function initializeCompetitionTabs() {
    const competitionTabs = document.querySelectorAll('#competitions .category-tab');
    
    if (competitionTabs.length > 0) {
        competitionTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                
                // Update tabs
                competitionTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Update categories
                const competitionCategories = document.querySelectorAll('#competitions .competition-category');
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
        // Remove any existing event listeners
        const newBtn = adminBtn.cloneNode(true);
        adminBtn.parentNode.replaceChild(newBtn, adminBtn);
        
        // Add click event to the new button
        const fixedAdminBtn = document.querySelector('.admin-toggle-btn');
        fixedAdminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleAdminPanel();
        });
        console.log('✅ Admin toggle button initialized');
    }
    
    // Add card button
    const addCardBtn = document.querySelector('button[onclick="addCard()"]');
    if (addCardBtn) {
        addCardBtn.onclick = addCard;
        console.log('✅ Add card button initialized');
    }
    
    // Add close functionality
    setupAdminPanelClose();
}

function toggleAdminPanel() {
    console.log('🔄 Toggling admin panel...');
    
    const panel = document.getElementById('adminPanel');
    if (!panel) {
        console.error('❌ Admin panel element not found');
        return;
    }
    
    const isVisible = panel.style.display === 'block' || panel.classList.contains('active');
    
    if (!isVisible) {
        // Show panel
        panel.style.display = 'block';
        panel.classList.add('active');
        console.log('✅ Centered popup opened');
        
        // Add event listener to close when clicking outside
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 10);
    } else {
        // Hide panel
        panel.style.display = 'none';
        panel.classList.remove('active');
        console.log('📪 Popup closed');
        
        // Remove event listener
        document.removeEventListener('click', handleClickOutside);
    }
}

function handleClickOutside(event) {
    const panel = document.getElementById('adminPanel');
    const adminBtn = document.querySelector('.admin-toggle-btn');
    
    if (panel && 
        !panel.contains(event.target) && 
        (!adminBtn || !adminBtn.contains(event.target))) {
        panel.style.display = 'none';
        panel.classList.remove('active');
        document.removeEventListener('click', handleClickOutside);
    }
}

function setupAdminPanelClose() {
    // Close with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const panel = document.getElementById('adminPanel');
            if (panel && (panel.style.display === 'block' || panel.classList.contains('active'))) {
                panel.style.display = 'none';
                panel.classList.remove('active');
            }
        }
    });
}

// ===== TAG MANAGEMENT SYSTEM =====
function initializeTagSystem() {
    console.log('🏷️ Initializing tag system...');
    
    const tagInput = document.getElementById('tagInput');
    const addTagBtn = document.getElementById('addTagBtn');
    
    if (tagInput && addTagBtn) {
        console.log('✅ Found tag system elements');
        // Add tag on button click
        addTagBtn.addEventListener('click', addTag);
        
        // Add tag on Enter key
        tagInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
            }
        });
        
        // Quick tag suggestions
        const tagSuggestions = document.querySelectorAll('.tag-suggestion');
        if (tagSuggestions.length > 0) {
            tagSuggestions.forEach(suggestion => {
                suggestion.addEventListener('click', function() {
                    const tag = this.getAttribute('data-tag');
                    if (tag) {
                        tagInput.value = tag;
                        addTag();
                    }
                });
            });
        }
    } else {
        console.warn('⚠️ Tag input elements not found, skipping tag system');
    }
    
    // Clear tags when form is submitted
    clearTags();
}

function addTag() {
    const tagInput = document.getElementById('tagInput');
    if (!tagInput) return;
    
    const tag = tagInput.value.trim().toLowerCase();
    
    if (tag && !currentTags.includes(tag)) {
        currentTags.push(tag);
        renderTags();
        tagInput.value = '';
        tagInput.focus();
    }
}

function removeTag(tagToRemove) {
    currentTags = currentTags.filter(tag => tag !== tagToRemove);
    renderTags();
}

function renderTags() {
    const tagsContainer = document.getElementById('tagsContainer');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    if (currentTags.length === 0) {
        tagsContainer.innerHTML = '<div class="tags-empty">No tags added yet</div>';
        return;
    }
    
    currentTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-item';
        tagElement.innerHTML = tag + 
            '<button type="button" class="tag-remove" onclick="removeTag(\'' + tag + '\')">' +
            '<i class="fas fa-times"></i></button>';
        tagsContainer.appendChild(tagElement);
    });
}

function clearTags() {
    currentTags = [];
    renderTags();
}

function getCurrentTags() {
    return [...currentTags];
}

// ===== PROGRESS BAR MANAGEMENT =====
function initializeProgressBar() {
    console.log('📊 Initializing progress bar...');
    
    const progressSlider = document.getElementById('cardProgress');
    const progressValue = document.getElementById('progressValue');
    
    if (progressSlider && progressValue) {
        progressSlider.addEventListener('input', function() {
            progressValue.textContent = this.value + '%';
        });
        
        // Update progress when status changes
        const statusSelect = document.getElementById('cardStatus');
        if (statusSelect) {
            statusSelect.addEventListener('change', function() {
                const progress = calculateProgress(this.value);
                progressSlider.value = progress;
                progressValue.textContent = progress + '%';
            });
        }
    }
}

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

// ===== IMAGE UPLOAD FUNCTIONALITY =====
function initializeImageUpload() {
    console.log('🖼️ Initializing image upload...');
    
    const imageInput = document.getElementById('cardImage');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImage');
    
    if (!imageInput || !imagePreview) {
        console.warn('⚠️ Image upload elements not found, skipping image upload');
        return;
    }
    
    // Create upload progress element
    const uploadProgress = document.createElement('div');
    uploadProgress.className = 'upload-progress';
    uploadProgress.innerHTML = '<div class="upload-progress-bar"></div>';
    imagePreview.parentNode.insertBefore(uploadProgress, imagePreview.nextSibling);
    
    let currentImageFile = null;
    let currentImageUrl = null;
    
    // Handle file selection
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('❌ Image size must be less than 5MB');
                this.value = '';
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                alert('❌ Please select a valid image file');
                this.value = '';
                return;
            }
            
            currentImageFile = file;
            previewImage(file);
        }
    });
    
    // Handle remove image
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', removeImage);
    }
    
    function previewImage(file) {
        const reader = new FileReader();
        
        // Show upload progress
        uploadProgress.style.display = 'block';
        const progressBar = uploadProgress.querySelector('.upload-progress-bar');
        
        reader.onloadstart = function() {
            progressBar.style.width = '10%';
        };
        
        reader.onprogress = function(e) {
            if (e.lengthComputable) {
                const percentLoaded = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = percentLoaded + '%';
            }
        };
        
        reader.onload = function(e) {
            // Complete progress
            progressBar.style.width = '100%';
            setTimeout(() => {
                uploadProgress.style.display = 'none';
                progressBar.style.width = '0%';
            }, 500);
            
            currentImageUrl = e.target.result;
            
            // Update preview
            imagePreview.classList.add('has-image');
            let img = imagePreview.querySelector('img');
            if (!img) {
                img = document.createElement('img');
                imagePreview.appendChild(img);
            }
            img.src = currentImageUrl;
            img.alt = 'Project preview image';
            
            // Show remove button
            if (removeImageBtn) {
                removeImageBtn.style.display = 'block';
            }
            
            console.log('✅ Image preview loaded successfully');
        };
        
        reader.onerror = function() {
            uploadProgress.style.display = 'none';
            alert('❌ Error loading image. Please try again.');
        };
        
        reader.readAsDataURL(file);
    }
    
    function removeImage() {
        currentImageFile = null;
        currentImageUrl = null;
        if (imageInput) imageInput.value = '';
        imagePreview.classList.remove('has-image');
        if (removeImageBtn) removeImageBtn.style.display = 'none';
        
        // Clear image preview
        const img = imagePreview.querySelector('img');
        if (img) {
            img.remove();
        }
        
        console.log('🗑️ Image removed');
    }
    
    // Return public methods
    imageUploader = {
        getCurrentImage: function() {
            return currentImageUrl;
        },
        getImageFile: function() {
            return currentImageFile;
        },
        removeImage: removeImage,
        hasImage: function() {
            return !!currentImageUrl;
        }
    };
}

// ===== ADD CARD FUNCTION =====
async function addCard() {
    console.log('💾 Starting to add card...');
    
    const title = document.getElementById('cardTitle')?.value || '';
    const description = document.getElementById('cardDesc')?.value || '';
    const url = document.getElementById('cardUrl')?.value || '';
    const status = document.getElementById('cardStatus')?.value || 'idea';
    const priority = document.getElementById('cardPriority')?.value || 'medium';
    const progress = parseInt(document.getElementById('cardProgress')?.value || '0');
    const tags = getCurrentTags();
    const imageUrl = imageUploader ? imageUploader.getCurrentImage() : null;
    
    console.log('📝 Form values:', { title, description, url, status, priority, progress, tags, hasImage: !!imageUrl });
    
    if (!title.trim() || !description.trim()) {
        alert('❌ Please fill in both title and description');
        return;
    }
    
    try {
        const cardData = {
            title: title.trim(),
            description: description.trim(),
            url: url.trim() || '',
            status: status,
            priority: priority,
            progress: progress || 0,
            tags: tags || [],
            imageUrl: imageUrl || '',
            createdAt: new Date().toISOString(),
        };
        
        console.log('💾 Saving project data:', cardData);
        
        // ALWAYS try Firebase first, then fallback to localStorage
        if (db) {
            try {
                const docRef = await db.collection("projects").add(cardData);
                console.log('✅ Project added to Firebase with ID:', docRef.id);
                alert('✅ Project added successfully to Firebase!');
            } catch (firebaseError) {
                console.error('❌ Firebase error:', firebaseError);
                alert('⚠️ Could not connect to Firebase. Saving locally instead.');
                
                // Fallback to localStorage
                cardData.id = 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                const projects = JSON.parse(localStorage.getItem('projects') || '[]');
                projects.push(cardData);
                localStorage.setItem('projects', JSON.stringify(projects));
                console.log('💾 Saved to local storage:', projects.length, 'projects total');
                alert('✅ Project added successfully (local storage)!');
            }
        } else {
            // No Firebase, use localStorage
            cardData.id = 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const projects = JSON.parse(localStorage.getItem('projects') || '[]');
            projects.push(cardData);
            localStorage.setItem('projects', JSON.stringify(projects));
            console.log('💾 Saved to local storage:', projects.length, 'projects total');
            alert('✅ Project added successfully!');
        }
        
        // Clear form
        clearForm();
        
        // Close admin panel
        const panel = document.getElementById('adminPanel');
        if (panel) {
            panel.style.display = 'none';
            panel.classList.remove('active');
        }
        
        // Force reload with delay to ensure data is saved
        setTimeout(() => {
            console.log('🔄 Reloading projects...');
            loadProjects();
            
            // Navigate to projects section
            setTimeout(() => {
                showSection('#projects');
            }, 500);
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error adding project:', error);
        alert('❌ Error adding project: ' + (error.message || 'Unknown error'));
    }
}

function clearForm() {
    const title = document.getElementById('cardTitle');
    const desc = document.getElementById('cardDesc');
    const url = document.getElementById('cardUrl');
    const status = document.getElementById('cardStatus');
    const priority = document.getElementById('cardPriority');
    const progress = document.getElementById('cardProgress');
    const progressValue = document.getElementById('progressValue');
    
    if (title) title.value = '';
    if (desc) desc.value = '';
    if (url) url.value = '';
    if (status) status.value = 'idea';
    if (priority) priority.value = 'medium';
    if (progress) progress.value = '0';
    if (progressValue) progressValue.textContent = '0%';
    
    // Clear tags
    clearTags();
    
    // Clear image
    if (imageUploader && imageUploader.removeImage) {
        imageUploader.removeImage();
    }
}

// ===== PROJECT LOADING AND DISPLAY =====
async function loadProjects() {
    console.log('🔄 loadProjects() called');
    
    // Get the container
    const projectsContainer = document.getElementById('projects-container');
    if (!projectsContainer) {
        console.error('❌ projects-container element not found!');
        return;
    }
    
    console.log('✅ Container found, loading projects...');
    
    try {
        let projects = [];
        
        // ALWAYS try Firebase first, then fallback to localStorage
        if (db) {
            console.log('📡 Loading from Firebase...');
            try {
                const querySnapshot = await db.collection("projects").get();
                projects = querySnapshot.docs.map(doc => {
                    return { id: doc.id, ...doc.data() };
                });
                console.log('✅ Firebase projects loaded:', projects.length, 'projects');
            } catch (firebaseError) {
                console.error('❌ Firebase error:', firebaseError);
                // Fallback to localStorage
                console.log('🔄 Falling back to localStorage...');
                const stored = localStorage.getItem('projects');
                projects = stored ? JSON.parse(stored) : [];
            }
        } else {
           // No Firebase, use localStorage
            console.log('💾 Loading from localStorage...');
            const stored = localStorage.getItem('projects');
            projects = stored ? JSON.parse(stored) : [];
        }
        
        console.log('📦 Total projects to display:', projects.length);
        
        // Clear container
        projectsContainer.innerHTML = '';
        
        if (!projects || projects.length === 0) {
            console.log('📭 No projects found, showing empty state');
            projectsContainer.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; color: #666; background: #f9f9f9; border-radius: 8px; margin: 20px;">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 20px; color: #ccc;"></i>
                    <h3 style="margin-bottom: 10px;">No Projects Yet</h3>
                    <p style="margin-bottom: 20px;">Start by adding your first project!</p>
                    <button class="btn btn-primary" onclick="toggleAdminPanel()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-plus"></i> Add First Project
                    </button>
                </div>
            `;
            return;
        }
        
        console.log(`🎯 Rendering ${projects.length} projects`);
        
        // Sort projects by creation date (newest first)
        projects.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.id || 0);
            const dateB = new Date(b.createdAt || b.id || 0);
            return dateB - dateA;
        });
        
        // Render each project
        projects.forEach((project, index) => {
            try {
                const card = createProjectCard(project, index);
                if (card) {
                    projectsContainer.appendChild(card);
                    console.log(`✅ Card ${index} appended: ${project.title}`);
                }
            } catch (cardError) {
                console.error('❌ Error creating card for project:', project, cardError);
                
                // Create a basic error card as fallback
                const errorCard = document.createElement('div');
                errorCard.innerHTML = `
                    <div style="padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; margin: 10px 0;">
                        <strong>Error displaying project:</strong> ${project.title || 'Untitled'}
                    </div>
                `;
                projectsContainer.appendChild(errorCard);
            }
        });
        
        console.log('✅ All projects rendered successfully');
        
    } catch (error) {
        console.error('❌ Error in loadProjects:', error);
        projectsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8d7da; color: #721c24; border-radius: 8px;">
                <h3>Error Loading Projects</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// ===== CREATE PROJECT CARD FUNCTION =====
function createProjectCard(project, index) {
    const card = document.createElement('div');
    card.className = 'dynamic-project-card';
    card.style.cssText = 'background: white; border-radius: 8px; padding: 20px; margin: 15px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 4px solid #007bff;';
    
    const hasUrl = project.url && project.url.trim() !== '';
    const hasImage = project.imageUrl && project.imageUrl.trim() !== '';
    const progress = project.progress || 0;
    const status = project.status || 'idea';
    const priority = project.priority || 'medium';
    
    // Generate tags
    const tagsHtml = (project.tags || []).map(tag => 
        '<span style="background:#e9ecef;color:#495057;padding:2px 6px;border-radius:3px;font-size:11px;margin-right:5px;display:inline-block;">' + tag + '</span>'
    ).join('');
    
    // Status and priority colors
    const statusColors = {
        'idea': '#6c757d',
        'planning': '#17a2b8', 
        'development': '#ffc107',
        'testing': '#fd7e14',
        'completed': '#28a745'
    };
    
    const priorityColors = {
        'low': '#28a745',
        'medium': '#ffc107',
        'high': '#fd7e14',
        'critical': '#dc3545'
    };
    
    card.innerHTML = 
        '<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">' +
            '<h3 style="margin: 0; color: #333; flex: 1;">' + (project.title || 'Untitled Project') + '</h3>' +
            '<div style="display: flex; gap: 5px;">' +
                '<span style="background: ' + (statusColors[status] || '#6c757d') + '; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: capitalize;">' + status + '</span>' +
                '<span style="background: ' + (priorityColors[priority] || '#6c757d') + '; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: capitalize;">' + priority + '</span>' +
            '</div>' +
        '</div>' +
        
        (hasImage ? '<div style="margin-bottom: 10px;"></div>' : '') +
        
        '<p style="margin: 0 0 15px 0; color: #666; line-height: 1.4;">' + (project.description || 'No description provided.') + '</p>' +
        
        (project.tags && project.tags.length > 0 ? 
            '<div style="margin-bottom: 15px;">' +
                '<div style="font-size: 12px; color: #999; margin-bottom: 5px;">Tags:</div>' +
                '<div>' + tagsHtml + '</div>' +
            '</div>' : '') +
        
        '<div style="margin-bottom: 15px;">' +
            '<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">' +
                '<span style="font-size: 12px; color: #666;">Progress</span>' +
                '<span style="font-size: 12px; color: #666;">' + progress + '%</span>' +
            '</div>' +
            '<div style="background: #f0f0f0; border-radius: 10px; height: 8px; overflow: hidden;">' +
                '<div style="background: #007bff; height: 100%; width: ' + progress + '%; transition: width 0.3s;"></div>' +
            '</div>' +
        '</div>' +
        
        '<div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #999;">' +
            '<div style="display: flex; gap: 5px;">' +
                (hasUrl ? '<a href="' + project.url + '" target="_blank" style="background: #28a745; color: white; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 12px;"><i class="fas fa-external-link-alt"></i> Visit Project</a>' : '') +
            '</div>' +
            '<span>Created: ' + formatDate(project.createdAt) + '</span>' +
        '</div>';
    
    return card;
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (error) {
        return 'Invalid date';
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

// ===== DEBUG FUNCTIONS =====
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

function testAddCard() {
    console.log('🧪 Testing addCard function...');
    console.log('Current tags:', currentTags);
    console.log('Progress value:', document.getElementById('cardProgress')?.value);
}

function testAdminPanel() {
    console.log('🔧 Testing admin panel...');
    
    // Test if panel exists
    const panel = document.getElementById('adminPanel');
    console.log('Admin panel found:', !!panel);
    
    if (panel) {
        console.log('Panel display style:', panel.style.display);
        console.log('Panel HTML:', panel.innerHTML);
    }
    
    // Test if button exists
    const button = document.querySelector('.admin-toggle-btn');
    console.log('Button found:', !!button);
    
    // Show the panel
    toggleAdminPanel();
}

// ===== UTILITY FUNCTIONS =====
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
        notification.style.background = '#28a745';
    } else if (type === 'error') {
        notification.style.background = '#dc3545';
    } else {
        notification.style.background = '#17a2b8';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ===== EXPORT FUNCTIONS FOR GLOBAL ACCESS =====
window.toggleAdminPanel = toggleAdminPanel;
window.addCard = addCard;
window.removeTag = removeTag;
window.loadProjects = loadProjects;
window.debugProjects = debugProjects;
window.testAddCard = testAddCard;
window.testAdminPanel = testAdminPanel;
window.showSection = showSection;

console.log("✅ Innovation Earth Projects script loaded successfully!");
