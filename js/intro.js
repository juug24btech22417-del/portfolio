/* ============================================================
   Intro / Splash Screen — sequence driver
   Single <h1>, JS-positioned at the visual center on every
   frame (visualViewport API). Each transition = quick
   fade-out (text swaps while invisible) + fade-in, with a
   pre-recorded whoosh (assets/whoosh.mp3) on each word.

   Mobile browsers block autoplay, so the sequence is gated
   behind a "Tap to enter" button — the tap counts as a
   user gesture, which lets the browser autoplay the
   <audio> element on iOS/Safari.
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
    // Plays a pre-recorded whoosh from assets/whoosh.mp3.
    //
    // The previous version routed the <audio> element through a
    // WebAudio GainNode. That works in theory, but on mobile the
    // AudioContext starts in 'suspended' state, and the first
    // play() fires before ctx.resume() completes — so the graph
    // produces no sound. This version plays the <audio> directly
    // (no WebAudio at all) and uses the element's `volume`
    // property for level control. Simpler, more reliable, and
    // doesn't depend on a running AudioContext.
    const WHOOSH_SRC = 'assets/whoosh.mp3';
    const WHOOSH_VOLUME = 0.7; // 0.0–1.0 on the <audio> element

    let whooshAudio = null;

    function ensureWhooshElement() {
        if (whooshAudio) return whooshAudio;
        whooshAudio = new Audio(WHOOSH_SRC);
        whooshAudio.preload = 'auto';
        whooshAudio.volume = WHOOSH_VOLUME;
        return whooshAudio;
    }

    function playWhoosh() {
        const audio = ensureWhooshElement();
        if (!audio) return;

        // Rewind to start. The 'ended' listener restarts it for
        // the next call — but we don't actually need that; the
        // next call resets currentTime anyway. Kept for safety
        // in case the previous play() was interrupted.
        try { audio.currentTime = 0; } catch (e) {}

        const p = audio.play();
        if (p && p.catch) {
            p.catch(err => {
                // Autoplay blocked or file missing. Fail silent
                // — the intro still works visually.
                console.warn('Whoosh playback failed:', err);
            });
        }
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
            // sequence waits for the tap — the tap counts as
            // a user gesture, which lets the browser autoplay
            // the <audio> element on iOS/Safari.
            if (startBtn) {
                startBtn.classList.add('is-visible');
                const onTap = () => {
                    startBtn.removeEventListener('click', onTap);
                    // Pre-create and prime the audio element on
                    // the gesture. This forces the browser to
                    // start loading the MP3 NOW and lets the
                    // first .play() in runSequence() succeed.
                    ensureWhooshElement();
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
