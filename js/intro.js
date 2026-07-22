/* ============================================================
   Intro / Splash Screen — sequence driver
   Single <h1>, JS-positioned at the visual center on every
   frame (visualViewport API). Each transition = quick
   fade-out (text swaps while invisible) + fade-in, with a
   procedurally-synthesized deep gong on each word.

   Mobile browsers block autoplay, so the sequence is gated
   behind a "Tap to enter" button — the tap counts as a
   user gesture, unlocking the Web Audio context.
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
    const screen     = document.getElementById('intro-screen');
    const word       = document.getElementById('intro-word');
    const startBtn   = document.getElementById('intro-start');
    const body       = document.body;

    if (!screen || !word) {
        body.classList.remove('intro-active');
        return;
    }

    // ---- Audio ---------------------------------------------------------
    // Procedurally-synthesized deep gong. No asset to load.
    // The gong is built from two detuned sine oscillators (the
    // "strike" + a higher partial) with a fast attack and a
    // ~2.5s exponential decay. Sounds like a Tibetan singing
    // bowl / temple bell — exactly the "deep gong" feel.
    let audioCtx = null;

    function ensureAudio() {
        if (audioCtx) return audioCtx;
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        audioCtx = new Ctor();
        return audioCtx;
    }

    function playGong() {
        const ctx = ensureAudio();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, now);
        // Attack then long exponential decay. Medium volume —
        // noticeable but not startling.
        master.gain.exponentialRampToValueAtTime(0.55, now + 0.012);
        master.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
        master.connect(ctx.destination);

        // Fundamental — deep, around F2 (~87 Hz). The two
        // oscillators are slightly detuned (a few Hz apart) to
        // create the beating/wobble characteristic of a real
        // bell — a single pure sine sounds electronic.
        const partials = [
            { freq: 87,  detune:  -4, gain: 1.0 },
            { freq: 87,  detune:  +5, gain: 0.9 },
            // Higher "shimmer" partial — quieter, decays faster.
            { freq: 174, detune:  +2, gain: 0.35 },
            { freq: 261, detune:  -3, gain: 0.18 }
        ];

        partials.forEach(p => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = p.freq;
            osc.detune.value = p.detune;

            const g = ctx.createGain();
            g.gain.value = p.gain;

            osc.connect(g);
            g.connect(master);
            osc.start(now);
            osc.stop(now + 2.7);
        });
    }

    // ---- Centering ------------------------------------------------------
    function recenter() {
        const vv = window.visualViewport;
        const w  = vv ? vv.width  : window.innerWidth;
        const h  = vv ? vv.height : window.innerHeight;
        const halfW = (w / 2) + 'px';
        const halfH = (h / 2) + 'px';
        word.style.setProperty('--cx', halfW);
        word.style.setProperty('--cy', halfH);
        if (startBtn) {
            startBtn.style.setProperty('--sx', halfW);
            startBtn.style.setProperty('--sy', halfH);
        }
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

    window.addEventListener('resize', recenter);
    window.addEventListener('scroll', recenter, { passive: true });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', recenter);
        window.visualViewport.addEventListener('scroll', recenter);
    }

    // ---- State ----------------------------------------------------------
    let timeouts = [];
    let started  = false;

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
        recenter();
    }

    function transitionTo(i) {
        word.classList.remove('is-visible');
        t(() => {
            applyGreeting(GREETINGS[i]);
            playGong();
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

    function runSequence() {
        if (started) return;
        started = true;

        // Hide the start button the moment the sequence begins
        if (startBtn) {
            startBtn.classList.remove('is-visible');
            startBtn.style.pointerEvents = 'none';
        }

        // First word: play its gong, then fade in.
        playGong();
        applyGreeting(GREETINGS[0]);
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

            // Show the "Tap to enter" button. The actual
            // sequence waits for the tap — that's the user
            // gesture that unlocks Web Audio on mobile.
            if (startBtn) {
                startBtn.classList.add('is-visible');
                const onTap = () => {
                    startBtn.removeEventListener('click', onTap);
                    // Prime the audio context on the same gesture.
                    ensureAudio();
                    runSequence();
                };
                startBtn.addEventListener('click', onTap);
                // Also allow Enter / Space for keyboard users.
                startBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onTap();
                    }
                });
            } else {
                // No button in the DOM (older markup) — fall back
                // to autoplay. On mobile this may be silent.
                runSequence();
            }
        });
    });

    setTimeout(() => {
        if (!screen.hidden && !started) {
            // User never tapped — just play the sequence without sound.
            runSequence();
        }
    }, 15000);

    window.__dismissIntro = endIntro;

})();
