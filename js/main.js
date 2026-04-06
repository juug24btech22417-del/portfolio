
// ========================================
// PORTFOLIO MAIN JAVASCRIPT
// GSAP animations, ScrollTrigger, and interactions
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // ========================================
    // SCROLL PROGRESS BAR
    // ========================================
    const scrollProgress = document.querySelector('.scroll-progress');
    if (scrollProgress) {
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            scrollProgress.style.width = `${progress}%`;
        }, { passive: true });
    }

    // ========================================
    // NAVIGATION SCROLL EFFECT
    // ========================================
    const nav = document.getElementById('nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // ========================================
    // HERO ANIMATIONS
    // ========================================

    // Letter flip animation for name
    const nameContainer = document.querySelector('.letter-container');
    const yourName = 'DHRUV';

    if (nameContainer) {
        // Create letter spans
        const letters = yourName.split('');
        letters.forEach((letter, i) => {
            const span = document.createElement('span');
            span.className = 'hero-letter';
            span.textContent = letter === ' ' ? '\u00A0' : letter;
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.style.transform = 'rotateY(90deg)';
            nameContainer.appendChild(span);

            // Animate each letter
            gsap.to(span, {
                opacity: 1,
                rotateY: 0,
                duration: 0.6,
                delay: 0.4 + (i * 0.06),
                ease: 'back.out(1.7)'
            });
        });
    }

    // Typewriter effect for role
    const typewriterText = document.querySelector('.typewriter-text');
    const roleText = 'Full Stack Developer · Product Builder';

    if (typewriterText) {
        let charIndex = 0;
        const typeDelay = 45;
        const startDelay = 1200;

        setTimeout(() => {
            const typeInterval = setInterval(() => {
                if (charIndex < roleText.length) {
                    typewriterText.textContent += roleText.charAt(charIndex);
                    charIndex++;
                } else {
                    clearInterval(typeInterval);
                }
            }, typeDelay);
        }, startDelay);
    }

    // Hero tagline with Variable Proximity effect
    const heroTagline = document.querySelector('.hero-tagline');
    if (heroTagline) {
        const originalText = heroTagline.innerHTML;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = originalText;

        // Wrap each character in spans
        function wrapText(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                const fragment = document.createDocumentFragment();
                for (let char of text) {
                    const span = document.createElement('span');
                    span.className = 'proximity-char';
                    span.textContent = char === ' ' ? '\u00A0' : char;
                    span.style.display = 'inline-block';
                    span.style.transition = 'transform 0.2s ease, opacity 0.2s ease, color 0.2s ease';
                    span.style.opacity = '0.4';
                    span.style.transform = 'scale(0.9)';
                    fragment.appendChild(span);
                }
                return fragment;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const clone = node.cloneNode(false);
                for (let child of node.childNodes) {
                    clone.appendChild(wrapText(child));
                }
                return clone;
            }
            return node;
        }

        // Clear and rebuild with wrapped chars
        heroTagline.innerHTML = '';
        for (let child of tempDiv.childNodes) {
            heroTagline.appendChild(wrapText(child));
        }

        // Proximity effect
        const chars = heroTagline.querySelectorAll('.proximity-char');
        let mouseX = 0;
        let mouseY = 0;
        const radius = 120;

        document.addEventListener('mousemove', (e) => {
            const rect = heroTagline.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;

            chars.forEach(char => {
                const charRect = char.getBoundingClientRect();
                const charX = charRect.left + charRect.width / 2 - rect.left;
                const charY = charRect.top + charRect.height / 2 - rect.top;

                const distance = Math.sqrt((mouseX - charX) ** 2 + (mouseY - charY) ** 2);

                if (distance < radius) {
                    const intensity = 1 - (distance / radius);
                    char.style.opacity = 0.4 + (intensity * 0.6);
                    char.style.transform = `scale(${0.9 + intensity * 0.2}) translateY(${-intensity * 3}px)`;
                    char.style.color = intensity > 0.5 ? '#ffffff' : '';
                } else {
                    char.style.opacity = '0.4';
                    char.style.transform = 'scale(0.9)';
                    char.style.color = '';
                }
            });
        }, { passive: true });

        // Entrance animation
        gsap.from(chars, {
            opacity: 0,
            y: 10,
            duration: 0.4,
            stagger: 0.02,
            delay: 2.0,
            ease: 'power2.out'
        });
    }

    // Hero CTA slide up
    const heroCta = document.querySelector('.hero-cta');
    if (heroCta) {
        gsap.from(heroCta.children, {
            opacity: 0,
            y: 20,
            duration: 0.5,
            stagger: 0.1,
            delay: 2.4,
            ease: 'power2.out'
        });
    }

    // Hero greeting animation
    const heroGreeting = document.querySelector('.hero-greeting');
    if (heroGreeting) {
        gsap.from(heroGreeting, {
            opacity: 0,
            y: 20,
            duration: 0.6,
            delay: 0.1,
            ease: 'power2.out'
        });
    }

    // Hero badge animation
    const heroBadge = document.querySelector('.hero-badge');
    if (heroBadge) {
        gsap.from(heroBadge, {
            opacity: 0,
            y: -10,
            duration: 0.5,
            delay: 0.2,
            ease: 'power2.out'
        });
    }

    // ========================================
    // PROFILE CARD 3D TILT EFFECT
    // ========================================
    const profileCard = document.getElementById('profile-card');
    const profileWrapper = profileCard?.querySelector('.profile-photo-wrapper');

    if (profileCard && profileWrapper) {
        let isHovering = false;
        let currentX = 0;
        let currentY = 0;
        let targetX = 0;
        let targetY = 0;

        profileCard.addEventListener('mouseenter', () => {
            isHovering = true;
            gsap.to(profileWrapper, {
                scale: 1.02,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        profileCard.addEventListener('mouseleave', () => {
            isHovering = false;
            gsap.to(profileWrapper, {
                rotateX: 0,
                rotateY: 0,
                scale: 1,
                duration: 0.5,
                ease: 'power2.out'
            });
        });

        profileCard.addEventListener('mousemove', (e) => {
            const rect = profileCard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Calculate rotation (max 15 degrees)
            targetY = ((x - centerX) / centerX) * 15;
            targetX = -((y - centerY) / centerY) * 15;
        }, { passive: true });

        // Smooth animation loop
        function animateCard() {
            if (isHovering) {
                currentX += (targetX - currentX) * 0.1;
                currentY += (targetY - currentY) * 0.1;
                profileWrapper.style.transform = `rotateX(${currentX}deg) rotateY(${currentY}deg)`;
            }
            requestAnimationFrame(animateCard);
        }
        animateCard();

        // Entrance animation
        gsap.from(profileCard, {
            opacity: 0,
            y: 40,
            rotateX: -20,
            duration: 1,
            delay: 0.8,
            ease: 'power3.out'
        });
    }

    // ========================================
    // SCROLL REVEAL - NAV
    // ========================================
    gsap.from('.nav-container', {
        opacity: 0,
        duration: 0.5,
        delay: 0.1
    });

    // ========================================
    // WORK SECTION ANIMATIONS
    // ========================================

    // Project rows reveal
    const projectRows = document.querySelectorAll('.project-row');
    projectRows.forEach((row, i) => {
        const isLeft = row.dataset.side === 'left';
        const content = row.querySelector('.project-content');
        const visual = row.querySelector('.project-visual');
        const border = row.querySelector('.project-border');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: row,
                start: 'top 80%',
                end: 'top 50%',
                toggleActions: 'play none none reverse'
            }
        });

        // Text slide from appropriate side
        tl.from(content, {
            opacity: 0,
            x: isLeft ? -50 : 50,
            duration: 0.8,
            ease: 'power2.out'
        }, 0);

        // Visual slide from opposite side
        tl.from(visual, {
            opacity: 0,
            x: isLeft ? 50 : -50,
            duration: 0.8,
            ease: 'power2.out'
        }, 0);

        // Border clip-path wipe
        if (border) {
            tl.from(border, {
                scaleX: 0,
                transformOrigin: 'left',
                duration: 0.6,
                ease: 'power2.inOut'
            }, 0.2);
        }
    });

    // Project visual 3D tilt effect
    const browserFrames = document.querySelectorAll('.browser-frame');
    browserFrames.forEach(frame => {
        frame.addEventListener('mousemove', (e) => {
            const rect = frame.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / centerY * -6;
            const rotateY = (x - centerX) / centerX * 6;

            frame.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        frame.addEventListener('mouseleave', () => {
            frame.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        });
    });

    // Project row left border hover
    projectRows.forEach(row => {
        const content = row.querySelector('.project-content');

        row.addEventListener('mouseenter', () => {
            gsap.to(content, {
                borderLeftWidth: 4,
                borderLeftColor: '#E2E8F0',
                paddingLeft: 24,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        row.addEventListener('mouseleave', () => {
            gsap.to(content, {
                borderLeftWidth: 0,
                paddingLeft: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    // ========================================
    // SKILLS SECTION - SOLAR SYSTEM
    // ========================================

    const skillsSection = document.querySelector('.skills');
    const solarSystem = document.querySelector('.solar-system');
    const skillNodes = document.querySelectorAll('.skill-node');
    const skillDetail = document.querySelector('.skill-detail');
    const detailName = document.querySelector('.skill-detail-name');
    const orbitTracks = document.querySelectorAll('.orbit-track');

    if (skillsSection && solarSystem) {
        // Solar system entrance animation
        gsap.from('.sun', {
            scale: 0,
            opacity: 0,
            duration: 1,
            ease: 'back.out(1.7)',
            scrollTrigger: {
                trigger: skillsSection,
                start: 'top 75%',
                toggleActions: 'play none none reverse'
            }
        });

        // Orbit rings fade in with stagger
        gsap.from('.orbit-ring', {
            opacity: 0,
            scale: 0.8,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: skillsSection,
                start: 'top 70%',
                toggleActions: 'play none none reverse'
            }
        });

        // Skill nodes entrance
        gsap.from('.skill-node', {
            opacity: 0,
            scale: 0,
            duration: 0.5,
            stagger: 0.05,
            ease: 'back.out(1.5)',
            scrollTrigger: {
                trigger: skillsSection,
                start: 'top 60%',
                toggleActions: 'play none none reverse'
            }
        });

        // Skill node hover with circular progress
        const progressRing = document.querySelector('.progress-ring-fill');
        const progressText = document.querySelector('.progress-text');
        const ringCircumference = 258; // 2 * PI * 41

        skillNodes.forEach(node => {
            const skillName = node.dataset.skill;
            const skillLevel = parseInt(node.dataset.level);
            const planetIcon = node.querySelector('.node-planet').textContent;

            node.addEventListener('mouseenter', () => {
                orbitTracks.forEach(track => track.style.animationPlayState = 'paused');
                detailName.textContent = skillName;

                // Update icon
                const iconEl = document.querySelector('.skill-detail-icon');
                if (iconEl) iconEl.textContent = planetIcon;

                // Animate circular progress
                const offset = ringCircumference - (skillLevel / 100) * ringCircumference;
                progressRing.style.strokeDashoffset = offset;

                // Animate number
                let current = 0;
                const increment = skillLevel / 20;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= skillLevel) {
                        current = skillLevel;
                        clearInterval(timer);
                    }
                    if (progressText) progressText.innerHTML = Math.floor(current) + '<span>%</span>';
                }, 30);

                skillDetail.classList.add('active');

                // Store timer to clear on leave
                node._progressTimer = timer;
            });

            node.addEventListener('mouseleave', () => {
                orbitTracks.forEach(track => track.style.animationPlayState = 'running');
                skillDetail.classList.remove('active');
                progressRing.style.strokeDashoffset = ringCircumference;
                if (node._progressTimer) clearInterval(node._progressTimer);
            });
        });

        document.addEventListener('click', () => {
            skillDetail.classList.remove('active');
            progressRing.style.strokeDashoffset = ringCircumference;
            orbitTracks.forEach(track => track.style.animationPlayState = 'running');
        });

        // Randomize starting rotation
        orbitTracks.forEach(track => {
            const randomRotation = Math.random() * 360;
            track.style.transform = `rotate(${randomRotation}deg)`;
        });
    }

    // ========================================
    // ABOUT SECTION - Split Reveal + Parallax
    // ========================================

    const aboutSection = document.querySelector('.about');
    if (aboutSection) {
        const aboutPanelLeft = aboutSection.querySelector('.about-panel-left');
        const aboutPanelRight = aboutSection.querySelector('.about-panel-right');
        const parallaxBlocks = aboutSection.querySelectorAll('[data-depth]');

        // Split reveal animation
        gsap.from(aboutPanelLeft, {
            opacity: 0,
            x: -80,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: aboutSection,
                start: 'top 65%',
                toggleActions: 'play none none reverse'
            }
        });

        gsap.from(aboutPanelRight, {
            opacity: 0,
            x: 80,
            duration: 1,
            delay: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: aboutSection,
                start: 'top 65%',
                toggleActions: 'play none none reverse'
            }
        });

        // Floating blocks entrance
        const aboutBlocks = aboutSection.querySelectorAll('.about-block, .stat-float');
        gsap.from(aboutBlocks, {
            opacity: 0,
            y: 30,
            scale: 0.95,
            duration: 0.6,
            stagger: 0.1,
            delay: 0.3,
            ease: 'back.out(1.4)',
            scrollTrigger: {
                trigger: aboutSection,
                start: 'top 60%',
                toggleActions: 'play none none reverse'
            }
        });

        // Parallax mouse effect
        const parallaxContainer = document.getElementById('parallax-container');
        if (parallaxContainer && !window.matchMedia('(pointer: coarse)').matches) {
            aboutSection.addEventListener('mousemove', (e) => {
                const rect = aboutSection.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;

                parallaxBlocks.forEach(block => {
                    const depth = parseFloat(block.dataset.depth) || 0.3;
                    const moveX = x * depth * 30;
                    const moveY = y * depth * 30;
                    block.style.transform = `translate(${moveX}px, ${moveY}px)`;
                });
            });

            aboutSection.addEventListener('mouseleave', () => {
                parallaxBlocks.forEach(block => {
                    block.style.transform = 'translate(0, 0)';
                });
            });
        }

        // Terminal line reveal
        const termLines = aboutSection.querySelectorAll('.term-line, .term-output, .term-code');
        termLines.forEach((line, i) => {
            gsap.from(line, {
                opacity: 0,
                x: -20,
                duration: 0.4,
                delay: 0.5 + (i * 0.1),
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: aboutSection,
                    start: 'top 60%',
                    toggleActions: 'play none none reverse'
                }
            });
        });

        // Stat counter animation
        const statNums = aboutSection.querySelectorAll('.stat-num');
        statNums.forEach(stat => {
            const target = parseInt(stat.dataset.target);
            ScrollTrigger.create({
                trigger: stat,
                start: 'top 80%',
                onEnter: () => {
                    gsap.to(stat, {
                        textContent: target,
                        duration: 1.5,
                        snap: { textContent: 1 },
                        ease: 'power2.out'
                    });
                },
                once: true
            });
        });

        // Stat counter animation
        const statNumbers = aboutSection.querySelectorAll('.stat-number');
        statNumbers.forEach(stat => {
            const target = parseInt(stat.dataset.target);

            ScrollTrigger.create({
                trigger: stat,
                start: 'top 85%',
                onEnter: () => {
                    let current = 0;
                    const increment = target / 30;
                    const counter = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            stat.textContent = target;
                            clearInterval(counter);
                        } else {
                            stat.textContent = Math.floor(current);
                        }
                    }, 30);
                }
            });
        });
    }

    // ========================================
    // EDUCATION SECTION ANIMATIONS
    // ========================================

    const educationSection = document.querySelector('.education');
    if (educationSection) {
        // Timeline line draw
        const timelineProgress = educationSection.querySelector('.timeline-progress');
        if (timelineProgress) {
            gsap.to(timelineProgress, {
                strokeDashoffset: 0,
                ease: 'none',
                scrollTrigger: {
                    trigger: educationSection,
                    start: 'top 70%',
                    end: 'bottom 50%',
                    scrub: true
                }
            });
        }

        // Timeline nodes scale in
        const timelineNodes = educationSection.querySelectorAll('.timeline-node');
        timelineNodes.forEach((node, i) => {
            const content = node.querySelector('.node-content');

            ScrollTrigger.create({
                trigger: node,
                start: 'top 80%',
                onEnter: () => {
                    setTimeout(() => {
                        content.classList.add('visible');
                    }, i * 200);
                }
            });
        });

        // Certifications fade in
        const certPills = educationSection.querySelectorAll('.cert-pill');
        gsap.from(certPills, {
            opacity: 0,
            y: 20,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.certifications',
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        });
    }

    // ========================================
    // CONTACT SECTION ANIMATIONS
    // ========================================

    const contactSection = document.querySelector('.contact');
    if (contactSection) {
        // Word flip animation
        const contactWords = contactSection.querySelectorAll('.contact-word');
        contactWords.forEach((word, i) => {
            word.style.opacity = '0';
            word.style.transform = 'rotateY(90deg)';

            ScrollTrigger.create({
                trigger: contactSection,
                start: 'top 60%',
                onEnter: () => {
                    gsap.to(word, {
                        opacity: 1,
                        rotateY: 0,
                        duration: 0.7,
                        delay: i * 0.15,
                        ease: 'back.out(1.7)'
                    });
                }
            });
        });

        // Contact links slide up
        const contactLinks = contactSection.querySelectorAll('.contact-link');
        gsap.from(contactLinks, {
            opacity: 0,
            y: 30,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.contact-links',
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        });

        // Resume button
        const resumeBtn = contactSection.querySelector('.btn-resume');
        if (resumeBtn) {
            gsap.from(resumeBtn, {
                opacity: 0,
                y: 20,
                duration: 0.5,
                delay: 0.4,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.contact-links',
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            });
        }
    }

    // ========================================
    // CLIPBOARD FUNCTIONALITY
    // ========================================

    const copyBtn = document.getElementById('copy-email');
    const emailLink = document.getElementById('email-link');

    if (copyBtn && emailLink) {
        copyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const email = emailLink.querySelector('span').textContent;

            navigator.clipboard.writeText(email).then(() => {
                // Visual feedback
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                `;

                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    `;
                }, 2000);
            });
        });
    }

    // ========================================
    // SMOOTH SCROLL FOR NAV LINKS
    // ========================================

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Scroll indicator click
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            document.getElementById('work').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    }

    // ========================================
    // SECTION LABEL ANIMATIONS
    // ========================================

    const sectionLabels = document.querySelectorAll('.section-label');
    sectionLabels.forEach(label => {
        gsap.from(label, {
            opacity: 0,
            x: -20,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: label,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    console.log('Portfolio animations initialized');
});
