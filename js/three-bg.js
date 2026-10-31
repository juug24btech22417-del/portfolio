
// ========================================
// THREE.JS SPACE BACKGROUND
// Deep space with stars, nebula, shooting stars, and constellation
// ========================================

(function() {
    const canvas = document.getElementById('space-bg');
    if (!canvas) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Initial camera position - move back so we can see things in front
    camera.position.z = 30;

    // Scroll state & cinematic camera choreography
    let scrollProgress = 0;
    let targetProgress = 0;
    let scrollVelocity = 0;
    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();
    let mouseX = 0;
    let mouseY = 0;

    // Active project accent color for cosmic nebula illumination
    const currentAccentColor = new THREE.Vector3(0.4, 0.6, 0.9);
    const targetAccentColor = new THREE.Vector3(0.4, 0.6, 0.9);

    // Compute 3D camera flight path across sections
    function getFlightTrajectory(p) {
        let x = 0, y = 0, z = 30, rotX = 0, rotY = 0;
        if (p < 0.15) {
            // Sector 01: Hero (gentle float forward)
            const t = Math.max(0, p / 0.15);
            z = 30 - t * 8; // 30 -> 22
            x = Math.sin(t * Math.PI) * 1.5;
            y = 0;
            rotY = -0.02 * t;
        } else if (p < 0.48) {
            // Sector 02: Work / Pinned 3D Deck (wide panoramic stage view)
            const t = (p - 0.15) / 0.33;
            z = 22 - t * 7; // 22 -> 15
            x = 3.5 * Math.sin(t * Math.PI);
            y = -1.5 * t;
            rotY = -0.05 * Math.sin(t * Math.PI);
            rotX = 0.02 * t;
        } else if (p < 0.72) {
            // Sector 03: Skills (elevated planetary orbital plane)
            const t = (p - 0.48) / 0.24;
            z = 15 + t * 7; // pull back slightly to frame orbits: 15 -> 22
            y = 7 * t;      // elevated viewpoint looking down
            x = -3 * t;
            rotX = -0.22 * t; // tilt downward into solar system
            rotY = 0.04 * t;
        } else if (p < 0.88) {
            // Sector 04: About & Terminal (dive through nebula core)
            const t = (p - 0.72) / 0.16;
            z = 22 - t * 34; // 22 -> -12
            y = 7 * (1 - t);
            x = -3 * (1 - t);
            rotX = -0.22 * (1 - t);
        } else {
            // Sector 05: Contact / Deep space
            const t = (p - 0.88) / 0.12;
            z = -12 - t * 24; // -12 -> -36
            x = 0;
            y = 0;
            rotX = 0;
            rotY = 0;
        }
        return { x, y, z, rotX, rotY };
    }

    // Listen for scroll & compute velocity for warp impulse
    function onScrollUpdate() {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        targetProgress = docHeight > 0 ? window.scrollY / docHeight : 0;
        
        const now = performance.now();
        const dt = Math.max(16, now - lastScrollTime);
        const dy = Math.abs(window.scrollY - lastScrollY);
        scrollVelocity = Math.min(1.0, (dy / dt) * 0.12);
        
        lastScrollY = window.scrollY;
        lastScrollTime = now;
    }

    window.addEventListener('scroll', onScrollUpdate, { passive: true });

    // Expose control API for Lenis & GSAP ScrollTrigger
    window.__spaceBg = {
        setScrollProgress: (val) => {
            targetProgress = Math.max(0, Math.min(1, val));
            scrollProgress = targetProgress;
        },
        setAccentColor: (hexStr) => {
            // Parse hex color into RGB 0-1
            const hex = hexStr.replace('#', '');
            if (hex.length === 6) {
                const r = parseInt(hex.substring(0, 2), 16) / 255;
                const g = parseInt(hex.substring(2, 4), 16) / 255;
                const b = parseInt(hex.substring(4, 6), 16) / 255;
                targetAccentColor.set(r, g, b);
            }
        },
        setWarpVelocity: (v) => {
            scrollVelocity = Math.min(1.0, Math.max(0, v));
        }
    };

    // Mouse tracking
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    // ========================================
    // LAYER 1: STAR FIELD (3 depth layers)
    // ========================================

    // Create circular texture for stars
    function createStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    const starTexture = createStarTexture();

    function createStarLayer(count, size, opacity, speed, zRange) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 400;
            positions[i3 + 1] = (Math.random() - 0.5) * 400;
            positions[i3 + 2] = (Math.random() - 0.5) * zRange;

            // Cool blue-white stars to match nebula theme
            const blueTint = Math.random() * 0.2 + 0.75;
            colors[i3] = blueTint * 0.9;        // Slightly less red
            colors[i3 + 1] = blueTint;           // Green
            colors[i3 + 2] = 1.0;                // Full blue
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: size,
            vertexColors: true,
            transparent: true,
            opacity: opacity,
            sizeAttenuation: true,
            map: starTexture,
            alphaMap: starTexture,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const stars = new THREE.Points(geometry, material);
        stars.userData = { speed, originalPositions: positions.slice() };
        return stars;
    }

    // Create 3 star layers - balanced, elegant count (not overcrowded)
    const farStars = createStarLayer(1200, 0.5, 0.45, 0.00005, 200);
    const midStars = createStarLayer(450, 0.85, 0.65, 0.0001, 150);
    const nearStars = createStarLayer(100, 1.4, 0.85, 0.00018, 100);

    scene.add(farStars);
    scene.add(midStars);
    scene.add(nearStars);

    // ========================================
    // LAYER 2: NEBULA CLOUDS (Volumetric & Natural)
    // ========================================

    // Create cloud texture with multiple overlapping gradients
    function createCloudTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Create multiple overlapping blobs for organic cloud look
        const numBlobs = 12;
        for (let i = 0; i < numBlobs; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const radius = 100 + Math.random() * 200;
            const opacity = 0.1 + Math.random() * 0.15;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
            gradient.addColorStop(0.4, `rgba(255, 255, 255, ${opacity * 0.5})`);
            gradient.addColorStop(0.7, `rgba(255, 255, 255, ${opacity * 0.2})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add some "wispy" texture using small strokes
        ctx.globalCompositeOperation = 'source-over';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const length = 20 + Math.random() * 60;
            const angle = Math.random() * Math.PI * 2;

            ctx.strokeStyle = `rgba(255, 255, 255, ${0.03 + Math.random() * 0.05})`;
            ctx.lineWidth = 2 + Math.random() * 8;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    const cloudTexture = createCloudTexture();

    // Improved nebula shader with FBMs (Fractal Brownian Motion) for natural gas clouds
    const nebulaVertexShader = `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const nebulaFragmentShader = `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        uniform float uScroll;
        uniform sampler2D uCloudTexture;
        varying vec2 vUv;
        varying vec3 vPosition;

        // Hash function for noise
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        // Value noise
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);

            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));

            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        // Fractal Brownian Motion
        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;

            for (int i = 0; i < 6; i++) {
                value += amplitude * noise(p * frequency);
                amplitude *= 0.5;
                frequency *= 2.0;
            }
            return value;
        }

        void main() {
            vec2 uv = vUv;
            float time = uTime * 0.03;

            // Create flowing gas-like motion
            vec2 q = vec2(0.0);
            q.x = fbm(uv + vec2(0.0, 0.0) + time * 0.15);
            q.y = fbm(uv + vec2(1.0, 1.0) + time * 0.12);

            vec2 r = vec2(0.0);
            r.x = fbm(uv + 4.0 * q + vec2(1.7, 9.2) + time * 0.08);
            r.y = fbm(uv + 4.0 * q + vec2(8.3, 2.8) + time * 0.1);

            float f = fbm(uv + 2.0 * r + time * 0.05);

            // Create cloud texture variation
            vec4 cloudSample = texture2D(uCloudTexture, uv + q * 0.3);

            // Distance from center for falloff
            float dist = distance(uv, vec2(0.5));
            float falloff = 1.0 - smoothstep(0.0, 0.55, dist);
            falloff = pow(falloff, 1.5);

            // Mix colors based on fbm and position
            vec3 color = mix(uColor1, uColor2, f * 1.5 + 0.3);

            // Add accent color in brighter areas
            float brightness = smoothstep(0.3, 0.7, f + cloudSample.r * 0.5);
            color = mix(color, uAccent, brightness * 0.4);

            // Add some "hot spots" - brighter blue cores
            float hotSpot = smoothstep(0.5, 0.8, f + q.x * 0.3);
            color += vec3(0.10, 0.15, 0.25) * hotSpot;

            // Combine with cloud texture
            float cloudAlpha = cloudSample.r * 0.6 + f * 0.4;

            // Final alpha with natural falloff
            float alpha = cloudAlpha * falloff * (0.5 - uScroll * 0.15);
            alpha *= (0.7 + 0.3 * sin(time * 0.5 + f * 6.28)); // Subtle pulsing

            // Fade edges more naturally
            alpha *= smoothstep(0.5, 0.0, dist);

            gl_FragColor = vec4(color, alpha * 0.7);
        }
    `;

    const nebulas = [];

    // Natural nebula color palettes - dark light blue
    const nebulaPalettes = [
        {
            c1: new THREE.Vector3(0.02, 0.06, 0.12),   // Deep midnight blue
            c2: new THREE.Vector3(0.06, 0.12, 0.20),    // Soft slate blue
            accent: new THREE.Vector3(0.25, 0.45, 0.70) // Light steel blue glow
        },
        {
            c1: new THREE.Vector3(0.03, 0.08, 0.15),   // Dark navy
            c2: new THREE.Vector3(0.08, 0.15, 0.25),   // Muted azure
            accent: new THREE.Vector3(0.35, 0.55, 0.75) // Sky blue glow
        },
        {
            c1: new THREE.Vector3(0.04, 0.10, 0.18),  // Deep ocean blue
            c2: new THREE.Vector3(0.10, 0.18, 0.28),   // Dusty cerulean
            accent: new THREE.Vector3(0.30, 0.50, 0.70) // Soft cornflower glow
        },
        {
            c1: new THREE.Vector3(0.02, 0.08, 0.14),  // Midnight teal
            c2: new THREE.Vector3(0.08, 0.14, 0.22),  // Muted blue
            accent: new THREE.Vector3(0.40, 0.60, 0.80) // Pale blue glow
        }
    ];

    // Create 8 cloud clusters for more volumetric feel
    for (let i = 0; i < 8; i++) {
        const geometry = new THREE.PlaneGeometry(100, 100, 2, 2);
        const palette = nebulaPalettes[i % nebulaPalettes.length];

        const material = new THREE.ShaderMaterial({
            vertexShader: nebulaVertexShader,
            fragmentShader: nebulaFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uColor1: { value: palette.c1 },
                uColor2: { value: palette.c2 },
                uAccent: { value: palette.accent },
                uScroll: { value: 0 },
                uCloudTexture: { value: cloudTexture }
            },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const cloud = new THREE.Mesh(geometry, material);

        // Distribute more organically in space
        const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
        const radius = 30 + Math.random() * 60;

        cloud.position.set(
            Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 80,
            -40 - (i * 25) - Math.random() * 30
        );

        // Random but natural rotation
        cloud.rotation.z = Math.random() * Math.PI * 2;
        cloud.rotation.x = (Math.random() - 0.5) * 0.3;
        cloud.rotation.y = (Math.random() - 0.5) * 0.3;

        // Scale clouds differently for depth
        const scale = 0.8 + Math.random() * 0.6;
        cloud.scale.set(scale, scale, scale);

        cloud.userData = {
            originalPos: cloud.position.clone(),
            rotationSpeed: (Math.random() - 0.5) * 0.0005,
            driftSpeed: (Math.random() - 0.5) * 0.01,
            pulseOffset: Math.random() * Math.PI * 2
        };

        nebulas.push(cloud);
        scene.add(cloud);
    }

    // Add some smaller "detail" clouds
    for (let i = 0; i < 4; i++) {
        const geometry = new THREE.PlaneGeometry(40, 40, 1, 1);
        const palette = nebulaPalettes[Math.floor(Math.random() * nebulaPalettes.length)];

        const material = new THREE.ShaderMaterial({
            vertexShader: nebulaVertexShader,
            fragmentShader: nebulaFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uColor1: { value: palette.c1 },
                uColor2: { value: palette.c2 },
                uAccent: { value: new THREE.Vector3(0.4, 0.6, 0.8) }, // Light blue accent
                uScroll: { value: 0 },
                uCloudTexture: { value: cloudTexture }
            },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const detailCloud = new THREE.Mesh(geometry, material);
        detailCloud.position.set(
            (Math.random() - 0.5) * 120,
            (Math.random() - 0.5) * 60,
            -20 - Math.random() * 40
        );
        detailCloud.rotation.z = Math.random() * Math.PI * 2;

        const scale = 0.5 + Math.random() * 0.4;
        detailCloud.scale.set(scale, scale, scale);

        detailCloud.userData = {
            originalPos: detailCloud.position.clone(),
            rotationSpeed: (Math.random() - 0.5) * 0.001,
            driftSpeed: (Math.random() - 0.5) * 0.015,
            pulseOffset: Math.random() * Math.PI * 2
        };

        nebulas.push(detailCloud);
        scene.add(detailCloud);
    }

    // ========================================
    // LAYER 3: NATURAL SHOOTING STARS
    // Only one single star at a time, sweeps once every ~10s
    // ========================================

    const shootingStars = [];

    function createShootingStar() {
        // Single, realistic shooting star streak (head and tail)
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(6);

        // Spawn high in the sky across wide natural area
        const startX = (Math.random() - 0.5) * 60 + 5;
        const startY = 16 + Math.random() * 10;
        const startZ = -5 + Math.random() * 12;

        const trailLength = 16 + Math.random() * 8;
        // Natural diagonal trajectory (~ -45 degrees)
        const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.15;

        // Tail extends backwards along angle
        const tailX = startX - Math.cos(angle) * trailLength;
        const tailY = startY - Math.sin(angle) * trailLength;

        // Head (bright point)
        positions[0] = startX;
        positions[1] = startY;
        positions[2] = startZ;

        // Tail (fading end)
        positions[3] = tailX;
        positions[4] = tailY;
        positions[5] = startZ;

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Colors: brilliant white head fading to soft ethereal blue-white tail
        const colors = new Float32Array(6);
        // Head: bright white nucleus
        colors[0] = 1.0; colors[1] = 1.0; colors[2] = 1.0;
        // Tail: soft celestial cyan-blue fade
        colors[3] = 0.25; colors[4] = 0.5; colors[5] = 0.9;
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });

        const line = new THREE.Line(geometry, material);

        line.userData = {
            life: 0,
            maxLife: 60,
            speed: 0.85,
            active: true,
            angle: angle
        };

        return line;
    }

    function spawnShootingStar() {
        // Guarantee strictly only one falling star at a time
        if (shootingStars.length > 0) return;

        const star = createShootingStar();
        shootingStars.push(star);
        scene.add(star);
    }

    // Schedule natural appearances once every ~10 seconds
    function scheduleShootingStars() {
        const nextInterval = 9500 + Math.random() * 1500; // ~10 seconds
        setTimeout(() => {
            spawnShootingStar();
            scheduleShootingStars();
        }, nextInterval);
    }

    // First appearance after 4 seconds
    setTimeout(() => {
        spawnShootingStar();
        scheduleShootingStars();
    }, 4000);


    // ========================================
    // LAYER 4: INTERACTIVE CONSTELLATION
    // ========================================

    const constellationCount = 80;
    const constellationGeometry = new THREE.BufferGeometry();
    const constellationPositions = new Float32Array(constellationCount * 3);
    const constellationOriginals = [];

    for (let i = 0; i < constellationCount; i++) {
        const i3 = i * 3;
        const x = (Math.random() - 0.5) * 60;
        const y = (Math.random() - 0.5) * 40;
        const z = -10 + Math.random() * 20;

        constellationPositions[i3] = x;
        constellationPositions[i3 + 1] = y;
        constellationPositions[i3 + 2] = z;

        constellationOriginals.push({ x, y, z, vx: 0, vy: 0 });
    }

    constellationGeometry.setAttribute('position', new THREE.BufferAttribute(constellationPositions, 3));

    const constellationMaterial = new THREE.PointsMaterial({
        size: 0.8,
        color: 0xE2E8F0,
        transparent: true,
        opacity: 0.8,
        map: starTexture,
        alphaMap: starTexture,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const constellationPoints = new THREE.Points(constellationGeometry, constellationMaterial);
    scene.add(constellationPoints);

    // Constellation lines: removed per user request so only standalone stars shine

    // ========================================
    // ANIMATION LOOP
    // ========================================

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const time = clock.getElapsedTime();
        const delta = clock.getDelta();

        // Smooth scroll progress interpolation
        scrollProgress += (targetProgress - scrollProgress) * 0.08;
        scrollVelocity *= 0.92; // Natural deceleration

        // Compute 3D flight trajectory along cosmic spline
        const traj = getFlightTrajectory(scrollProgress);
        camera.position.x += (traj.x - camera.position.x) * 0.05;
        camera.position.y += (traj.y - camera.position.y) * 0.05;
        camera.position.z += (traj.z - camera.position.z) * 0.05;
        camera.rotation.x += (traj.rotX - camera.rotation.x) * 0.05;
        camera.rotation.y += (traj.rotY - camera.rotation.y) * 0.05;

        // Gentle warp speed impulse when scrolling
        const warpBoost = 1.0 + scrollVelocity * 1.8;

        // Rotate star layers with warp dynamics
        farStars.rotation.y += farStars.userData.speed * warpBoost;
        midStars.rotation.y += midStars.userData.speed * warpBoost;
        nearStars.rotation.y += nearStars.userData.speed * warpBoost;

        // Mouse parallax for near stars
        nearStars.rotation.x = mouseY * 0.003;
        nearStars.rotation.y += nearStars.userData.speed + mouseX * 0.003;

        // Update nebula clouds with realistic gas effect (original curated palettes preserved)
        nebulas.forEach((nebula, i) => {
            const data = nebula.userData;

            // Update uniforms
            nebula.material.uniforms.uTime.value = time;
            nebula.material.uniforms.uScroll.value = scrollProgress;

            // Gentle rotation
            nebula.rotation.z += data.rotationSpeed;

            // Subtle breathing/pulsing effect
            const pulse = 1.0 + Math.sin(time * 0.3 + data.pulseOffset) * 0.05;
            nebula.scale.setScalar(pulse);

            // Natural drift movement
            const driftX = Math.sin(time * 0.08 + data.pulseOffset) * data.driftSpeed;
            const driftY = Math.cos(time * 0.06 + data.pulseOffset * 0.5) * data.driftSpeed;

            // Move based on scroll - deeper clouds move faster (parallax)
            const depthFactor = (i + 1) * 0.1;
            nebula.position.x = data.originalPos.x + driftX * 15;
            nebula.position.y = data.originalPos.y + driftY * 10 + scrollProgress * 50 * depthFactor;

            // Move clouds closer to camera as we scroll (creates passing through effect)
            nebula.position.z = data.originalPos.z + scrollProgress * 30;
        });

        // Update shooting stars (strictly one natural streak)
        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const star = shootingStars[i];
            const data = star.userData;

            if (!data.active) continue;

            data.life++;

            const positions = star.geometry.attributes.position.array;
            const speed = data.speed;
            const angle = data.angle;

            // Calculate movement vector based on angle
            const dx = Math.cos(angle) * speed;
            const dy = Math.sin(angle) * speed;

            // Move head and tail along realistic streak vector
            positions[0] += dx;
            positions[1] += dy;
            positions[3] += dx;
            positions[4] += dy;

            star.geometry.attributes.position.needsUpdate = true;

            // Natural fade-in and graceful fade-out
            if (data.life <= 10) {
                star.material.opacity = data.life / 10;
            } else if (data.life > data.maxLife - 20) {
                star.material.opacity = (data.maxLife - data.life) / 20;
            } else {
                star.material.opacity = 0.95;
            }

            // Remove dead stars and dispose resources
            if (data.life >= data.maxLife) {
                scene.remove(star);
                star.geometry.dispose();
                star.material.dispose();
                shootingStars.splice(i, 1);
            }
        }

        // Update constellation stars - mouse repulsion (no connecting lines between stars)
        const positions = constellationPoints.geometry.attributes.position.array;
        const vector = new THREE.Vector3(mouseX, mouseY, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const mouse3D = camera.position.clone().add(dir.multiplyScalar(distance));

        for (let i = 0; i < constellationCount; i++) {
            const i3 = i * 3;
            const original = constellationOriginals[i];

            // Repulsion from mouse
            const dx = positions[i3] - mouse3D.x;
            const dy = positions[i3 + 1] - mouse3D.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 15) {
                const force = (15 - dist) / 15 * 0.03;
                original.vx += (dx / dist) * force;
                original.vy += (dy / dist) * force;
            }

            // Lerp back to original position
            original.vx += (original.x - positions[i3]) * 0.02;
            original.vy += (original.y - positions[i3 + 1]) * 0.02;

            // Damping
            original.vx *= 0.95;
            original.vy *= 0.95;

            // Apply velocity
            positions[i3] += original.vx;
            positions[i3 + 1] += original.vy;
        }

        constellationPoints.geometry.attributes.position.needsUpdate = true;

        // Adjust constellation opacity based on scroll
        constellationPoints.material.opacity = 0.8 - scrollProgress * 0.3;

        renderer.render(scene, camera);
    }

    // Handle resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Start animation
    animate();
})();
