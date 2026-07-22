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
    // Plays a pre-recorded whoosh from assets/whoosh.mp3. We keep
    // the volume control on a WebAudio GainNode so we can tweak
    // loudness in one place. The file is loaded once and the
    // <audio> element is rewound to 0 on each play — that's
    // cheap (it's a tiny file) and avoids the latency of
    // creating a new AudioBufferSource each time.
    const WHOOSH_SRC = 'assets/whoosh.mp3';
    const WHOOSH_VOLUME = 0.6; // peak gain (0.0–1.0)

    let audioCtx = null;
    let whooshAudio = null;        // <audio> element
    let whooshGain  = null;        // GainNode for volume

    function ensureAudio() {
        if (audioCtx) return audioCtx;
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        audioCtx = new Ctor();
        whooshGain = audioCtx.createGain();
        whooshGain.gain.value = WHOOSH_VOLUME;
        whooshGain.connect(audioCtx.destination);
        return audioCtx;
    }

    function ensureWhooshElement() {
        if (whooshAudio) return whooshAudio;
        whooshAudio = new Audio(WHOOSH_SRC);
        whooshAudio.preload = 'auto';
        // Route through WebAudio so the GainNode controls volume.
        // (Without this, the audio plays at full system volume
        // and we can't tame it from JS.)
        try { whooshAudio.crossOrigin = 'anonymous'; } catch (e) {}
        return whooshAudio;
    }

    function playWhoosh() {
        const ctx = ensureAudio();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();

        const audio = ensureWhooshElement();
        if (!audio) return;

        // First time: connect the <audio> element to the GainNode
        // (createMediaElementSource can only be called once per
        // element, hence the guard).
        if (!whooshAudio._connected) {
            try {
                const src = ctx.createMediaElementSource(whooshAudio);
                src.connect(whooshGain);
                whooshAudio._connected = true;
            } catch (e) {
                // If the browser refuses MediaElementSource
                // (rare), fall back to unconnected playback —
                // it'll play at full volume, but the whoosh
                // still works.
                console.warn('MediaElementSource unavailable:', e);
            }
        }

        // Rewind to start and play. Setting currentTime is what
        // makes rapid back-to-back whooshes work — without it
        // the second one would play from wherever the first
        // left off (or refuse to restart).
        try { audio.currentTime = 0; } catch (e) {}
        const p = audio.play();
        if (p && p.catch) {
            p.catch(err => {
                // Autoplay was blocked, or audio failed to load.
                // Fail silent — the intro still works visually.
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
