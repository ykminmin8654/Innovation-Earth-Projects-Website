// ===== MAIN SCRIPT FOR INNOVATION EARTH PROJECTS =====
// Complete version with all original functionality and navigation fixes

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
    initializeStatsCounter();
    initializeContactForm();
    initializeSmoothScrolling();
    initializeProjectCards();
    initializeRoleCards();
    initializeEventRegistration();
    animateProgressBars();
    
    console.log('✅ Innovation Earth Projects - All functionality loaded successfully!');
});

// ===== SECTION MANAGEMENT - FIXED CORE FUNCTIONALITY =====
function initializeSectionManagement() {
    console.log('🔧 Initializing section management...');
    
    // Make sure all sections are properly set up
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'block';
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
            void el.offsetWidth; // Trigger reflow
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

    // Competition category tabs
    const competitionTabs = document.querySelectorAll('.category-tab[data-category]');
    competitionTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active tab
            competitionTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected category, hide others
            document.querySelectorAll('.competition-category').forEach(cat => {
                cat.classList.remove('active');
            });
            
            const targetCategory = document.getElementById(category);
            if (targetCategory) {
                targetCategory.classList.add('active');
                populateCompetitionCategory(category);
            }
        });
    });
}

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
    
    // Clear any existing content
    categoryContainer.innerHTML = '';
    
    const sampleCompetitions = getSampleCompetitions(category);
    
    if (sampleCompetitions.length === 0) {
        // Show "no competitions" message for ALL empty categories
        const noCompetitions = document.createElement('div');
        noCompetitions.className = 'no-content-message';
        noCompetitions.innerHTML = `
            <i class="fas fa-calendar-times"></i>
            <h3>No Active Competitions</h3>
            <p>Currently no active competitions in the <strong>${getCategoryDisplayName(category)}</strong> category.</p>
            <p>Check back soon for new challenges and opportunities!</p>
            <button class="btn btn-secondary" style="margin-top: 1rem;">
                <i class="fas fa-bell"></i> Notify Me When Available
            </button>
        `;
        categoryContainer.appendChild(noCompetitions);
        
        // Add click event to notify button
        noCompetitions.querySelector('.btn').addEventListener('click', function() {
            alert(`We'll notify you when new ${getCategoryDisplayName(category)} competitions are available!`);
        });
    } else {
        // Create grid and add competition cards
        const competitionGrid = document.createElement('div');
        competitionGrid.className = 'competition-grid';
        
        sampleCompetitions.forEach(competition => {
            const competitionCard = createCompetitionCard(competition);
            competitionGrid.appendChild(competitionCard);
        });
        
        categoryContainer.appendChild(competitionGrid);
    }
}

function getSampleCompetitions(category) {
    // Return empty array for ALL categories (no active competitions)
    return [];
}

function createCompetitionCard(competition) {
    const card = document.createElement('div');
    card.className = 'competition-card animate-on-scroll';
    card.innerHTML = `
        <div class="competition-content">
            <h3>${competition.title}</h3>
            <p>${competition.description}</p>
            <div class="competition-details">
                <div class="competition-detail">
                    <i class="fas fa-clock"></i>
                    <span>Deadline: ${competition.deadline}</span>
                </div>
                <div class="competition-detail">
                    <i class="fas fa-trophy"></i>
                    <span>Prize: ${competition.prize}</span>
                </div>
                <div class="competition-detail">
                    <i class="fas fa-users"></i>
                    <span>${competition.participants} participants</span>
                </div>
            </div>
            <button class="btn btn-primary" style="margin-top: 1rem;">
                <i class="fas fa-arrow-right"></i> Learn More
            </button>
        </div>
    `;
    
    card.querySelector('.btn').addEventListener('click', function() {
        alert(`Competition: ${competition.title}\n\n${competition.description}\n\nDeadline: ${competition.deadline}\nPrize: ${competition.prize}`);
    });
    
    return card;
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

function addToCalendar(eventTitle, date, time, location) {
    // Create calendar event URL
    const startTime = new Date(`${date} ${time}`).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = new Date(new Date(`${date} ${time}`).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(`Event: ${eventTitle}\nLocation: ${location}`)}&location=${encodeURIComponent(location)}`;
    
    window.open(calendarUrl, '_blank');
}

// ==// ===== EVENT DETAILS MODAL =====
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

function addToCalendar(title, date, time, location) {
    // Simple calendar integration
    alert(`Adding to calendar:\n\nEvent: ${title}\nDate: ${date}\nTime: ${time}\nLocation: ${location}\n\nThis would open your calendar app.`);
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

console.log('✅ Innovation Earth Projects JavaScript loaded successfully!');