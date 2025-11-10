// Section Navigation
document.addEventListener('DOMContentLoaded', function() {
    // Show home section by default
    showSection('home');
    
    // Navigation click handlers
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('href').substring(1);
            showSection(targetSection);
            
            // Update active nav link
            document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
            this.classList.add('active');
            
            // Close mobile menu if open
            if (window.innerWidth <= 768) {
                document.getElementById('main-nav').classList.remove('show');
            }
        });
    });
    
    // Quick Links click handlers
    document.querySelectorAll('.quick-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
            
            // Update active nav link
            document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
            document.querySelector(`nav a[href="#${targetId}"]`).classList.add('active');
            
            // Close mobile menu if open
            if (window.innerWidth <= 768) {
                document.getElementById('main-nav').classList.remove('show');
            }
        });
    });
    
    // Rotating Banner Functionality
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    const slideInterval = 5000;
    
    function showSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[n].classList.add('active');
        dots[n].classList.add('active');
        currentSlide = n;
    }
    
    function nextSlide() {
        let next = currentSlide + 1;
        if (next >= slides.length) next = 0;
        showSlide(next);
    }
    
    let slideTimer = setInterval(nextSlide, slideInterval);
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            clearInterval(slideTimer);
            showSlide(index);
            slideTimer = setInterval(nextSlide, slideInterval);
        });
    });
    
    const bannerContainer = document.querySelector('.banner-container');
    bannerContainer.addEventListener('mouseenter', () => clearInterval(slideTimer));
    bannerContainer.addEventListener('mouseleave', () => slideTimer = setInterval(nextSlide, slideInterval));
    
    // Mobile menu functionality
    const mobileMenu = document.getElementById('mobile-menu');
    const mainNav = document.getElementById('main-nav');
    
    mobileMenu.addEventListener('click', function() {
        mainNav.classList.toggle('show');
    });
    
    // Category switching functionality
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            const container = this.closest('.section');
            
            // Update active button
            container.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding category
            container.querySelectorAll('.project-category').forEach(cat => {
                cat.classList.remove('active');
            });
            container.querySelector(`#${category}`).classList.add('active');
        });
    });
    
    // Contact form submission
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
        });
    }
    
    // Initialize competition sections with "Currently None" message
    initializeCompetitionSections();
});

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    document.getElementById(sectionId).classList.add('active');
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function initializeCompetitionSections() {
    // Add "Currently None" message to all competition categories
    const competitionCategories = ['technology', 'sustainability', 'business-plan', 'creative-arts', 'science'];
    
    competitionCategories.forEach(category => {
        const categoryElement = document.getElementById(category);
        if (categoryElement) {
            // Clear existing content
            categoryElement.innerHTML = `
                <h3>${getCategoryTitle(category)}</h3>
                <div class="no-competitions">
                    <i class="fas fa-calendar-times"></i>
                    <p>Currently no active competitions in this category. Check back soon for new challenges!</p>
                </div>
            `;
        }
    });
}

function getCategoryTitle(category) {
    const titles = {
        'technology': 'Technology & Engineering Competitions',
        'sustainability': 'Sustainability & Environment Competitions',
        'business-plan': 'Business & Entrepreneurship Competitions',
        'creative-arts': 'Creative Arts & Design Competitions',
        'science': 'Science & Research Competitions'
    };
    return titles[category] || 'Competitions';
}

// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Add some interactive animations
document.addEventListener('DOMContentLoaded', function() {
    // Add scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.project-card, .role-card, .quick-link').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Handle window resize
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        document.getElementById('main-nav').classList.remove('show');
    }
});