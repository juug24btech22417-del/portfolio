/* ============================================================
   Intro / Splash Screen — sequence driver
   Single <h1>, JS-positioned at the visual center on every
   frame (visualViewport API). Each transition = quick
   fade-out (text swaps while invisible) + fade-in, with a
   procedurally-synthesized cinematic whoosh on each word.

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
    // Procedurally-synthesized cinematic whoosh. No asset to load.
    // White noise routed through a band-pass filter that sweeps
    // from high (~3000 Hz) to low (~400 Hz) over ~250ms, with
    // a quick gain swell. Sounds like the wind/transition swoosh
    // you hear when text slides in/out in a film.
    let audioCtx = null;

    function ensureAudio() {
        if (audioCtx) return audioCtx;
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        audioCtx = new Ctor();
        return audioCtx;
    }

    function playWhoosh() {
        const ctx = ensureAudio();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        const dur = 0.55; // total whoosh length (s)

        // ---- Noise source ----
        // A buffer of white noise we replay each time. Generated
        // once on the first call (cached on the context).
        if (!playWhoosh._buffer) {
            const len = Math.floor(ctx.sampleRate * 1.5);
            const buf = ctx.createBuffer(1, len, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < len; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            playWhoosh._buffer = buf;
        }
        const src = ctx.createBufferSource();
        src.buffer = playWhoosh._buffer;

        // ---- High-pass (kills the low "body" that made it
        // sound like a clap) ----
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 600;
        hp.Q.value = 0.7;

        // ---- Band-pass (sweeps high → low) ----
        // Wide Q (~0.5) so it sounds like AIR, not a tone.
        // Starting at 5000 Hz is bright/airy, sweeping down to
        // 800 Hz gives the smooth swoosh — not a percussive hit.
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = 0.5;
        bp.frequency.setValueAtTime(5000, now);
        bp.frequency.exponentialRampToValueAtTime(800, now + dur);

        // ---- Gain envelope ----
        // Slower swell (90ms) so it doesn't have a sharp attack
        // that reads as a "hit". Smooth ramp in, smooth fade.
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.9, now + 0.09);
        gain.gain.setValueAtTime(0.9, now + dur * 0.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        src.connect(hp);
        hp.connect(bp);
        bp.connect(gain);
        gain.connect(ctx.destination);

        src.start(now);
        src.stop(now + dur + 0.05);
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
            playWhoosh();
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

        // First word: play its whoosh, then fade in.
        playWhoosh();
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
