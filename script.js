// ===== MAIN SCRIPT FOR INNOVATION EARTH PROJECTS =====
// Complete version with all original functionality and competition section integration

// Main initialization when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Innovation Earth Projects...');
    
    // Debug: Log available category elements
    debugCategoryElements();
    
    // Initialize all functionality in correct order
    initializeSectionManagement(); // MUST BE FIRST - handles section navigation
    initializeMobileMenu();
    initializeBannerSlider();
    initializeNavigation();
    initializeScrollAnimations();
    initializeCategoryTabs();
    initializeCompetitionTabs(); // NEW: Competition section tabs
    initializeStatsCounter();
    initializeContactForm();
    initializeSmoothScrolling();
    initializeProjectCards();
    initializeRoleCards();
    initializeEventRegistration();
    animateProgressBars();
    initializeAdminPanel();
    initializeCompetitionLinks(); // NEW: Competition resource links
    
    console.log('✅ Innovation Earth Projects - All functionality loaded successfully!');
});

// ===== SECTION MANAGEMENT - FIXED CORE FUNCTIONALITY =====
function initializeSectionManagement() {
    console.log('🔧 Initializing section management...');
    
    // Make sure all sections are properly set up
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
        section.style.minHeight = '100vh';
    });
    
    // Show home section by default
    showSection('#home');
    
    // Handle all internal link clicks (header navigation)
    document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            if (targetId && targetId !== '#') {
                console.log('📍 Navigation link clicked:', targetId);
                showSection(targetId);
            }
        });
    });
    
    // Handle footer quick links
    document.querySelectorAll('.footer a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            if (targetId && targetId !== '#') {
                console.log('👣 Footer link clicked:', targetId);
                showSection(targetId);
            }
        });
    });
    
    // Handle quick link cards
    document.querySelectorAll('.quick-link-card').forEach(card => {
        card.addEventListener('click', function() {
            const link = this.querySelector('a');
            if (link) {
                const targetId = link.getAttribute('href');
                if (targetId && targetId !== '#') {
                    console.log('💡 Quick link card clicked:', targetId);
                    showSection(targetId);
                }
            }
        });
    });
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function(e) {
        const hash = window.location.hash;
        if (hash) {
            console.log('🌐 Browser navigation:', hash);
            showSection(hash);
        }
    });
}

function showSection(sectionId) {
    console.log('🔄 Showing section:', sectionId);
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show the target section
    const targetSection = document.querySelector(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // Update URL for browser history
        history.pushState(null, '', sectionId);
        
        // Update navigation highlights
        updateNavHighlight(sectionId);
        
        // Scroll to top of the page
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Trigger animations for the new section
        setTimeout(() => {
            triggerSectionAnimations(sectionId);
            
            // Load section-specific content
            if (sectionId === '#projects') {
                loadProjects();
            }
        }, 300);
        
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

function triggerSectionAnimations(sectionId) {
    const section = document.querySelector(sectionId);
    if (section) {
        // Re-trigger scroll animations
        const animateElements = section.querySelectorAll('.animate-on-scroll');
        animateElements.forEach(el => {
            el.classList.remove('animated');
            // Trigger reflow
            void el.offsetWidth;
            el.classList.add('animated');
        });
    }
}

// ===== DEBUGGING UTILITY =====
function debugCategoryElements() {
    const categories = [
        'concepts', 'development', 'completed', 'upcoming',
        'volunteer', 'coding', 'business', 'design', 'research',
        'technology', 'sustainability', 'business-plan', 'creative-arts', 'science'
    ];
    
    console.log('🔍 Available category elements:');
    categories.forEach(category => {
        const element = document.getElementById(category);
        console.log(`ID: ${category} - Exists: ${!!element}`);
    });
}

// ===== MOBILE MENU FUNCTIONALITY =====
function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu');
    const navList = document.getElementById('main-nav');
    
    if (mobileMenuToggle && navList) {
        mobileMenuToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            navList.classList.toggle('show');
            this.setAttribute('aria-expanded', !isExpanded);
            this.innerHTML = isExpanded ? 
                '<i class="fas fa-bars" aria-hidden="true"></i>' : 
                '<i class="fas fa-times" aria-hidden="true"></i>';
        });
        
        // Close mobile menu when clicking on nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                navList.classList.remove('show');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                mobileMenuToggle.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenuToggle.contains(event.target) && !navList.contains(event.target)) {
                navList.classList.remove('show');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                mobileMenuToggle.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
            }
        });
    }
}

// ===== BANNER SLIDER FUNCTIONALITY =====
function initializeBannerSlider() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.dot');
    const totalSlides = slides.length;
    let autoSlideInterval;

    if (slides.length === 0) {
        console.log('⚠️ No banner slides found');
        return;
    }

    function showSlide(index) {
        // Remove active class from all slides and dots
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Add active class to current slide and dot
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
        
        // Reset auto-slide timer
        resetAutoSlide();
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(currentSlide);
    }

    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(nextSlide, 5000);
    }

    // Dot click events
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => showSlide(index));
    });

    // Navigation button events
    const prevButton = document.querySelector('.banner-prev');
    const nextButton = document.querySelector('.banner-next');
    
    if (prevButton) prevButton.addEventListener('click', prevSlide);
    if (nextButton) nextButton.addEventListener('click', nextSlide);

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
    });

    // Start auto-slide
    showSlide(0);
    
    // Pause auto-slide on hover
    const bannerContainer = document.querySelector('.banner-container');
    if (bannerContainer) {
        bannerContainer.addEventListener('mouseenter', () => {
            clearInterval(autoSlideInterval);
        });
        bannerContainer.addEventListener('mouseleave', resetAutoSlide);
    }
}

// ===== NAVIGATION FUNCTIONALITY =====
function initializeNavigation() {
    // Navigation is now handled by initializeSectionManagement()
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

    // Observe all animate-on-scroll elements
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// ===== CATEGORY TABS FUNCTIONALITY =====
function initializeCategoryTabs() {
    // Project category tabs
    const projectTabs = document.querySelectorAll('.category-tab[data-category]');
    projectTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active tab
            projectTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected category, hide others
            document.querySelectorAll('.project-category').forEach(cat => {
                cat.classList.remove('active');
            });
            
            const targetCategory = document.getElementById(category);
            if (targetCategory) {
                targetCategory.classList.add('active');
                populateProjectCategory(category);
            }
        });
    });

    // Role category tabs
    const roleTabs = document.querySelectorAll('.category-tab[data-category]');
    roleTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active tab
            roleTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected category, hide others
            document.querySelectorAll('.role-category').forEach(cat => {
                cat.classList.remove('active');
            });
            
            const targetCategory = document.getElementById(category);
            if (targetCategory) {
                targetCategory.classList.add('active');
                populateRoleCategory(category);
            }
        });
    });
}

// ===== COMPETITION TABS FUNCTIONALITY (consolidated single section) =====
let competitionTabs = [];

function initializeCompetitionTabs() {
    competitionTabs = Array.from(document.querySelectorAll('.category-nav .category-tab[data-category]'));
    const categories = Array.from(document.querySelectorAll('.competition-category'));

    if (competitionTabs.length === 0) {
        console.warn('⚠️ No competition tabs found');
        categories.forEach(cat => {
            cat.classList.remove('active');
            cat.style.display = 'none';
            cat.setAttribute('aria-hidden', 'true');
        });
        return;
    }

    // Ensure all categories are hidden initially
    categories.forEach(cat => {
        cat.classList.remove('active');
        cat.style.display = 'none';
        cat.setAttribute('aria-hidden', 'true');
    });

    // Accessibility + interaction for each tab
    competitionTabs.forEach(tab => {
        tab.setAttribute('role', 'tab');
        tab.setAttribute('tabindex', '0');
        tab.setAttribute('aria-selected', 'false');

        tab.addEventListener('click', () => activateCompetitionTab(tab));
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activateCompetitionTab(tab);
            } else if (e.key === 'ArrowRight') {
                const idx = competitionTabs.indexOf(tab);
                const next = competitionTabs[(idx + 1) % competitionTabs.length];
                next && next.focus();
            } else if (e.key === 'ArrowLeft') {
                const idx = competitionTabs.indexOf(tab);
                const prev = competitionTabs[(idx - 1 + competitionTabs.length) % competitionTabs.length];
                prev && prev.focus();
            }
        });
    });

    function activateCompetitionTab(tab) {
        const category = tab.getAttribute('data-category');

        // Update tab states
        competitionTabs.forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        // Hide all categories
        categories.forEach(cat => {
            cat.classList.remove('active');
            cat.style.display = 'none';
            cat.setAttribute('aria-hidden', 'true');
        });

        // Show target category
        const target = document.getElementById(category);
        if (target) {
            target.classList.add('active');
            target.style.display = 'block';
            target.setAttribute('aria-hidden', 'false');

            // Trigger animations for visible elements
            setTimeout(() => {
                target.querySelectorAll('.animate-on-scroll').forEach(el => {
                    el.classList.remove('animated');
                    void el.offsetWidth;
                    el.classList.add('animated');
                });
            }, 100);
        } else {
            console.warn('Competition category not found:', category);
        }
    }

    // Activate the first tab by default
    const firstTab = competitionTabs[0];
    if (firstTab) {
        activateCompetitionTab(firstTab);
    }
}
    // Initialize first tab as active
    const firstTab = competitionTabs[0];
    if (firstTab) {
        const firstCategory = firstTab.getAttribute('data-category');
        const firstCategoryElement = document.getElementById(firstCategory);
        if (firstCategoryElement) {
            firstCategoryElement.style.display = 'block';
            firstCategoryElement.setAttribute('aria-hidden', 'false');
        }
    }

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeCompetitionTabs();
});

// ===== PROJECT CATEGORY POPULATION =====
function populateProjectCategory(category) {
    const categoryContainer = document.getElementById(category);
    if (!categoryContainer) {
        console.warn(`Project category container with ID '${category}' not found`);
        return;
    }
    
    // Clear existing content
    categoryContainer.innerHTML = '';
    
    const sampleProjects = getSampleProjects(category);
    
    if (sampleProjects.length === 0) {
        const noProjects = document.createElement('div');
        noProjects.className = 'no-content-message';
        noProjects.innerHTML = `
            <i class="fas fa-lightbulb"></i>
            <h3>Share Your Project Ideas</h3>
            <p>We're just getting started! What projects would you like to work on?</p>
            <button class="btn btn-primary" onclick="showSection('#contact')">
                Suggest a Project
            </button>
        `;
        categoryContainer.appendChild(noProjects);
    } else {
        const projectsGrid = document.createElement('div');
        projectsGrid.className = 'projects-grid';
        
        sampleProjects.forEach(project => {
            const projectCard = createProjectCard(project);
            projectsGrid.appendChild(projectCard);
        });
        
        categoryContainer.appendChild(projectsGrid);
    }
}

function getSampleProjects(category) {
    const projects = {
        concepts: [
            {
                title: "Urban Green Spaces",
                description: "Designing sustainable green spaces in urban environments",
                progress: 25,
                status: "Concept",
                tags: ["Sustainability", "Urban Planning", "Design"],
                members: 3
            },
            {
                title: "AI Learning Platform",
                description: "Educational platform for AI and machine learning",
                progress: 15,
                status: "Idea",
                tags: ["AI", "Education", "Technology"],
                members: 5
            }
        ],
        development: [
            {
                title: "Community Garden App",
                description: "Mobile app connecting community garden enthusiasts",
                progress: 65,
                status: "Development",
                tags: ["Mobile", "Community", "Gardening"],
                members: 8
            }
        ],
        completed: [
            {
                title: "Recycling Awareness Campaign",
                description: "Successful community recycling education program",
                progress: 100,
                status: "Completed",
                tags: ["Environment", "Education", "Community"],
                members: 12
            }
        ],
        upcoming: [
            {
                title: "Smart City Initiative",
                description: "IoT solutions for sustainable city management",
                progress: 5,
                status: "Planning",
                tags: ["IoT", "Smart Cities", "Sustainability"],
                members: 2
            }
        ]
    };
    
    return projects[category] || [];
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card animate-on-scroll';
    card.innerHTML = `
        <div class="project-image">
            <div class="project-status">${project.status}</div>
        </div>
        <div class="project-content">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="project-tags">
                ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="project-details">
                <div class="project-detail">
                    <i class="fas fa-users"></i>
                    <span>${project.members} team members</span>
                </div>
            </div>
            <div class="initiative-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${project.progress}%"></div>
                </div>
                <span>${project.progress}% complete</span>
            </div>
            <button class="btn btn-primary" style="margin-top: 1rem;">
                <i class="fas fa-info-circle"></i> Learn More
            </button>
        </div>
    `;
    
    // Add click event to Learn More button
    card.querySelector('.btn').addEventListener('click', function() {
        alert(`More information about: ${project.title}\n\n${project.description}`);
    });
    
    return card;
}

// ===== ROLE CATEGORY POPULATION =====
function populateRoleCategory(category) {
    const categoryContainer = document.getElementById(category);
    if (!categoryContainer) {
        console.warn(`Role category container with ID '${category}' not found`);
        return;
    }
    
    // Clear existing content
    categoryContainer.innerHTML = '';
    
    const sampleRoles = getSampleRoles(category);
    
    if (sampleRoles.length === 0) {
        const noRoles = document.createElement('div');
        noRoles.className = 'no-content-message';
        noRoles.innerHTML = `
            <i class="fas fa-user-friends"></i>
            <h3>No Open Roles</h3>
            <p>Currently no open roles in the <strong>${getCategoryDisplayName(category)}</strong> category.</p>
            <p>Check back soon for new opportunities to join our team!</p>
        `;
        categoryContainer.appendChild(noRoles);
    } else {
        const rolesGrid = document.createElement('div');
        rolesGrid.className = 'roles-grid';
        
        sampleRoles.forEach(role => {
            const roleCard = createRoleCard(role);
            rolesGrid.appendChild(roleCard);
        });
        
        categoryContainer.appendChild(rolesGrid);
    }
}

function getSampleRoles(category) {
    const roles = {
        volunteer: [
            {
                title: "Community Outreach Volunteer",
                description: "Engage with local communities and promote our initiatives",
                icon: "fa-hands-helping",
                commitment: "5-10 hours/week",
                skills: ["Communication", "Community Engagement"]
            }
        ],
        coding: [
            {
                title: "Frontend Developer",
                description: "Build responsive and accessible web interfaces",
                icon: "fa-code",
                commitment: "8-12 hours/week",
                skills: ["HTML/CSS", "JavaScript", "React"]
            }
        ],
        business: [
            {
                title: "Marketing Coordinator",
                description: "Develop and implement marketing strategies",
                icon: "fa-chart-line",
                commitment: "6-10 hours/week",
                skills: ["Marketing", "Social Media", "Analytics"]
            }
        ],
        design: [
            {
                title: "UI/UX Designer",
                description: "Create intuitive and beautiful user interfaces",
                icon: "fa-paint-brush",
                commitment: "7-12 hours/week",
                skills: ["Figma", "User Research", "Prototyping"]
            }
        ],
        research: [
            {
                title: "Sustainability Researcher",
                description: "Research and analyze environmental impact data",
                icon: "fa-flask",
                commitment: "5-8 hours/week",
                skills: ["Research", "Data Analysis", "Sustainability"]
            }
        ]
    };
    
    return roles[category] || [];
}

function createRoleCard(role) {
    const card = document.createElement('div');
    card.className = 'role-card animate-on-scroll';
    card.innerHTML = `
        <div class="role-icon">
            <i class="fas ${role.icon}"></i>
        </div>
        <h3>${role.title}</h3>
        <p>${role.description}</p>
        <div class="role-details">
            <p><strong>Time Commitment:</strong> ${role.commitment}</p>
            <div class="role-skills">
                <strong>Skills:</strong> ${role.skills.join(', ')}
            </div>
        </div>
        <button class="btn btn-primary" style="margin-top: 1rem;">
            <i class="fas fa-user-plus"></i> Apply Now
        </button>
    `;
    
    card.querySelector('.btn').addEventListener('click', function() {
        alert(`Application for: ${role.title}\n\nWe'll contact you soon about this opportunity!`);
    });
    
    return card;
}

// ===== COMPETITION CATEGORY POPULATION =====
function populateCompetitionCategory(category) {
    const categoryContainer = document.getElementById(category);
    
    // SAFETY CHECK: Return early if element doesn't exist
    if (!categoryContainer) {
        console.warn(`Competition category container with ID '${category}' not found`);
        return;
    }
}

// ===== HELPER FUNCTIONS =====
function getCategoryDisplayName(category) {
    const displayNames = {
        'concepts': 'Project Concepts',
        'development': 'Under Development',
        'completed': 'Completed Projects',
        'upcoming': 'Upcoming Initiatives',
        'volunteer': 'Volunteer Program',
        'coding': 'Coding & Tech',
        'business': 'Business & Marketing',
        'design': 'Design & Creativity',
        'research': 'Research & Development',
        'technology': 'Technology & Engineering',
        'sustainability': 'Sustainability & Environment',
        'business-plan': 'Business & Entrepreneurship',
        'creative-arts': 'Creative Arts & Design',
        'science': 'Science & Research'
    };
    
    return displayNames[category] || category;
}

// ===== FIXED STATS COUNTER ANIMATION =====
function initializeStatsCounter() {
    let hasAnimated = false;
    
    const observer = new IntersectionObserver((entries) => {
        if (hasAnimated) return;
        
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                hasAnimated = true;
                
                document.querySelectorAll('.stat-number').forEach((numberEl, index) => {
                    setTimeout(() => {
                        const target = parseInt(numberEl.getAttribute('data-count') || numberEl.textContent.replace('+', ''));
                        let current = 0;
                        const increment = target / 50;
                        
                        const timer = setInterval(() => {
                            current += increment;
                            if (current >= target) {
                                numberEl.textContent = target + (target === 100 ? '+' : '');
                                clearInterval(timer);
                            } else {
                                numberEl.textContent = Math.floor(current);
                            }
                        }, 30);
                    }, index * 200);
                });
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.stat-item').forEach(el => {
        observer.observe(el);
    });
}

// ===== FIXED PROGRESS BAR ANIMATIONS =====
function animateProgressBars() {
    let hasAnimated = false;
    
    const observer = new IntersectionObserver((entries) => {
        if (hasAnimated) return;
        
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                hasAnimated = true;
                
                document.querySelectorAll('.progress-fill').forEach((bar, index) => {
                    setTimeout(() => {
                        const finalWidth = bar.style.width || getComputedStyle(bar).width;
                        bar.style.width = '0%';
                        bar.style.transition = 'width 1.5s ease-in-out';
                        
                        setTimeout(() => {
                            bar.style.width = finalWidth;
                        }, 100);
                    }, index * 300);
                });
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.initiative-progress').forEach(el => {
        observer.observe(el);
    });
}

// ===== ENHANCED PROJECT CARD CLICK HANDLERS =====
function initializeProjectCardClicks() {
    document.querySelectorAll('.initiative-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const cardTitle = this.querySelector('h3').textContent;
            const cardDescription = this.querySelector('p').textContent;
            const progress = this.querySelector('.progress-fill').style.width;
            
            // Show project details modal
            showProjectDetailsModal({
                title: cardTitle,
                description: cardDescription,
                progress: progress,
                onExplore: () => {
                    // Navigate to Projects section when user clicks "Explore"
                    showSection('#projects');
                    closeModal();
                }
            });
        });
    });
    
    // Visual feedback
    document.querySelectorAll('.initiative-card').forEach(card => {
        card.style.cursor = 'pointer';
    });
}

function showProjectDetailsModal(project) {
    const modal = document.createElement('div');
    modal.className = 'project-modal-overlay active';
    modal.innerHTML = `
        <div class="project-modal">
            <div class="modal-header">
                <h3>${project.title}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-content">
                <div class="project-summary">
                    <p>${project.description}</p>
                    
                    <div class="project-progress">
                        <h4>Current Progress</h4>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${project.progress}"></div>
                        </div>
                        <span>${project.progress} complete</span>
                    </div>
                    
                    <div class="project-actions">
                        <button class="btn btn-secondary" onclick="closeModal()">
                            <i class="fas fa-times"></i> Close
                        </button>
                        <button class="btn btn-primary" onclick="project.onExplore()">
                            <i class="fas fa-arrow-right"></i> Explore Projects
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function closeModal() {
    const modal = document.querySelector('.project-modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// ===== CONTACT FORM FUNCTIONALITY =====
function initializeContactForm() {
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');
            
            // Simple validation
            if (!name || !email || !subject || !message) {
                alert('Please fill in all fields');
                return;
            }
            
            // Simulate form submission
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                alert(`Thank you, ${name}! Your message has been sent successfully.\n\nWe'll get back to you at ${email} soon.`);
                contactForm.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
}

// ===== SMOOTH SCROLLING =====
function initializeSmoothScrolling() {
    // Smooth scroll for anchor links within the same page
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===== PROJECT CARD INTERACTIONS =====
function initializeProjectCards() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.project-card')) {
            const card = e.target.closest('.project-card');
            card.style.transform = 'translateY(-5px) scale(1.02)';
            
            setTimeout(() => {
                card.style.transform = 'translateY(-5px)';
            }, 150);
        }
    });
}

// ===== ROLE CARD INTERACTIONS =====
function initializeRoleCards() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.role-card')) {
            const card = e.target.closest('.role-card');
            card.style.transform = 'translateY(-3px) scale(1.01)';
            
            setTimeout(() => {
                card.style.transform = 'translateY(-3px)';
            }, 150);
        }
    });
}

// ===== ENHANCED EVENT REGISTRATION FUNCTIONALITY =====
function initializeEventRegistration() {
    // Initialize event tracking
    const registeredEvents = new Set();
    
    // Enhanced event registration with modal
    document.querySelectorAll('.event-item .btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const eventItem = this.closest('.event-item');
            const eventTitle = eventItem.querySelector('h3').textContent;
            const eventDate = eventItem.querySelector('.event-day').textContent + ' ' + 
                            eventItem.querySelector('.event-month').textContent;
            const eventTime = eventItem.querySelector('.fa-clock').nextSibling.textContent.trim();
            const eventLocation = eventItem.querySelector('.fa-map-marker-alt').nextSibling.textContent.trim();
            const eventDescription = eventItem.querySelector('p').textContent;
            
            // Check if already registered
            if (registeredEvents.has(eventTitle)) {
                showEventModal({
                    title: 'Already Registered!',
                    type: 'info',
                    content: `You are already registered for "${eventTitle}".`,
                    buttons: [
                        { text: 'View Details', action: () => showEventDetails(eventItem) },
                        { text: 'OK', action: () => closeModal() }
                    ]
                });
                return;
            }
            
            // Show registration modal
            showRegistrationModal({
                title: eventTitle,
                date: eventDate,
                time: eventTime,
                location: eventLocation,
                description: eventDescription,
                onRegister: (formData) => handleEventRegistration(eventTitle, formData, eventItem)
            });
        });
    });
    
    // Add calendar integration buttons
    addCalendarIntegration();
}

// ===== EVENT REGISTRATION MODAL =====
function showRegistrationModal(eventData) {
    const modal = createModal({
        title: `Register for ${eventData.title}`,
        size: 'medium',
        onClose: () => closeModal()
    });
    
    modal.innerHTML = `
        <div class="event-registration-modal">
            <div class="event-summary">
                <div class="event-icon">
                    <i class="fas fa-calendar-check"></i>
                </div>
                <div class="event-details">
                    <h4>${eventData.title}</h4>
                    <div class="event-meta">
                        <span><i class="fas fa-calendar"></i> ${eventData.date}</span>
                        <span><i class="fas fa-clock"></i> ${eventData.time}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${eventData.location}</span>
                    </div>
                </div>
            </div>
            
            <form class="registration-form" id="eventRegistrationForm">
                <div class="form-section">
                    <h5>Your Information</h5>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="registrantName">Full Name *</label>
                            <input type="text" id="registrantName" name="name" required 
                                   placeholder="Enter your full name">
                        </div>
                        <div class="form-group">
                            <label for="registrantEmail">Email Address *</label>
                            <input type="email" id="registrantEmail" name="email" required 
                                   placeholder="Enter your email">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="registrantPhone">Phone Number</label>
                            <input type="tel" id="registrantPhone" name="phone" 
                                   placeholder="Optional phone number">
                        </div>
                        <div class="form-group">
                            <label for="registrantRole">Your Role</label>
                            <select id="registrantRole" name="role">
                                <option value="">Select your role</option>
                                <option value="student">Student</option>
                                <option value="volunteer">Volunteer</option>
                                <option value="professional">Professional</option>
                                <option value="community-member">Community Member</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h5>Additional Information</h5>
                    <div class="form-group">
                        <label for="registrantExperience">Relevant Experience</label>
                        <textarea id="registrantExperience" name="experience" rows="3" 
                                  placeholder="Briefly describe any relevant experience or interests..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="registrantQuestions">Questions or Comments</label>
                        <textarea id="registrantQuestions" name="questions" rows="2" 
                                  placeholder="Any questions or additional information..."></textarea>
                    </div>
                </div>
                
                <div class="form-section">
                    <div class="form-check">
                        <input type="checkbox" id="newsletterOptIn" name="newsletter" checked>
                        <label for="newsletterOptIn">
                            Send me updates about future events and opportunities
                        </label>
                    </div>
                    
                    <div class="form-check">
                        <input type="checkbox" id="termsAgreement" name="terms" required>
                        <label for="termsAgreement">
                            I agree to the <a href="#" class="terms-link">event terms and conditions</a> *
                        </label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-user-plus"></i> Register for Event
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Handle form submission
    const form = modal.querySelector('#eventRegistrationForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        // Validate terms agreement
        if (!data.terms) {
            showToast('Please agree to the terms and conditions', 'error');
            return;
        }
        
        eventData.onRegister(data);
    });
    
    document.body.appendChild(modal);
}

// ===== EVENT REGISTRATION HANDLER =====
function handleEventRegistration(eventTitle, formData, eventItem) {
    const submitBtn = document.querySelector('#eventRegistrationForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Store registration in localStorage
        const registration = {
            event: eventTitle,
            ...formData,
            registeredAt: new Date().toISOString(),
            confirmationId: 'REG-' + Date.now()
        };
        
        saveRegistration(registration);
        
        // Show success modal
        showRegistrationSuccess(registration, eventItem);
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
    }, 2000);
}

// ===== REGISTRATION SUCCESS MODAL =====
function showRegistrationSuccess(registration, eventItem) {
    closeModal(); // Close registration modal
    
    const modal = createModal({
        title: 'Registration Successful!',
        size: 'medium',
        onClose: () => closeModal()
    });
    
    modal.innerHTML = `
        <div class="registration-success">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            
            <h4>You're Registered!</h4>
            <p>Thank you <strong>${registration.name}</strong> for registering for:</p>
            
            <div class="registration-details">
                <div class="detail-card">
                    <h5>${registration.event}</h5>
                    <div class="detail-meta">
                        <span><i class="fas fa-calendar"></i> ${getEventDate(eventItem)}</span>
                        <span><i class="fas fa-clock"></i> ${getEventTime(eventItem)}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${getEventLocation(eventItem)}</span>
                    </div>
                </div>
                
                <div class="confirmation-info">
                    <p><strong>Confirmation ID:</strong> ${registration.confirmationId}</p>
                    <p><strong>Registered Email:</strong> ${registration.email}</p>
                </div>
            </div>
            
            <div class="next-steps">
                <h5>What's Next?</h5>
                <ul>
                    <li><i class="fas fa-envelope"></i> Check your email for confirmation</li>
                    <li><i class="fas fa-calendar-plus"></i> Add to your calendar</li>
                    <li><i class="fas fa-clock"></i> Arrive 15 minutes early</li>
                </ul>
            </div>
            
            <div class="success-actions">
                <button class="btn btn-secondary" onclick="addToCalendar('${registration.event}', '${getEventDate(eventItem)}', '${getEventTime(eventItem)}', '${getEventLocation(eventItem)}')">
                    <i class="fas fa-calendar-plus"></i> Add to Calendar
                </button>
                <button class="btn btn-primary" onclick="closeModal()">
                    <i class="fas fa-check"></i> Got It!
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ===== CALENDAR INTEGRATION =====
function addCalendarIntegration() {
    // Add calendar buttons to event items
    document.querySelectorAll('.event-item').forEach(eventItem => {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'event-actions';
        actionsDiv.innerHTML = `
            <button class="btn btn-outline calendar-btn" onclick="addToCalendar(
                '${eventItem.querySelector('h3').textContent}',
                '${getEventDate(eventItem)}',
                '${getEventTime(eventItem)}',
                '${getEventLocation(eventItem)}'
            )">
                <i class="fas fa-calendar-plus"></i> Add to Calendar
            </button>
        `;
        
        const contentDiv = eventItem.querySelector('.event-content');
        const existingBtn = contentDiv.querySelector('.btn');
        if (existingBtn) {
            contentDiv.insertBefore(actionsDiv, existingBtn.nextSibling);
        }
    });
}

function addToCalendar(title, date, time, location) {
    // Create calendar event URL
    const startTime = new Date(`${date} ${time}`).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = new Date(new Date(`${date} ${time}`).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(`Event: ${title}\nLocation: ${location}`)}&location=${encodeURIComponent(location)}`;
    
    window.open(calendarUrl, '_blank');
}

// ===== EVENT DETAILS MODAL =====
function showEventDetails(eventItem) {
    const modal = createModal({
        title: 'Event Details',
        size: 'large',
        onClose: 'closeModal()'
    });
    
    modal.innerHTML = `
        <div class="event-details-modal">
            <div class="event-header">
                <h3>${eventItem.querySelector('h3').textContent}</h3>
                <div class="event-meta-large">
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${getEventDate(eventItem)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${getEventTime(eventItem)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${getEventLocation(eventItem)}</span>
                    </div>
                </div>
            </div>
            
            <div class="event-content-detailed">
                <p>${eventItem.querySelector('p').textContent}</p>
                
                <div class="event-agenda">
                    <h4>Event Agenda</h4>
                    <ul>
                        <li>Registration and Welcome</li>
                        <li>Keynote Presentation</li>
                        <li>Hands-on Workshop</li>
                        <li>Networking Session</li>
                        <li>Closing Remarks</li>
                    </ul>
                </div>
                
                <div class="event-requirements">
                    <h4>What to Bring</h4>
                    <ul>
                        <li>Laptop or tablet (optional)</li>
                        <li>Notebook and pen</li>
                        <li>Open mind and creativity!</li>
                    </ul>
                </div>
            </div>
            
            <div class="event-actions-detailed">
                <button class="btn btn-primary" onclick="closeModal(); showRegistrationModal(${getEventData(eventItem)})">
                    <i class="fas fa-user-plus"></i> Register Now
                </button>
                <button class="btn btn-secondary" onclick="addToCalendar(
                    '${eventItem.querySelector('h3').textContent}',
                    '${getEventDate(eventItem)}',
                    '${getEventTime(eventItem)}',
                    '${getEventLocation(eventItem)}'
                )">
                    <i class="fas fa-calendar-plus"></i> Add to Calendar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ===== HELPER FUNCTIONS =====
function getEventDate(eventItem) {
    const dayElement = eventItem.querySelector('.event-day');
    const monthElement = eventItem.querySelector('.event-month');
    if (!dayElement || !monthElement) return 'Date TBD';
    return dayElement.textContent + ' ' + monthElement.textContent;
}

function getEventTime(eventItem) {
    const timeElement = eventItem.querySelector('.fa-clock');
    if (!timeElement || !timeElement.nextSibling) return 'Time TBD';
    return timeElement.nextSibling.textContent.trim();
}

function getEventLocation(eventItem) {
    const locationElement = eventItem.querySelector('.fa-map-marker-alt');
    if (!locationElement || !locationElement.nextSibling) return 'Location TBD';
    return locationElement.nextSibling.textContent.trim();
}

function getEventData(eventItem) {
    return {
        title: eventItem.querySelector('h3').textContent,
        date: getEventDate(eventItem),
        time: getEventTime(eventItem),
        location: getEventLocation(eventItem),
        description: eventItem.querySelector('p').textContent
    };
}

function saveRegistration(registration) {
    const registrations = JSON.parse(localStorage.getItem('eventRegistrations') || '[]');
    registrations.push(registration);
    localStorage.setItem('eventRegistrations', JSON.stringify(registrations));
}

// ===== UTILITY FUNCTIONS =====
function createModal(options) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal ${options.size || ''}">
            <div class="modal-header">
                <h3>${options.title}</h3>
                <button class="modal-close" onclick="${options.onClose}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-content"></div>
        </div>
    `;
    return modal;
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 300);
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3000);
}

// ===== COMPETITION LINKS FUNCTIONALITY =====
function initializeCompetitionLinks() {
    // Add click handlers for competition resource links
    document.addEventListener('click', function(e) {
        if (e.target.closest('.competition-resource-link')) {
            e.preventDefault();
            const link = e.target.closest('.competition-resource-link');
            const url = link.href;
            window.open(url, '_blank');
        }
    });
}

// ===== ADMIN PANEL FUNCTIONALITY =====
function initializeAdminPanel() {
    // Admin panel toggle
    window.toggleAdmin = function() {
        const panel = document.getElementById('adminPanel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    };
    
    // Add card function
    window.addCard = async function() {
        const title = document.getElementById('cardTitle')?.value;
        const description = document.getElementById('cardDesc')?.value;
        
        if (!title || !description) {
            alert('Please enter both title and description');
            return;
        }
        
        const cardData = {
            title: title,
            description: description,
            createdAt: new Date(),
            status: 'Active'
        };
        
        try {
            if (db) {
                await db.collection("projects").add(cardData);
                showToast('✅ Project added to Firebase!', 'success');
                
                // Clear form
                document.getElementById('cardTitle').value = '';
                document.getElementById('cardDesc').value = '';
                
                // Reload projects
                loadProjects();
            } else {
                showToast('❌ Firebase not available', 'error');
            }
        } catch (error) {
            console.error('Error adding card:', error);
            showToast('❌ Error adding project: ' + error.message, 'error');
        }
    };
}

// ===== MISSING FUNCTIONS THAT YOUR CODE REFERENCES =====
function showRegistrationModal(eventData) {
    // Simple registration modal implementation
    const modal = createModal({
        title: `Register for ${eventData.title}`,
        onClose: 'closeModal()'
    });
    
    modal.querySelector('.modal-content').innerHTML = `
        <div style="padding: 20px; text-align: center;">
            <p>Registration form for: <strong>${eventData.title}</strong></p>
            <p>This feature is coming soon!</p>
            <button class="btn btn-primary" onclick="closeModal()">OK</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function showEventModal(options) {
    const modal = createModal({
        title: options.title,
        onClose: 'closeModal()'
    });
    
    modal.querySelector('.modal-content').innerHTML = `
        <div style="padding: 20px; text-align: center;">
            <p>${options.content}</p>
            <div class="modal-actions">
                ${options.buttons.map(btn => 
                    `<button class="btn ${btn.text === 'OK' ? 'btn-primary' : 'btn-secondary'}" onclick="${btn.action}">${btn.text}</button>`
                ).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ===== LOAD PROJECTS FROM FIREBASE =====
async function loadProjects() {
    try {
        if (typeof firebase === 'undefined' || !db) {
            console.log('Firebase not available, using sample projects');
            return;
        }
        
        const querySnapshot = await db.collection("projects").get();
        const container = document.getElementById('projects-container');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (querySnapshot.empty) {
            container.innerHTML = '<p>No projects yet. Add some through the admin panel!</p>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const project = doc.data();
            const card = `
                <div class="project-card" style="
                    background: white;
                    padding: 20px;
                    margin: 15px 0;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                ">
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                    <small>Added: ${project.createdAt?.toDate().toLocaleDateString() || 'Recently'}</small>
                </div>
            `;
            container.innerHTML += card;
        });
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Innovation Earth Projects initialized');
    
    // Initialize section management first
    if (typeof initializeSectionManagement === 'function') {
        initializeSectionManagement();
    }
    
    // Show home section by default as fallback
    setTimeout(() => {
        const homeSection = document.getElementById('home');
        if (homeSection) {
            homeSection.style.display = 'block';
            homeSection.classList.add('active');
        }
    }, 100);
});
