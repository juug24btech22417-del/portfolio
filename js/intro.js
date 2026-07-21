/* ============================================================
   Intro / Splash Screen — sequence driver
   Cycles the intro-word through 7 greetings, then fades out
   the splash and reveals the main landing page.
   ============================================================ */

(function () {
    'use strict';

    // ---- Config ---------------------------------------------------------
    // 7 greetings: word, native-script label, lang code (ISO 639-1).
    const GREETINGS = [
        { word: 'Hello',     label: 'ENGLISH',  lang: 'en' },
        { word: 'नमस्ते',     label: 'HINDI',    lang: 'hi' },
        { word: 'Hola',      label: 'SPANISH',  lang: 'es' },
        { word: 'Bonjour',   label: 'FRENCH',   lang: 'fr' },
        { word: 'こんにちは', label: 'JAPANESE', lang: 'ja' },
        { word: 'مرحبا',      label: 'ARABIC',   lang: 'ar' },
        { word: 'Hallo',     label: 'GERMAN',   lang: 'de' }
    ];

    // Scripts that aren't Latin-based — gets a subtle italic in the CSS.
    const NON_LATIN_LANGS = ['hi', 'ja', 'ar'];

    // Timing (ms)
    const FADE_IN     = 300;
    const HOLD        = 800;
    const FADE_OUT    = 300;
    const EXIT_FADE   = 600;
    const DOTS_REVEAL = 400; // delay after the first word before showing dots

    // ---- DOM refs -------------------------------------------------------
    const screen = document.getElementById('intro-screen');
    const word   = document.getElementById('intro-word');
    const label  = document.getElementById('intro-label');
    const dots   = document.querySelectorAll('.intro-dot');
    const body   = document.body;

    if (!screen || !word || !label) {
        // Markup missing — fail silent, just reveal the page.
        body.classList.remove('intro-active');
        return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- Sequence -------------------------------------------------------
    let timeouts = [];

    function t(fn, ms) {
        timeouts.push(setTimeout(fn, ms));
    }

    function showWord(i) {
        const g = GREETINGS[i];

        word.textContent = g.word;
        label.textContent = '// ' + g.label;

        // Mark non-Latin scripts so the CSS can italicize them.
        if (NON_LATIN_LANGS.includes(g.lang)) {
            word.classList.add('is-non-latin');
        } else {
            word.classList.remove('is-non-latin');
        }

        // Reset visibility classes
        word.classList.remove('is-visible');
        label.classList.remove('is-visible');

        if (prefersReducedMotion) {
            // Instant swap, no transitions
            word.classList.add('is-visible');
            label.classList.add('is-visible');
            return;
        }

        // Force a reflow so the transition fires reliably even on
        // the first iteration when the element starts at opacity 0.
        void word.offsetWidth;

        word.classList.add('is-visible');
        label.classList.add('is-visible');
    }

    function setActiveDot(i) {
        dots.forEach((d, idx) => {
            d.classList.toggle('is-active', idx === i);
        });
    }

    function endIntro() {
        // Remove active dot from the last one
        dots.forEach(d => d.classList.remove('is-active'));
        label.classList.remove('is-visible');
        word.classList.remove('is-visible');
        screen.classList.add('is-done');
        screen.setAttribute('aria-hidden', 'true');

        t(() => {
            screen.hidden = true;
            body.classList.remove('intro-active');
        }, EXIT_FADE);
    }

    function run() {
        if (prefersReducedMotion) {
            // Compressed version: show each word with a short hold, no fades.
            const STEP = 700;
            GREETINGS.forEach((_, i) => {
                t(() => {
                    showWord(i);
                    setActiveDot(i);
                    if (i === GREETINGS.length - 1) {
                        t(endIntro, STEP);
                    }
                }, i * STEP);
            });
            return;
        }

        // Standard version: fade in -> hold -> fade out, per word.
        const STEP = FADE_IN + HOLD + FADE_OUT;
        let cumulative = 0;

        // Reveal dots shortly after the first word appears
        t(() => {
            const dotsContainer = document.getElementById('intro-dots');
            if (dotsContainer) dotsContainer.classList.add('is-visible');
        }, DOTS_REVEAL);

        GREETINGS.forEach((_, i) => {
            const startAt = cumulative;

            // Fade in
            t(() => {
                showWord(i);
                setActiveDot(i);
            }, startAt);

            // Fade out
            t(() => {
                word.classList.remove('is-visible');
                label.classList.remove('is-visible');
            }, startAt + FADE_IN + HOLD);

            cumulative += STEP;
        });

        // Final exit
        t(endIntro, cumulative);
    }

    // ---- Boot -----------------------------------------------------------
    // Wait one frame so the initial opacity:0 is committed before we
    // toggle is-ready, otherwise the fade-in would be skipped.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            screen.classList.add('is-ready');
            screen.setAttribute('aria-hidden', 'false');
            run();
        });
    });

    // Safety net: if anything goes wrong (script error, etc.), the user
    // shouldn't be stuck on a black screen. Cap the intro at 15s.
    setTimeout(() => {
        if (!screen.hidden) endIntro();
    }, 15000);

    // Expose a clean teardown in case other code wants to skip it
    // (e.g. for a future "Skip" button).
    window.__dismissIntro = endIntro;

})();
