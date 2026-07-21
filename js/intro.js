/* ============================================================
   Intro / Splash Screen — sequence driver
   Apple-style crossfade between two stacked <h1> elements.
   Each word: incoming slides up + unblurs while outgoing
   slides up + blurs out. Plays once per page load.
   ============================================================ */

(function () {
    'use strict';

    // ---- Config ---------------------------------------------------------
    // 7 greetings, no language label shown on screen.
    const GREETINGS = [
        { word: 'Hello',     lang: 'en' },
        { word: 'नमस्ते',     lang: 'hi' },
        { word: 'Hola',      lang: 'es' },
        { word: 'Bonjour',   lang: 'fr' },
        { word: 'こんにちは', lang: 'ja' },
        { word: 'مرحبا',      lang: 'ar' },
        { word: 'Hallo',     lang: 'de' }
    ];

    // Scripts that aren't Latin-based — gets a subtle italic in the CSS.
    const NON_LATIN_LANGS = ['hi', 'ja', 'ar'];

    // Timing (ms)
    // Slide/blur transition is 700ms in CSS; we hold for a beat on top.
    const TRANSITION = 700;
    const HOLD       = 700;   // how long each word sits fully visible
    const EXIT_FADE  = 600;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const STEP = prefersReducedMotion ? 500 : TRANSITION + HOLD;

    // ---- DOM refs -------------------------------------------------------
    const screen = document.getElementById('intro-screen');
    const slots  = [
        document.getElementById('intro-word-a'),
        document.getElementById('intro-word-b')
    ];
    const body = document.body;

    if (!screen || !slots[0] || !slots[1]) {
        // Markup missing — fail silent, just reveal the page.
        body.classList.remove('intro-active');
        return;
    }

    // ---- State ----------------------------------------------------------
    // activeIndex = which slot currently has the visible word
    let activeIndex = 0;
    let timeouts = [];

    function t(fn, ms) {
        timeouts.push(setTimeout(fn, ms));
    }

    function applyWord(slot, g) {
        slot.textContent = g.word;
        slot.classList.toggle('is-non-latin', NON_LATIN_LANGS.includes(g.lang));
    }

    // Show word at GREETINGS[i] using the inactive slot, while the
    // active slot becomes "is-leaving".
    function transitionTo(i) {
        const next = 1 - activeIndex;
        const nextSlot = slots[next];
        const leavingSlot = slots[activeIndex];

        applyWord(nextSlot, GREETINGS[i]);

        // Mark outgoing first, then on the next frame mark incoming.
        // This guarantees the browser sees the state change and
        // triggers the transition reliably.
        if (prefersReducedMotion) {
            leavingSlot.classList.remove('is-visible');
            nextSlot.classList.add('is-visible');
        } else {
            leavingSlot.classList.remove('is-visible');
            leavingSlot.classList.add('is-leaving');

            // Force a reflow so the incoming slot's transition fires
            // (otherwise the browser may batch both class changes).
            void nextSlot.offsetWidth;

            nextSlot.classList.add('is-visible');
        }

        activeIndex = next;
    }

    function endIntro() {
        const visible = slots[activeIndex];
        visible.classList.remove('is-visible');
        if (!prefersReducedMotion) visible.classList.add('is-leaving');
        screen.classList.add('is-done');
        screen.setAttribute('aria-hidden', 'true');

        t(() => {
            screen.hidden = true;
            body.classList.remove('intro-active');
        }, EXIT_FADE);
    }

    function run() {
        // First word: just fade in slot 0 immediately.
        applyWord(slots[0], GREETINGS[0]);
        slots[0].classList.add('is-visible');

        // Schedule the remaining transitions
        for (let i = 1; i < GREETINGS.length; i++) {
            t(() => transitionTo(i), i * STEP);
        }

        // End after the last word has been visible long enough
        t(endIntro, GREETINGS.length * STEP);
    }

    // ---- Boot -----------------------------------------------------------
    // Wait one frame so the initial state is committed before we
    // toggle is-ready, otherwise the fade-in would be skipped.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            screen.classList.add('is-ready');
            screen.setAttribute('aria-hidden', 'false');
            run();
        });
    });

    // Safety net: if anything goes wrong, the user shouldn't be stuck
    // on a black screen. Cap the intro at 15s.
    setTimeout(() => {
        if (!screen.hidden) endIntro();
    }, 15000);

    // Expose a clean teardown in case other code wants to skip it
    // (e.g. for a future "Skip" button).
    window.__dismissIntro = endIntro;

})();
