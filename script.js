// ===== MAIN SCRIPT FOR INNOVATION EARTH PROJECTS =====
// Complete rewrite with progress bar and tag management

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
    initializeTagSystem();
    initializeProgressBar();
    initializeImageUpload(); // Add this line
    
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

// Add these missing functions (place them near the top of your file):
function getStatusConfig(status) {
    const configs = {
        'idea': { label: 'Idea Phase', class: 'status-idea' },
        'planning': { label: 'Planning', class: 'status-planning' },
        'development': { label: 'Development', class: 'status-development' },
        'testing': { label: 'Testing', class: 'status-testing' },
        'completed': { label: 'Completed', class: 'status-completed' }
    };
    return configs[status] || configs.idea;
}

function getPriorityConfig(priority) {
    const configs = {
        'low': { label: 'Low Priority', class: 'priority-low' },
        'medium': { label: 'Medium Priority', class: 'priority-medium' },
        'high': { label: 'High Priority', class: 'priority-high' },
        'critical': { label: 'Critical', class: 'priority-critical' }
    };
    return configs[priority] || configs.medium;
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

// ===== IMAGE UPLOAD FUNCTIONALITY =====
function initializeImageUpload() {
    const imageInput = document.getElementById('cardImage');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImage');
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
                alert('Image size must be less than 5MB');
                this.value = '';
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file');
                this.value = '';
                return;
            }

            currentImageFile = file;
            previewImage(file);
        }
    });

    // Handle remove image
    removeImageBtn.addEventListener('click', function() {
        removeImage();
    });

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
            
            removeImageBtn.style.display = 'block';
        };
        
        reader.onerror = function() {
            uploadProgress.style.display = 'none';
            alert('Error loading image. Please try again.');
        };
        
        reader.readAsDataURL(file);
    }

    function removeImage() {
        currentImageFile = null;
        currentImageUrl = null;
        imageInput.value = '';
        imagePreview.classList.remove('has-image');
        removeImageBtn.style.display = 'none';
    }

    // Return functions to access from addCard function
    return {
        getCurrentImage: () => currentImageUrl,
        getImageFile: () => currentImageFile,
        removeImage: removeImage
    };
}

// Initialize image upload when DOM is loaded
let imageUploader;
document.addEventListener('DOMContentLoaded', function() {
    imageUploader = initializeImageUpload();
});

// ===== TAG MANAGEMENT SYSTEM =====
function initializeTagSystem() {
    console.log('🏷️ Initializing tag system...');
    
    const tagInput = document.getElementById('tagInput');
    const addTagBtn = document.getElementById('addTagBtn');
    
    if (tagInput && addTagBtn) {
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
        document.querySelectorAll('.tag-suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', function() {
                const tag = this.getAttribute('data-tag');
                tagInput.value = tag;
                addTag();
            });
        });
    }
    
    // Clear tags when form is submitted
    document.addEventListener('DOMContentLoaded', function() {
        clearTags();
    });
}

function addTag() {
    const tagInput = document.getElementById('tagInput');
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
        tagElement.innerHTML = `
            ${tag}
            <button type="button" class="tag-remove" onclick="removeTag('${tag}')">
                <i class="fas fa-times"></i>
            </button>
        `;
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

// ===== ENHANCED ADD CARD FUNCTION =====
// ===== ENHANCED ADD CARD FUNCTION WITH IMAGE SUPPORT =====
async function addCard() {
    console.log('💾 Starting to add card...');
    
    const title = document.getElementById('cardTitle').value;
    const description = document.getElementById('cardDesc').value;
    const url = document.getElementById('cardUrl').value;
    const status = document.getElementById('cardStatus').value;
    const priority = document.getElementById('cardPriority').value;
    const progress = parseInt(document.getElementById('cardProgress').value);
    const tags = getCurrentTags();
    const imageUrl = window.imageUploader ? window.imageUploader.getCurrentImage() : null;
    
    console.log('📝 Form values:', { title, description, url, status, priority, progress, tags, hasImage: !!imageUrl });
    
    if (!title || !description) {
        alert('Please fill in both title and description');
        return;
    }
    
    try {
        const cardData = {
            title: title,
            description: description,
            url: url || '',
            status: status,
            priority: priority,
            progress: progress || 0,
            tags: tags || [],
            imageUrl: imageUrl || '',
            createdAt: new Date(),
            hasCustomImage: !!imageUrl
        };
        
        console.log('💾 Saving project data:', cardData);
        
        if (db) {
            // If using Firebase
            await db.collection("projects").add(cardData);
            alert('✅ Project added successfully!');
            
        } else {
            // Local storage fallback
            const projects = JSON.parse(localStorage.getItem('projects') || '[]');
            // Add a simple ID for local storage
            cardData.id = 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            projects.push(cardData);
            localStorage.setItem('projects', JSON.stringify(projects));
            console.log('💾 Saved to local storage:', projects);
        }
        
        // Clear form and reload projects
        clearForm();
        loadProjects();
        
    } catch (error) {
        console.error('❌ Error adding project:', error);
        alert('Error adding project: ' + error.message);
    }
}

// Simple image upload function (for demo purposes)
async function uploadImageToStorage(file) {
    // In a real application, you would upload to cloud storage here
    // For demo, we'll return a base64 URL (not suitable for large images)
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}

function clearForm() {
    document.getElementById('cardTitle').value = '';
    document.getElementById('cardDesc').value = '';
    document.getElementById('cardUrl').value = '';
    document.getElementById('cardStatus').value = 'idea';
    document.getElementById('cardPriority').value = 'medium';
    document.getElementById('cardProgress').value = '0';
    document.getElementById('progressValue').textContent = '0%';
    clearTags();
    
    // Clear image
    if (imageUploader) {
        imageUploader.removeImage();
    }
}

// ===== PROJECT LOADING AND DISPLAY =====
async function loadProjects() {
    console.log('🔄 loadProjects() called');
    
    // Get the container - FIXED SELECTOR
    const projectsContainer = document.getElementById('projects-container');
    if (!projectsContainer) {
        console.error('❌ projects-container element not found! Searching for alternatives...');
        
        // Try alternative selectors
        const alternatives = [
            '#projects .projects-grid',
            '#projects .projects-content',
            '#projects .container',
            '.projects-grid',
            '.projects-content'
        ];
        
        for (const selector of alternatives) {
            const altContainer = document.querySelector(selector);
            if (altContainer) {
                console.log('✅ Found alternative container:', selector);
                // We'll handle this differently - see next fix
                break;
            }
        }
        return;
    }
    
    console.log('✅ Container found, loading projects...');
    
    try {
        // Get projects from storage
        let projects = [];
        try {
            const stored = localStorage.getItem('projects');
            projects = stored ? JSON.parse(stored) : [];
            console.log('📦 Retrieved projects from storage:', projects);
        } catch (parseError) {
            console.error('❌ Error parsing projects:', parseError);
            projects = [];
        }
        
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
        
        // Render each project
        projects.forEach((project, index) => {
            try {
                const card = createProjectCard(project, index);
                if (card) {
                    projectsContainer.appendChild(card);
                    console.log(`✅ Card ${index} appended`);
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

// ===== CREATE PROJECT CARD FUNCTION (FIXED) =====
function createProjectCard(project, index) {
    const card = document.createElement('div');
    card.className = 'dynamic-project-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const hasUrl = project.url && project.url.trim() !== '';
    const hasImage = project.imageUrl && project.imageUrl.trim() !== '';
    const statusConfig = getStatusConfig(project.status);
    const priorityConfig = getPriorityConfig(project.priority);
    
    // Generate tags HTML - FIXED: Proper string concatenation
    const tagsHtml = generateTagsHtml(project.tags || []);
    
    // Use custom image if available, otherwise use default icon
    const imageContent = hasImage ? 
        `<img src="${project.imageUrl}" alt="${project.title}" class="project-custom-image">` :
        `<i class="fas fa-project-diagram"></i>`;
    
    card.innerHTML = `
        <div class="card-image" style="${!hasImage ? 'background: linear-gradient(135deg, var(--teal), var(--cyan))' : ''}">
            ${imageContent}
            ${hasUrl ? '<div class="link-indicator"><i class="fas fa-external-link-alt"></i></div>' : ''}
            ${hasImage ? '<div class="custom-image-badge"><i class="fas fa-camera"></i> Custom Image</div>' : ''}
        </div>
        
        <span class="card-status ${statusConfig.class}">${statusConfig.label}</span>
        <span class="card-priority ${priorityConfig.class}">${priorityConfig.label}</span>
        
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        
        ${hasUrl ? `
            <div class="project-link">
                <a href="${project.url}" target="_blank" class="btn btn-primary">
                    <i class="fas fa-external-link-alt"></i> Visit Project Website
                </a>
            </div>
        ` : ''}
        
        <div class="card-tags">
            ${tagsHtml}
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
    
    // Make entire card clickable if URL exists
    if (hasUrl) {
        card.addEventListener('click', function(e) {
            // Don't trigger if user clicked on buttons or links
            if (e.target.closest('button') || e.target.closest('a')) {
                return;
            }
            window.open(project.url, '_blank');
        });
    }
    
    return card;
}

// ===== HELPER FUNCTION FOR TAGS GENERATION =====
function generateTagsHtml(tags) {
    if (!tags || tags.length === 0) {
        return '<span class="no-tags">No tags</span>';
    }
    
    return tags.map(tag => 
        `<span class="tag">${tag}</span>`
    ).join('');
}

// ===== EMPTY AND ERROR STATES =====
function getErrorState() {
    return `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error Loading Projects</h3>
            <p>There was an error loading your projects. Please try refreshing the page.</p>
            <button class="btn btn-primary" onclick="clearLocalStorageAndReload()">
                <i class="fas fa-redo"></i> Reset & Reload
            </button>
        </div>
    `;
}

function clearLocalStorageAndReload() {
    if (confirm('This will clear all locally stored projects. Are you sure?')) {
        localStorage.removeItem('projects');
        location.reload();
    }
}

// ===== ENHANCED ADMIN PANEL MANAGEMENT =====
function toggleAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) {
        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            // Scroll to top when opening
            panel.scrollTop = 0;
            // Focus on first input
            const firstInput = panel.querySelector('input, textarea, select');
            if (firstInput) firstInput.focus();
        }
    }
}

// Close admin panel when clicking outside
document.addEventListener('click', function(e) {
    const adminPanel = document.getElementById('adminPanel');
    const adminBtn = document.querySelector('.admin-toggle-btn');
    
    if (adminPanel && adminPanel.style.display !== 'none') {
        if (!adminPanel.contains(e.target) && !adminBtn.contains(e.target)) {
            adminPanel.style.display = 'none';
        }
    }
});

// Escape key to close admin panel
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel && adminPanel.style.display !== 'none') {
            adminPanel.style.display = 'none';
        }
    }
});

// Auto-adjust height on window resize
window.addEventListener('resize', function() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel && adminPanel.style.display !== 'none') {
        adminPanel.style.maxHeight = '80vh';
    }
});

function createProjectCard(project, index) {
    const card = document.createElement('div');
    card.className = 'dynamic-project-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const hasUrl = project.url && project.url.trim() !== '';
    const hasImage = project.imageUrl && project.imageUrl.trim() !== '';
    const statusConfig = getStatusConfig(project.status);
    const priorityConfig = getPriorityConfig(project.priority);
    
    // Generate tags HTML - FIXED: Use the project's tags
    const tagsHtml = generateTagsHtml(project.tags || []);
    
    // Use custom image if available, otherwise use default icon
    const imageContent = hasImage ? 
        `<img src="${project.imageUrl}" alt="${project.title}" class="project-custom-image">` :
        `<i class="fas fa-project-diagram"></i>`;
    
    card.innerHTML = `
        <div class="card-image" style="${!hasImage ? 'background: linear-gradient(135deg, var(--teal), var(--cyan))' : ''}">
            ${imageContent}
            ${hasUrl ? '<div class="link-indicator"><i class="fas fa-external-link-alt"></i></div>' : ''}
            ${hasImage ? '<div class="custom-image-badge"><i class="fas fa-camera"></i> Custom Image</div>' : ''}
        </div>
        
        <span class="card-status ${statusConfig.class}">${statusConfig.label}</span>
        <span class="card-priority ${priorityConfig.class}">${priorityConfig.label}</span>
        
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        
        ${hasUrl ? `
            <div class="project-link">
                <a href="${project.url}" target="_blank" class="btn btn-primary">
                    <i class="fas fa-external-link-alt"></i> Visit Project Website
                </a>
            </div>
        ` : ''}
        
        <div class="card-tags">
            ${tagsHtml}
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
    
    // Make entire card clickable if URL exists
    if (hasUrl) {
        card.addEventListener('click', function(e) {
            // Don't trigger if user clicked on buttons or links
            if (e.target.closest('button') || e.target.closest('a')) {
                return;
            }
            window.open(project.url, '_blank');
        });
    }
    
    return card;
}

// Add this helper function for generating tags HTML
function generateTagsHtml(tags) {
    if (!tags || tags.length === 0) return '<span class="no-tags">No tags</span>';
    
    return tags.map(tag => 
        `<span class="tag">${tag}</span>`
    ).join('');
}
    
    // Make entire card clickable if URL exists
    if (hasUrl) {
        card.addEventListener('click', function(e) {
            // Don't trigger if user clicked on buttons or links
            if (e.target.closest('button') || e.target.closest('a')) {
                return;
            }
            window.open(project.url, '_blank');
        });
    }
    
    return card;

// ===== HELPER FUNCTIONS =====
function getStatusConfig(status) {
    const configs = {
        'idea': { label: 'Idea Phase', class: 'status-idea' },
        'planning': { label: 'Planning', class: 'status-planning' },
        'development': { label: 'Development', class: 'status-development' },
        'testing': { label: 'Testing', class: 'status-testing' },
        'completed': { label: 'Completed', class: 'status-completed' }
    };
    return configs[status] || configs.idea;
}

function getPriorityConfig(priority) {
    const configs = {
        'low': { label: 'Low Priority', class: 'priority-low' },
        'medium': { label: 'Medium Priority', class: 'priority-medium' },
        'high': { label: 'High Priority', class: 'priority-high' },
        'critical': { label: 'Critical', class: 'priority-critical' }
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

// ===== PROJECT MANAGEMENT =====
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

function editProject(projectId) {
    alert('Edit functionality coming soon! Project ID: ' + projectId);
    // TODO: Implement edit functionality
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
    console.log('Progress value:', document.getElementById('cardProgress').value);
}

console.log("✅ Innovation Earth Projects script loaded successfully!");
