/* ============================================================
   Intro / Splash Screen — sequence driver
   Single <h1>. Positioned at the visual center on every
   frame (via the visualViewport API, so iOS URL bar and
   dynamic-viewport quirks can't shift it). Each transition
   = quick fade-out (text swaps while invisible) + fade-in.
   ============================================================ */

(function () {
    'use strict';

    // ---- Config ---------------------------------------------------------
    const GREETINGS = [
        { word: 'Hello',     lang: 'en' },
        { word: 'नमस्ते',     lang: 'hi' },
        { word: 'Hola',      lang: 'es' },
        { word: 'Bonjour',   lang: 'fr' },
        { word: 'こんにちは', lang: 'ja' },
        { word: 'مرحبا',      lang: 'ar' },
        { word: 'Hallo',     lang: 'de' }
    ];

    const NON_LATIN_LANGS = ['hi', 'ja', 'ar'];

    const FADE      = 250;
    const HOLD      = 900;
    const EXIT_FADE = 600;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const STEP = prefersReducedMotion ? 600 : FADE + HOLD;

    // ---- DOM refs -------------------------------------------------------
    const screen = document.getElementById('intro-screen');
    const word   = document.getElementById('intro-word');
    const body   = document.body;

    if (!screen || !word) {
        body.classList.remove('intro-active');
        return;
    }

    // ---- Centering ------------------------------------------------------
    // Keep the word at the visual center on every frame. We use the
    // visualViewport API when available (it reports the actually-
    // visible viewport on mobile, accounting for URL bar collapse /
    // soft keyboards), falling back to window.innerWidth/Height.
    // This is the ONLY way to be sure the word stays put on iOS.
    function recenter() {
        const vv = window.visualViewport;
        const w  = vv ? vv.width  : window.innerWidth;
        const h  = vv ? vv.height : window.innerHeight;
        // Use half the visual viewport as the center, so the
        // word's translate(-50%,-50%) lands it perfectly centered
        // even when the URL bar is partially collapsed.
        word.style.setProperty('--cx', (w / 2) + 'px');
        word.style.setProperty('--cy', (h / 2) + 'px');
    }

    let centerRAF = null;
    function startCentering() {
        if (centerRAF) return;
        function tick() {
            recenter();
            centerRAF = requestAnimationFrame(tick);
        }
        tick();
    }
    function stopCentering() {
        if (centerRAF) {
            cancelAnimationFrame(centerRAF);
            centerRAF = null;
        }
    }

    // Also recenter on any viewport change
    window.addEventListener('resize', recenter);
    window.addEventListener('scroll', recenter, { passive: true });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', recenter);
        window.visualViewport.addEventListener('scroll', recenter);
    }

    // ---- State ----------------------------------------------------------
    let timeouts = [];

    const introWaiters = [];
    window.__waitForIntro = function (cb) {
        if (typeof cb === 'function') introWaiters.push(cb);
    };

    function t(fn, ms) {
        timeouts.push(setTimeout(fn, ms));
    }

    function applyGreeting(g) {
        word.textContent = g.word;
        word.classList.toggle('is-non-latin', NON_LATIN_LANGS.includes(g.lang));
        // Text width may have changed — re-center
        recenter();
    }

    function transitionTo(i) {
        word.classList.remove('is-visible');
        t(() => {
            applyGreeting(GREETINGS[i]);
            requestAnimationFrame(() => {
                word.classList.add('is-visible');
            });
        }, FADE);
    }

    function endIntro() {
        const waiters = introWaiters.splice(0);
        waiters.forEach(cb => {
            try { cb(); } catch (err) { console.error('Intro waiter failed:', err); }
        });

        word.classList.remove('is-visible');
        screen.classList.add('is-done');
        screen.setAttribute('aria-hidden', 'true');

        t(() => {
            screen.hidden = true;
            body.classList.remove('intro-active');
            stopCentering();
        }, EXIT_FADE);
    }

    function run() {
        applyGreeting(GREETINGS[0]);
        startCentering();
        requestAnimationFrame(() => {
            word.classList.add('is-visible');
        });

        for (let i = 1; i < GREETINGS.length; i++) {
            t(() => transitionTo(i), i * STEP);
        }

        t(endIntro, GREETINGS.length * STEP);
    }

    // ---- Boot -----------------------------------------------------------
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            recenter();
            screen.classList.add('is-ready');
            screen.setAttribute('aria-hidden', 'false');
            run();
        });
    });

    setTimeout(() => {
        if (!screen.hidden) endIntro();
    }, 15000);

    window.__dismissIntro = endIntro;

})();
