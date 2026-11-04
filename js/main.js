
// ========================================
// PORTFOLIO MAIN JAVASCRIPT
// GSAP animations, ScrollTrigger, and interactions
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // ========================================
    // PURE SILVER-WHITE DOT & RING CURSOR
    // Active immediately from page load (works on intro screen & throughout site)
    // ========================================
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');

    if (cursorDot && cursorRing && !window.matchMedia('(pointer: coarse)').matches) {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let ringX = mouseX;
        let ringY = mouseY;
        let hasMoved = false;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!hasMoved) {
                hasMoved = true;
                ringX = mouseX;
                ringY = mouseY;
                cursorDot.style.opacity = '1';
                cursorRing.style.opacity = '1';
            }
            cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            cursorDot.style.opacity = '0';
            cursorRing.style.opacity = '0';
        });

        document.addEventListener('mouseenter', () => {
            if (hasMoved) {
                cursorDot.style.opacity = '1';
                cursorRing.style.opacity = '1';
            }
        });

        function renderCursor() {
            ringX += (mouseX - ringX) * 0.18;
            ringY += (mouseY - ringY) * 0.18;
            cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
            requestAnimationFrame(renderCursor);
        }
        renderCursor();
    }

    // ========================================
    // WAIT FOR INTRO
    // ========================================
    // The intro splash runs on its own timeline. If we initialize
    // entrance animations here on DOMContentLoaded, they'll fire
    // invisibly behind the splash and the user will see the
    // portfolio "snap" into place when the splash lifts. Instead,
    // we wait for window.__waitForIntro (provided by js/intro.js)
    // to fire its callback once the splash exit starts.
    function initPortfolio() {

    // ========================================
    // SMOOTH SCROLLING ENGINE (LENIS)
    // ========================================
    let lenis = null;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 0.95,
            touchMultiplier: 1.6
        });

        lenis.on('scroll', (e) => {
            ScrollTrigger.update();
            if (window.__spaceBg && typeof window.__spaceBg.setWarpVelocity === 'function') {
                window.__spaceBg.setWarpVelocity(Math.abs(e.velocity || 0) * 0.05);
            }
        });

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
        window.lenis = lenis;
    }

    // ========================================
    // SCI-FI MISSION TELEMETRY HUD
    // ========================================
    const hudSector = document.getElementById('hud-sector');
    const hudTelemetryVal = document.getElementById('hud-telemetry-val');

    const telemetrySectors = [
        { id: 'hero', name: '01 // HOME' },
        { id: 'work', name: '02 // SELECTED WORK' },
        { id: 'skills', name: '03 // EXPERTISE' },
        { id: 'about', name: '04 // PROFILE' },
        { id: 'education', name: '05 // TIMELINE' },
        { id: 'contact', name: '06 // CONTACT' }
    ];

    window.addEventListener('scroll', () => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? window.scrollY / docHeight : 0;

        if (hudSector) {
            const scrollMid = window.scrollY + window.innerHeight * 0.4;
            for (let sec of telemetrySectors) {
                const el = document.getElementById(sec.id);
                if (el) {
                    const top = el.offsetTop;
                    const bottom = top + el.offsetHeight;
                    if (scrollMid >= top && scrollMid < bottom) {
                        hudSector.textContent = sec.name;
                        break;
                    }
                }
            }
        }

        if (hudTelemetryVal) {
            const vel = window.lenis ? (Math.abs(window.lenis.velocity || 0) * 0.08) : 0;
            const alt = Math.max(12, Math.round(400 - progress * 375));
            hudTelemetryVal.textContent = `VEL ${vel.toFixed(1)} KM/S · ALT ${alt} KM`;
        }

        syncNavHeroMode();
    }, { passive: true });

    // Applied immediately as well: on refresh the nav must already be in its
    // hero state, without waiting for a scroll or for the intro callback.
    function syncNavHeroMode() {
        const navForHero = document.getElementById('nav');
        if (!navForHero) return;
        // dark ink for as long as the light hero is still behind the bar
        const heroEl = document.getElementById('hero');
        const limit = heroEl ? heroEl.offsetTop + heroEl.offsetHeight - 80 : window.innerHeight;
        navForHero.classList.toggle('hero-light-mode', window.scrollY < limit);
    }
    syncNavHeroMode();

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
    // EDITORIAL REEL HERO & SCROLLYTELLING (light → dark)
    // ========================================
    const heroSection = document.getElementById('hero');
    const heroPinnedWrap = document.getElementById('hero-pinned-wrap');
    const heroLightBackdrop = document.getElementById('hero-light-backdrop');
    const heroBacklight = document.getElementById('hero-backlight');
    const heroTextLayer = document.getElementById('hero-text-layer');
    const heroLineTop = document.getElementById('hero-line-top');
    const heroLineBottom = document.getElementById('hero-line-bottom');
    const heroPortraitLayer = document.getElementById('hero-portrait-layer');
    const heroPortraitImg = document.getElementById('hero-portrait-img');
    const heroEditorialLeft = document.getElementById('hero-editorial-left');
    const heroEditorialRight = document.getElementById('hero-editorial-right');
    const navEl = document.getElementById('nav');

    if (heroSection && heroPinnedWrap) {
        // --- 1. Entrance Animation (light editorial reveal) ---
        function runHeroEntrance() {
            const entranceTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            // Start in light mode — nav gets dark text
            if (navEl) navEl.classList.add('hero-light-mode');

            // Initial states
            if (heroLineTop)    gsap.set(heroLineTop,    { opacity: 0, y: 40, scale: 0.97 });
            if (heroLineBottom) gsap.set(heroLineBottom, { opacity: 0, y: 60, scale: 0.97 });
            if (heroPortraitLayer) gsap.set(heroPortraitLayer, { opacity: 0, y: 50, scale: 0.96 });
            if (heroBacklight)  gsap.set(heroBacklight,  { opacity: 1, scale: 1 });
            gsap.set([heroEditorialLeft, heroEditorialRight].filter(Boolean), { opacity: 0, y: 18 });

            entranceTl
                .to(heroLineTop, { opacity: 0.92, y: 0, scale: 1, duration: 1.1 }, 0.05)
                .to(heroLineBottom, { opacity: 1, y: 0, scale: 1, duration: 1.2 }, 0.18)
                .to(heroPortraitLayer, { opacity: 1, y: 0, scale: 1, duration: 1.3 }, 0.3)
                .to([heroEditorialLeft, heroEditorialRight].filter(Boolean), {
                    opacity: 1, y: 0, duration: 0.8, stagger: 0.1
                }, 0.75);
        }

        if (typeof window.__waitForIntro === 'function' && document.body.classList.contains('intro-active')) {
            window.__waitForIntro(() => { runHeroEntrance(); });
        } else {
            runHeroEntrance();
        }

        // --- 3. Interactive Mouse Parallax (Desktop only) ---
        if (window.matchMedia('(pointer: fine)').matches) {
            let pTargetX = 0, pTargetY = 0;
            let pCurrentX = 0, pCurrentY = 0;
            let isHoveringHero = false;

            heroPinnedWrap.addEventListener('mouseenter', () => { isHoveringHero = true; });
            heroPinnedWrap.addEventListener('mouseleave', () => {
                isHoveringHero = false;
                pTargetX = 0; pTargetY = 0;
            });

            window.addEventListener('mousemove', (e) => {
                if (!isHoveringHero) return;
                const cx = window.innerWidth / 2;
                const cy = window.innerHeight / 2;
                pTargetX = (e.clientX - cx) / cx;
                pTargetY = (e.clientY - cy) / cy;
            }, { passive: true });

            function renderHeroParallax() {
                if (isHoveringHero || Math.abs(pCurrentX - pTargetX) > 0.001 || Math.abs(pCurrentY - pTargetY) > 0.001) {
                    pCurrentX += (pTargetX - pCurrentX) * 0.08;
                    pCurrentY += (pTargetY - pCurrentY) * 0.08;

                    if (heroBacklight)
                        heroBacklight.style.transform = `translate(calc(-50% + ${pCurrentX * -22}px), calc(-50% + ${pCurrentY * -16}px))`;
                    if (heroTextLayer)
                        heroTextLayer.style.transform = `translate3d(${pCurrentX * 12}px, ${pCurrentY * 8}px, 0)`;
                    if (heroPortraitImg)
                        heroPortraitImg.style.transform = `translate3d(${pCurrentX * -20}px, ${pCurrentY * -12}px, 0) rotateY(${pCurrentX * 2.5}deg)`;
                }
                requestAnimationFrame(renderHeroParallax);
            }
            renderHeroParallax();
        }
    }

    // ========================================
    // ABOUT CARD — SCROLLYTELLING EXPANSION
    // A small rounded card opens left and right into the framed about card.
    // ========================================
    const aboutCardSection = document.getElementById('about-card');
    const aboutCardFrame = document.getElementById('hero-reveal-content');
    const aboutCardIntro = document.querySelector('.hero-card-intro');

    if (aboutCardSection && aboutCardFrame) {
        gsap.timeline({
            scrollTrigger: {
                trigger: aboutCardSection,
                start: 'top top',
                // function form: ScrollTrigger re-evaluates on refresh, so a
                // phone gets a shorter pin than a desktop screen
                end: () => '+=' + Math.round(window.innerHeight * (window.innerWidth <= 768 ? 1.15 : 1.6)),
                scrub: 1,
                pin: '.about-card-stage',
                pinSpacing: true,
                anticipatePin: 1
            }
        })
            // Stage 1 — the closed card widens left and right into the frame
            .to(aboutCardFrame, {
                '--reveal-t': '0%',
                '--reveal-r': '0%',
                '--reveal-b': '0%',
                '--reveal-l': '0%',
                '--reveal-round': '0px',
                duration: 0.45,
                ease: 'power2.inOut'
            }, 0.08)
            // Stage 2 — ABOUT peels off to the left, ME to the right
            .to('.hero-card-intro span:first-child', {
                xPercent: -120,
                opacity: 0,
                duration: 0.24,
                ease: 'power2.in'
            }, 0.14)
            .to('.hero-card-intro span:last-child', {
                xPercent: 120,
                opacity: 0,
                duration: 0.24,
                ease: 'power2.in'
            }, 0.14)
            // the wordmark's veil clears once both words have left
            .to(aboutCardIntro, {
                opacity: 0,
                duration: 0.10,
                ease: 'power1.out'
            }, 0.40)
            // Stage 3 — wording surfaces inside the open frame, still pinned
            .to('.about-card-section .hero-card-reveal', {
                opacity: 1,
                y: 0,
                duration: 0.28,
                stagger: 0.03,
                ease: 'power2.out'
            }, 0.50);
    }

    // ========================================
    // PIN RE-MEASURE (mobile toolbars + late fonts)
    // iOS collapses its toolbar and the display fonts arrive after
    // first paint, both of which move the pinned stage. Refresh so the
    // card stays centred through the whole expansion.
    // ========================================
    if (typeof ScrollTrigger !== 'undefined') {
        const refreshPins = () => ScrollTrigger.refresh();
        window.addEventListener('load', refreshPins);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(refreshPins).catch(() => {});
        }
        let resizeTimer = 0;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(refreshPins, 200);
        });
    }

    // ========================================
    // MOBILE MENU
    // ========================================
    const navToggle = document.getElementById('nav-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const navBar = document.getElementById('nav');

    if (navToggle && mobileMenu) {
        const setMenu = (open) => {
            mobileMenu.classList.toggle('is-open', open);
            navToggle.classList.toggle('is-open', open);
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
            document.body.classList.toggle('menu-open', open);
            if (navBar) navBar.classList.toggle('is-menu-open', open);
            // Lenis drives the page scroll, so lock it explicitly
            if (window.lenis) {
                if (open) window.lenis.stop();
                else window.lenis.start();
            }
        };

        navToggle.addEventListener('click', () => {
            setMenu(!mobileMenu.classList.contains('is-open'));
        });

        mobileMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => setMenu(false));
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) setMenu(false);
        });

        // Leaving the mobile breakpoint must never strand the panel open
        const wide = window.matchMedia('(min-width: 769px)');
        const onWide = (e) => { if (e.matches) setMenu(false); };
        if (wide.addEventListener) wide.addEventListener('change', onWide);
        else if (wide.addListener) wide.addListener(onWide);
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
    // APPLE-STYLE SCRUBBED TEXT ILLUMINATION
    // ========================================
    const scrubTexts = document.querySelectorAll('.scrub-text');
    scrubTexts.forEach(el => {
        const text = el.textContent.trim();
        const words = text.split(/\s+/);
        el.innerHTML = words.map(w => `<span class="scrub-word">${w}&nbsp;</span>`).join('');

        const wordSpans = el.querySelectorAll('.scrub-word');
        gsap.fromTo(wordSpans, 
            { opacity: 0.18, filter: 'blur(1.5px)', color: '#475569' },
            {
                opacity: 1,
                filter: 'blur(0px)',
                color: '#FFFFFF',
                textShadow: '0 0 16px rgba(255,255,255,0.7)',
                stagger: 0.05,
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    end: 'bottom 55%',
                    scrub: 0.8
                }
            }
        );
    });

    // ========================================
    // WORK SECTION - SYNCHRONIZED SCROLLYTELLING DECK
    // ========================================
    const pinnedWorkWrap = document.getElementById('work-pinned-wrap');
    if (pinnedWorkWrap) {
        const infoCards = pinnedWorkWrap.querySelectorAll('.deck-info-card');
        const holoCards = pinnedWorkWrap.querySelectorAll('.holo-card');
        const dotBtns = document.querySelectorAll('.deck-dot');
        const halo = document.getElementById('deck-halo');
        const counterCurrent = document.getElementById('deck-counter-current');
        const scrubProgress = document.getElementById('deck-scrub-progress');
        const total = holoCards.length;

        // Pull per-card accent colors from data-accent
        const projectAccents = Array.from(holoCards).map(card => {
            const bar = card.querySelector('.card-accent-bar');
            return bar ? bar.dataset.accent : '#8B9FD4';
        });

        holoCards.forEach(card => {
            const bar = card.querySelector('.card-accent-bar');
            if (bar) bar.style.color = bar.dataset.accent;
        });

        // Set initial visual states for all elements
        infoCards.forEach((card, i) => {
            if (i === 0) {
                gsap.set(card, { opacity: 1, y: 0, pointerEvents: 'auto' });
            } else {
                gsap.set(card, { opacity: 0, y: 30, pointerEvents: 'none' });
            }
        });

        holoCards.forEach((card, i) => {
            if (i === 0) {
                gsap.set(card, {
                    x: 0, y: 0, z: 0,
                    rotateY: 0, rotateX: 0,
                    opacity: 1, scale: 1,
                    pointerEvents: 'auto'
                });
            } else {
                gsap.set(card, {
                    x: 40, y: 60, z: -200,
                    rotateY: -12, rotateX: -6,
                    opacity: 0, scale: 0.92,
                    pointerEvents: 'none'
                });
            }
        });

        // Build Master Timeline with Guaranteed Rest Plateaus:
        // Each transition takes 1.0s, each hold/plateau takes 0.8s
        // This ensures the user can read each project without slipping,
        // and reverse scrub preserves 100% lockstep alignment!
        const HOLD_DURATION = 0.8;
        const TRANS_DURATION = 1.0;
        const totalDuration = (total - 1) * (HOLD_DURATION + TRANS_DURATION) + HOLD_DURATION + 0.2;

        // Dynamic transition midpoints normalized to [0, 1]
        const transitionMidpoints = [];
        for (let i = 0; i < total - 1; i++) {
            const tMid = (i + 1) * HOLD_DURATION + i * TRANS_DURATION + (TRANS_DURATION / 2);
            transitionMidpoints.push(tMid / totalDuration);
        }

        // Project plateau centers normalized to [0, 1] for instant dot-nav jumping
        const projectPlateauProgress = [];
        for (let i = 0; i < total; i++) {
            const tCenter = i * (HOLD_DURATION + TRANS_DURATION) + (HOLD_DURATION / 2);
            projectPlateauProgress.push(tCenter / totalDuration);
        }

        const workDeckTl = gsap.timeline({
            scrollTrigger: {
                trigger: pinnedWorkWrap,
                pin: true,
                scrub: 0.8,
                start: 'top top',
                end: `+=${total * 120}%`,
                anticipatePin: 1,
                onUpdate: (self) => {
                    const p = self.progress;

                    // Progress bar scrub width
                    if (scrubProgress) {
                        scrubProgress.style.width = `${Math.min(100, Math.max(5, p * 100))}%`;
                    }

                    // Accurate active index based on dynamic timeline transition midpoints
                    let activeIdx = 0;
                    for (let i = 0; i < transitionMidpoints.length; i++) {
                        if (p >= transitionMidpoints[i]) {
                            activeIdx = i + 1;
                        }
                    }

                    syncActiveState(activeIdx);
                }
            }
        });

        let currentActiveIdx = -1;
        function syncActiveState(idx) {
            if (idx === currentActiveIdx) return;
            currentActiveIdx = idx;

            // Update dot indicators
            dotBtns.forEach((dot, i) => dot.classList.toggle('is-active', i === idx));

            // Update project counter (01 / 06)
            if (counterCurrent) {
                counterCurrent.textContent = String(idx + 1).padStart(2, '0');
            }
            const counterTotal = document.querySelector('.deck-counter-total');
            if (counterTotal) {
                counterTotal.textContent = String(total).padStart(2, '0');
            }

            // Update ambient halo glow
            if (halo) {
                halo.style.setProperty('--halo-accent', projectAccents[idx] || '#8B9FD4');
            }

            // Pointer events toggle so clicks always hit the active card
            infoCards.forEach((c, i) => c.style.pointerEvents = (i === idx ? 'auto' : 'none'));
            holoCards.forEach((c, i) => c.style.pointerEvents = (i === idx ? 'auto' : 'none'));
        }

        // Populate master timeline with synced transitions
        let cursorTime = HOLD_DURATION; // Initial hold on Project 0

        for (let i = 0; i < total - 1; i++) {
            const nextIdx = i + 1;
            const tStart = cursorTime;

            // 1. Current Info card floats up and fades
            workDeckTl.to(infoCards[i], {
                y: -24,
                opacity: 0,
                duration: TRANS_DURATION * 0.85,
                ease: 'power2.inOut'
            }, tStart);

            // 2. Current Holo card drifts away in 3D perspective
            workDeckTl.to(holoCards[i], {
                x: -36,
                y: -44,
                z: -240,
                rotateY: 14,
                rotateX: 6,
                opacity: 0,
                scale: 0.88,
                duration: TRANS_DURATION,
                ease: 'power2.inOut'
            }, tStart);

            // 3. Next Info card rises from bottom
            workDeckTl.to(infoCards[nextIdx], {
                y: 0,
                opacity: 1,
                duration: TRANS_DURATION * 0.85,
                ease: 'power2.inOut'
            }, tStart + 0.15);

            // 4. Next Holo card arrives from depth into crisp focus
            workDeckTl.to(holoCards[nextIdx], {
                x: 0,
                y: 0,
                z: 0,
                rotateY: 0,
                rotateX: 0,
                opacity: 1,
                scale: 1,
                duration: TRANS_DURATION,
                ease: 'power2.inOut'
            }, tStart + 0.1);

            // Hold on the incoming project
            cursorTime += TRANS_DURATION + HOLD_DURATION;
        }

        // Add small final cushion so last card stays solidly locked
        workDeckTl.to({}, { duration: 0.2 });

        // Initialize state
        syncActiveState(0);

        // Dot button click → scroll to project rest center
        dotBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const pIdx = parseInt(btn.dataset.project || '0');
                const st = workDeckTl.scrollTrigger;
                if (!st) return;
                const targetScroll = st.start + (st.end - st.start) * (projectPlateauProgress[pIdx] || 0);
                if (window.lenis) {
                    window.lenis.scrollTo(targetScroll, { duration: 1.2 });
                } else {
                    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
                }
            });
        });

        // Interactive 3D Holographic Tilt + Specular Sheen on hover
        holoCards.forEach(card => {
            const inner = card.querySelector('.holo-card-inner');
            const media = card.querySelector('.holo-card-media');

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rx = ((y - rect.height / 2) / rect.height) * -8;
                const ry = ((x - rect.width / 2) / rect.width) * 8;

                card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02, 1.02, 1.02)`;

                // Dynamic specular light reflection
                if (inner) {
                    const px = (x / rect.width) * 100;
                    const py = (y / rect.height) * 100;
                    inner.style.backgroundImage = `radial-gradient(circle at ${px}% ${py}%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 60%)`;
                }
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                if (inner) inner.style.backgroundImage = '';
            });
        });
    }


    // ========================================
    // SKILLS SECTION - PINNED ORBITAL SCRUB
    // ========================================
    const skillsWrap = document.getElementById('skills-pinned-wrap');
    const skillsSection = document.querySelector('.skills');
    const solarSystem = document.querySelector('.solar-system');
    const skillNodes = document.querySelectorAll('.skill-node');
    const skillDetail = document.querySelector('.skill-detail');
    const detailName = document.querySelector('.skill-detail-name');
    const orbitTracks = document.querySelectorAll('.orbit-track');
    const phaseSteps = document.querySelectorAll('.skills-phase-step');

    if (skillsWrap) {
        const sun = skillsWrap.querySelector('.sun');
        const innerRing = skillsWrap.querySelector('.orbit-inner');
        const midRing = skillsWrap.querySelector('.orbit-middle');
        const outerRing = skillsWrap.querySelector('.orbit-outer');

        // Helper: update which phase step is active
        function setPhaseStep(idx) {
            phaseSteps.forEach((step, i) => step.classList.toggle('is-active', i === idx));
        }

        // Pinned scrollytelling timeline for skills
        const skillsTl = gsap.timeline({
            scrollTrigger: {
                trigger: skillsWrap,
                pin: true,
                scrub: 0.8,
                start: 'top top',
                end: '+=180%',
                anticipatePin: 1,
                onUpdate: (self) => {
                    const p = self.progress;
                    if (p < 0.35) setPhaseStep(0);
                    else if (p < 0.70) setPhaseStep(1);
                    else setPhaseStep(2);
                }
            }
        });

        // Sun & Inner Ring
        skillsTl.fromTo(sun,
            { scale: 0.4, opacity: 0.3 },
            { scale: 1.15, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, 0
        );
        skillsTl.fromTo(innerRing,
            { scale: 0.5, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.4)' }, 0.1
        );

        // Middle Ring
        skillsTl.fromTo(midRing,
            { scale: 0.6, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.4)' }, 0.4
        );

        // Outer Ring
        skillsTl.fromTo(outerRing,
            { scale: 0.7, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.4)' }, 0.8
        );

        // Skill node hover with circular progress
        const progressRing = document.querySelector('.progress-ring-fill');
        const progressText = document.querySelector('.progress-text');
        const ringCircumference = 258; // 2 * PI * 41

        // Track active node for mobile
        let activeNode = null;

        skillNodes.forEach(node => {
            const skillName = node.dataset.skill;
            const skillLevel = parseInt(node.dataset.level);
            const planetIcon = node.querySelector('.node-planet').textContent;

            const showSkillDetail = (e) => {
                e.stopPropagation();
                activeNode = node;

                orbitTracks.forEach(track => track.style.animationPlayState = 'paused');
                detailName.textContent = skillName;

                // Update icon
                const iconEl = document.querySelector('.skill-detail-icon');
                if (iconEl) iconEl.textContent = planetIcon;

                // Animate circular progress
                const offset = ringCircumference - (skillLevel / 100) * ringCircumference;
                progressRing.style.strokeDashoffset = offset;

                // Animate number
                if (progressText) progressText.innerHTML = '0<span>%</span>';
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
            };

            const hideSkillDetail = () => {
                activeNode = null;
                orbitTracks.forEach(track => track.style.animationPlayState = 'running');
                skillDetail.classList.remove('active');
                progressRing.style.strokeDashoffset = ringCircumference;
                if (node._progressTimer) clearInterval(node._progressTimer);
            };

            // Desktop hover
            node.addEventListener('mouseenter', showSkillDetail);
            node.addEventListener('mouseleave', hideSkillDetail);

            // Mobile touch
            node.addEventListener('touchstart', showSkillDetail, { passive: true });

            // Click for both desktop and mobile
            node.addEventListener('click', (e) => {
                e.stopPropagation();
                if (activeNode === node) {
                    // Toggle off if clicking same node
                    hideSkillDetail();
                } else {
                    showSkillDetail(e);
                }
            });
        });

        // Close when clicking outside
        document.addEventListener('click', () => {
            if (activeNode) {
                activeNode = null;
                skillDetail.classList.remove('active');
                progressRing.style.strokeDashoffset = ringCircumference;
                orbitTracks.forEach(track => track.style.animationPlayState = 'running');
            }
        });

        // Prevent closing when clicking detail card itself
        skillDetail.addEventListener('click', (e) => e.stopPropagation());

        // Randomize starting rotation
        orbitTracks.forEach(track => {
            const randomRotation = Math.random() * 360;
            track.style.transform = `rotate(${randomRotation}deg)`;
        });
    }

    // ========================================
    // ABOUT SECTION - PINNED SCROLLYTELLING + 3D WARP ENTRANCE + SCROLL-TYPED TERMINAL
    // ========================================

    const aboutPinnedWrap = document.getElementById('about-pinned-wrap');
    const aboutSection    = document.querySelector('.about');

    if (aboutPinnedWrap && aboutSection) {
        const aboutPanelLeft  = aboutPinnedWrap.querySelector('.about-panel-left');
        const aboutPanelRight = aboutPinnedWrap.querySelector('.about-panel-right');
        const sparkEl         = document.getElementById('about-dock-spark');
        const sparkCore       = sparkEl ? sparkEl.querySelector('.spark-core') : null;
        const sparkBeamH      = sparkEl ? sparkEl.querySelector('.spark-beam-h') : null;
        const sparkBeamV      = sparkEl ? sparkEl.querySelector('.spark-beam-v') : null;
        const sparkRings      = sparkEl ? sparkEl.querySelectorAll('.spark-ring') : [];
        const bioBlocks       = aboutPinnedWrap.querySelectorAll('.about-block');
        const statCards       = aboutPinnedWrap.querySelectorAll('.stat-float');
        const terminalBody    = document.getElementById('about-terminal-body');

        // ---- 1. BUILD TERMINAL DOM ----
        if (terminalBody) {
            terminalBody.innerHTML = `
                <!-- CMD 1 -->
                <div class="term-row term-cmd-row" id="term-cmd-1">
                    <span class="term-prompt">~</span>
                    <span class="term-cmd">
                        <span class="term-char">w</span><span class="term-char">h</span><span class="term-char">o</span><span class="term-char">a</span><span class="term-char">m</span><span class="term-char">i</span>
                    </span>
                    <span class="term-cursor" id="term-cur-1">█</span>
                </div>
                <div class="term-row term-output-row" id="term-out-1">
                    <div class="term-output-text">
                        <span class="term-badge-tag">[IDENTITY]</span>
                        <span class="term-highlight">dhruv</span> — full-stack developer & product builder
                    </div>
                </div>

                <!-- CMD 2 -->
                <div class="term-row term-cmd-row" id="term-cmd-2">
                    <span class="term-prompt">~</span>
                    <span class="term-cmd">
                        <span class="term-char">c</span><span class="term-char">a</span><span class="term-char">t</span><span class="term-char">&nbsp;</span><span class="term-char">s</span><span class="term-char">t</span><span class="term-char">a</span><span class="term-char">c</span><span class="term-char">k</span><span class="term-char">.</span><span class="term-char">j</span><span class="term-char">s</span><span class="term-char">o</span><span class="term-char">n</span>
                    </span>
                    <span class="term-cursor" id="term-cur-2">█</span>
                </div>
                <div class="term-row term-output-row" id="term-out-2">
                    <pre class="term-code-block">{
  <span class="code-key">"frontend"</span>: [<span class="code-str">"React"</span>, <span class="code-str">"Next.js"</span>, <span class="code-str">"TypeScript"</span>],
  <span class="code-key">"backend"</span>:  [<span class="code-str">"Node.js"</span>, <span class="code-str">"Python"</span>, <span class="code-str">"PostgreSQL"</span>],
  <span class="code-key">"tools"</span>:    [<span class="code-str">"Git"</span>, <span class="code-str">"Docker"</span>, <span class="code-str">"AWS"</span>]
}</pre>
                </div>

                <!-- CMD 3 -->
                <div class="term-row term-cmd-row" id="term-cmd-3">
                    <span class="term-prompt">~</span>
                    <span class="term-cmd">
                        <span class="term-char">c</span><span class="term-char">a</span><span class="term-char">t</span><span class="term-char">&nbsp;</span><span class="term-char">s</span><span class="term-char">t</span><span class="term-char">a</span><span class="term-char">t</span><span class="term-char">u</span><span class="term-char">s</span><span class="term-char">.</span><span class="term-char">t</span><span class="term-char">x</span><span class="term-char">t</span>
                    </span>
                    <span class="term-cursor" id="term-cur-3">█</span>
                </div>
                <div class="term-row term-output-row" id="term-out-3">
                    <div class="term-output-status">
                        <span class="term-radar-pulse"></span>
                        <span class="term-status-text">actively seeking opportunities</span>
                    </div>
                </div>

                <!-- IDLE BLINK CURSOR -->
                <div class="term-row term-idle-row" id="term-idle">
                    <span class="term-prompt">~</span>
                    <span class="term-cursor term-blink-cursor">█</span>
                </div>
            `;
        }

        const cmd1 = document.getElementById('term-cmd-1');
        const out1 = document.getElementById('term-out-1');
        const cur1 = document.getElementById('term-cur-1');
        const cmd1Chars = cmd1 ? cmd1.querySelectorAll('.term-char') : [];

        const cmd2 = document.getElementById('term-cmd-2');
        const out2 = document.getElementById('term-out-2');
        const cur2 = document.getElementById('term-cur-2');
        const cmd2Chars = cmd2 ? cmd2.querySelectorAll('.term-char') : [];

        const cmd3 = document.getElementById('term-cmd-3');
        const out3 = document.getElementById('term-out-3');
        const cur3 = document.getElementById('term-cur-3');
        const cmd3Chars = cmd3 ? cmd3.querySelectorAll('.term-char') : [];

        const termIdle = document.getElementById('term-idle');

        const isMobile = window.innerWidth <= 900;

        // ---- 2. INITIAL HIDDEN STATES ----
        if (isMobile) {
            gsap.set(aboutPanelLeft, {
                opacity: 0,
                y: 28,
                scale: 0.96,
                filter: 'blur(4px)'
            });
            gsap.set(aboutPanelRight, {
                opacity: 0,
                y: 28,
                scale: 0.96,
                filter: 'blur(4px)'
            });
        } else {
            gsap.set(aboutPanelLeft, {
                opacity: 0,
                x: -160,
                z: -140,
                rotateY: -22,
                rotateX: 6,
                scale: 0.86,
                filter: 'blur(10px)',
                transformPerspective: 1400
            });
            gsap.set(aboutPanelRight, {
                opacity: 0,
                x: 160,
                z: -140,
                rotateY: 22,
                rotateX: -6,
                scale: 0.86,
                filter: 'blur(10px)',
                transformPerspective: 1400
            });
        }

        gsap.set(bioBlocks, {
            opacity: 0,
            y: 40,
            scale: 0.92
        });

        gsap.set(statCards, {
            opacity: 0,
            scale: 0.6,
            y: -24
        });

        if (sparkEl) gsap.set(sparkEl, { opacity: 0 });
        if (sparkCore) gsap.set(sparkCore, { scale: 0, opacity: 0 });
        if (sparkBeamH) gsap.set(sparkBeamH, { scaleX: 0, opacity: 0 });
        if (sparkBeamV) gsap.set(sparkBeamV, { scaleY: 0, opacity: 0 });
        if (sparkRings.length) gsap.set(sparkRings, { scale: 0, opacity: 0 });

        gsap.set([cmd1, out1, cmd2, out2, cmd3, out3, termIdle], { opacity: 0, display: 'none' });
        gsap.set([...cmd1Chars, ...cmd2Chars, ...cmd3Chars], { display: 'none', opacity: 0 });
        if (cur1) gsap.set(cur1, { display: 'none' });
        if (cur2) gsap.set(cur2, { display: 'none' });
        if (cur3) gsap.set(cur3, { display: 'none' });

        // Target stats: Projects: 15+, Hackathons: 10+, Years: 3
        const statProjectsEl = aboutPinnedWrap.querySelector('.stat-float:nth-child(1) .stat-num');
        const statHacksEl    = aboutPinnedWrap.querySelector('.stat-float:nth-child(2) .stat-num');
        const statYearsEl    = aboutPinnedWrap.querySelector('.stat-float:nth-child(3) .stat-num');
        const statProxy = { projects: 0, hacks: 0, years: 0 };

        // ---- 3. SCROLLYTELLING TIMELINE (Pinned on desktop, scrubbed on mobile) ----
        const aboutTl = gsap.timeline({
            scrollTrigger: {
                trigger: aboutPinnedWrap,
                pin: !isMobile,
                scrub: isMobile ? 0.3 : 0.7,
                start: isMobile ? 'top 85%' : 'top top',
                end: isMobile ? 'bottom 15%' : '+=1600',
                anticipatePin: 1,
                invalidateOnRefresh: true
            }
        });

        // 3A. 3D Warp Flight of both panels colliding into center
        aboutTl.to(aboutPanelLeft, {
            opacity: 1,
            x: 0,
            y: 0,
            z: 0,
            rotateY: 0,
            rotateX: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.8,
            ease: 'power3.out'
        }, 0);

        aboutTl.to(aboutPanelRight, {
            opacity: 1,
            x: 0,
            y: 0,
            z: 0,
            rotateY: 0,
            rotateX: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.8,
            ease: 'power3.out'
        }, 0);

        // 3B. Docking Spark Collision Shockwave
        if (sparkEl) {
            aboutTl.set(sparkEl, { opacity: 1 }, 0.65);
            if (sparkCore) {
                aboutTl.fromTo(sparkCore,
                    { scale: 0, opacity: 1 },
                    { scale: 2.6, opacity: 0, duration: 0.45, ease: 'power2.out' },
                    0.65
                );
            }
            if (sparkBeamH) {
                aboutTl.fromTo(sparkBeamH,
                    { scaleX: 0, opacity: 1 },
                    { scaleX: 1.8, opacity: 0, duration: 0.4, ease: 'power2.out' },
                    0.66
                );
            }
            if (sparkBeamV) {
                aboutTl.fromTo(sparkBeamV,
                    { scaleY: 0, opacity: 1 },
                    { scaleY: 1.8, opacity: 0, duration: 0.4, ease: 'power2.out' },
                    0.66
                );
            }
            if (sparkRings.length) {
                aboutTl.fromTo(sparkRings,
                    { scale: 0, opacity: 1 },
                    { scale: 1.9, opacity: 0, stagger: 0.08, duration: 0.55, ease: 'power2.out' },
                    0.68
                );
            }
        }

        // 3C. Bio Blocks & Stat Pods Fly In
        aboutTl.to(bioBlocks, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.45,
            stagger: 0.1,
            ease: 'back.out(1.5)'
        }, 0.72);

        aboutTl.to(statCards, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.08,
            ease: 'back.out(1.7)'
        }, 0.82);

        // 3D. Stat Numbers Count Up in Sync with Scroll
        aboutTl.to(statProxy, {
            projects: 15,
            hacks: 10,
            years: 3,
            duration: 1.4,
            ease: 'power2.out',
            onUpdate: () => {
                if (statProjectsEl) statProjectsEl.textContent = Math.round(statProxy.projects) + '+';
                if (statHacksEl)    statHacksEl.textContent    = Math.round(statProxy.hacks) + '+';
                if (statYearsEl)    statYearsEl.textContent    = Math.round(statProxy.years);
            }
        }, 0.85);

        // 3E. Terminal Typing Scrollytelling (Driven Directly by Scroll Position)
        // Command 1: whoami
        aboutTl.set(cmd1, { display: 'flex', opacity: 1 }, 0.95);
        if (cur1) aboutTl.set(cur1, { display: 'inline-block' }, 0.95);

        cmd1Chars.forEach((ch, idx) => {
            aboutTl.set(ch, { display: 'inline', opacity: 1 }, 1.02 + idx * 0.06);
        });

        if (cur1) aboutTl.set(cur1, { display: 'none' }, 1.40);
        aboutTl.fromTo(out1,
            { display: 'block', opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' },
            1.44
        );

        // Command 2: cat stack.json
        aboutTl.set(cmd2, { display: 'flex', opacity: 1 }, 1.70);
        if (cur2) aboutTl.set(cur2, { display: 'inline-block' }, 1.70);

        cmd2Chars.forEach((ch, idx) => {
            aboutTl.set(ch, { display: 'inline', opacity: 1 }, 1.76 + idx * 0.05);
        });

        if (cur2) aboutTl.set(cur2, { display: 'none' }, 2.50);
        aboutTl.fromTo(out2,
            { display: 'block', opacity: 0, scaleY: 0.8, transformOrigin: 'top' },
            { opacity: 1, scaleY: 1, duration: 0.28, ease: 'power2.out' },
            2.54
        );

        // Command 3: cat status.txt
        aboutTl.set(cmd3, { display: 'flex', opacity: 1 }, 2.88);
        if (cur3) aboutTl.set(cur3, { display: 'inline-block' }, 2.88);

        cmd3Chars.forEach((ch, idx) => {
            aboutTl.set(ch, { display: 'inline', opacity: 1 }, 2.94 + idx * 0.045);
        });

        if (cur3) aboutTl.set(cur3, { display: 'none' }, 3.60);
        aboutTl.fromTo(out3,
            { display: 'block', opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' },
            3.64
        );

        // Terminal Idle Prompt
        aboutTl.set(termIdle, { display: 'flex', opacity: 1 }, 3.86);

        // Final Terminal Highlight & Rest Time for Easy Reading Before Unpin
        aboutTl.to('.terminal-v2', {
            boxShadow: '0 32px 85px rgba(0, 0, 0, 0.75), 0 0 45px rgba(56, 189, 248, 0.14)',
            duration: 0.3
        }, 3.90);

        // ---- 4. PARALLAX MOUSE EFFECT ON BIO BLOCKS ----
        const parallaxContainer = document.getElementById('parallax-container');
        if (parallaxContainer && !window.matchMedia('(pointer: coarse)').matches) {
            aboutPinnedWrap.addEventListener('mousemove', (e) => {
                const rect = aboutPinnedWrap.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                parallaxContainer.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
            });
            aboutPinnedWrap.addEventListener('mouseleave', () => {
                parallaxContainer.style.transform = 'rotateY(0deg) rotateX(0deg)';
                parallaxContainer.style.transition = 'transform 0.5s ease';
                setTimeout(() => parallaxContainer.style.transition = '', 500);
            });
        }
    }



    // ========================================
    // EDUCATION SECTION - HORIZONTAL WARP STATION DECK
    // ========================================
    const eduPinnedWrap = document.getElementById('edu-pinned-wrap');
    const eduTrack = document.getElementById('edu-track');

    if (eduPinnedWrap && eduTrack) {
        const eduCards = eduTrack.querySelectorAll('.edu-card');
        const eduStepNodes = document.querySelectorAll('.edu-step-node');
        const dockIndicatorText = document.getElementById('edu-indicator-text');
        const railProgress = document.getElementById('edu-rail-progress');
        const railVal = document.getElementById('edu-rail-val');
        const ambientGlow = document.getElementById('edu-ambient-glow');

        const stationMeta = [
            { name: 'STATION 01 // FOUNDATION', accent: 'rgba(255, 255, 255, 0.4)' },
            { name: 'STATION 02 // ACCELERATION', accent: 'rgba(255, 255, 255, 0.4)' },
            { name: 'STATION 03 // 3RD YEAR (ACTIVE MISSION)', accent: 'rgba(255, 255, 255, 0.4)' },
            { name: 'STATION 04 // SPECIALIZATIONS', accent: 'rgba(255, 255, 255, 0.4)' }
        ];

        let currentEduStep = -1;
        function setEduStep(idx) {
            if (idx === currentEduStep) return;
            currentEduStep = idx;

            eduStepNodes.forEach((node, i) => node.classList.toggle('is-active', i === idx));
            eduCards.forEach((c, i) => c.classList.toggle('is-active-card', i === idx));

            if (dockIndicatorText && stationMeta[idx]) {
                dockIndicatorText.textContent = stationMeta[idx].name;
            }

            if (ambientGlow && stationMeta[idx]) {
                ambientGlow.style.setProperty('--edu-glow-color', stationMeta[idx].accent);
            }
        }

        // Horizontal Warp Scrub Animation
        function getScrollAmount() {
            return -(eduTrack.scrollWidth - window.innerWidth);
        }

        const eduTl = gsap.timeline({
            scrollTrigger: {
                trigger: eduPinnedWrap,
                pin: true,
                scrub: 0.8,
                start: 'top top',
                end: () => `+=${eduTrack.scrollWidth}`,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    const p = self.progress;

                    // Progress rail updates
                    if (railProgress) railProgress.style.width = `${Math.min(100, Math.max(8, p * 100))}%`;
                    if (railVal) railVal.textContent = `${Math.round(p * 100)}% DISPATCHED`;

                    // Find closest card to the viewport center
                    let activeDock = 0;
                    let minDiff = Infinity;
                    const screenMid = window.innerWidth / 2;

                    eduCards.forEach((card, idx) => {
                        const rect = card.getBoundingClientRect();
                        const cardCenter = rect.left + rect.width / 2;
                        const diff = Math.abs(cardCenter - screenMid);

                        if (diff < minDiff) {
                            minDiff = diff;
                            activeDock = idx;
                        }

                        // Proximity interpolation: center card is 1.0 opacity & scale, outer cards fade & tilt
                        const norm = (cardCenter - screenMid) / (window.innerWidth * 0.55);
                        const clamped = Math.max(-1, Math.min(1, norm));
                        const opacity = Math.max(0.3, 1 - Math.abs(clamped) * 0.65);
                        const scale = 1 - Math.abs(clamped) * 0.08;
                        const rotY = clamped * -10;

                        card.style.opacity = opacity.toFixed(3);
                        card.style.transform = `perspective(1000px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
                    });

                    setEduStep(activeDock);
                }
            }
        });

        // Translate the track horizontally
        eduTl.to(eduTrack, {
            x: getScrollAmount,
            ease: 'none',
            duration: 1
        });

        // Initialize state
        setEduStep(0);

        // Stepper click → smooth scroll to dock
        const dockProgressPoints = [0.0, 0.33, 0.67, 1.0];
        eduStepNodes.forEach((btn) => {
            btn.addEventListener('click', () => {
                const sIdx = parseInt(btn.dataset.step || '0');
                const st = eduTl.scrollTrigger;
                if (!st) return;
                const targetScroll = st.start + (st.end - st.start) * dockProgressPoints[sIdx];
                if (window.lenis) {
                    window.lenis.scrollTo(targetScroll, { duration: 1.3 });
                } else {
                    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
                }
            });
        });

        // Interactive 3D tilt & sheen on card hover
        eduCards.forEach(card => {
            const glass = card.querySelector('.edu-card-glass');

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rx = ((y - rect.height / 2) / rect.height) * -6;
                const ry = ((x - rect.width / 2) / rect.width) * 6;

                if (glass) {
                    const px = (x / rect.width) * 100;
                    const py = (y / rect.height) * 100;
                    glass.style.backgroundImage = `radial-gradient(circle at ${px}% ${py}%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 65%)`;
                }
            });

            card.addEventListener('mouseleave', () => {
                if (glass) glass.style.backgroundImage = '';
            });
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
            if (href === '#' || !href) return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                if (window.lenis) {
                    window.lenis.scrollTo(target, { offset: -20, duration: 1.4 });
                } else {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Scroll indicator click
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const target = document.getElementById('work');
            if (target) {
                if (window.lenis) {
                    window.lenis.scrollTo(target, { offset: 0, duration: 1.4 });
                } else {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
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

    } // end initPortfolio()

    // Gate on the intro splash. intro.js exposes __waitForIntro if
    // the intro is in use; it will call our callback when the splash
    // exit starts, so entrance animations actually play during the
    // reveal instead of having already finished invisibly.
    if (typeof window.__waitForIntro === 'function') {
        window.__waitForIntro(initPortfolio);
    } else {
        initPortfolio();
    }
});
