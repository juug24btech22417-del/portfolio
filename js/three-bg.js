
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

    // Scroll state
    let scrollProgress = 0;
    let mouseX = 0;
    let mouseY = 0;

    // Listen for scroll
    window.addEventListener('scroll', () => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        scrollProgress = window.scrollY / docHeight;
    }, { passive: true });

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

    // Create 3 star layers
    const farStars = createStarLayer(4000, 0.6, 0.5, 0.00005, 200);
    const midStars = createStarLayer(1500, 1.0, 0.7, 0.00012, 150);
    const nearStars = createStarLayer(400, 1.8, 1.0, 0.0002, 100);

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
    // LAYER 3: SHOOTING STARS
    // ========================================

    const shootingStars = [];
    const maxShootingStars = 10;

    function createShootingStar() {
        // Create geometry with TWO line segments for thickness
        const geometry = new THREE.BufferGeometry();
        // 4 points: head, mid1, mid2, tail (making it a thicker line)
        const positions = new Float32Array(12);

        // Spawn from top-center of visible area
        const startX = (Math.random() - 0.5) * 40; // -20 to +20
        const startY = 15 + Math.random() * 10; // Upper area
        const startZ = 0; // Same Z as stars

        const trailLength = 20;
        const angle = -Math.PI / 4; // 45 degrees down-left

        // Calculate trail points
        const tailX = startX + Math.cos(angle) * trailLength;
        const tailY = startY + Math.sin(angle) * trailLength;

        // Create thick line by drawing two parallel lines
        const thickness = 0.3;
        const perpX = Math.sin(angle) * thickness;
        const perpY = -Math.cos(angle) * thickness;

        // Line 1
        positions[0] = startX + perpX; positions[1] = startY + perpY; positions[2] = startZ;
        positions[3] = tailX + perpX; positions[4] = tailY + perpY; positions[5] = startZ;
        // Line 2
        positions[6] = startX - perpX; positions[7] = startY - perpY; positions[8] = startZ;
        positions[9] = tailX - perpX; positions[10] = tailY - perpY; positions[11] = startZ;

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Bright white colors for all points
        const colors = new Float32Array(12);
        // Line 1 - head bright, tail dim
        colors[0] = 1.0; colors[1] = 1.0; colors[2] = 1.0;
        colors[3] = 0.3; colors[4] = 0.6; colors[5] = 1.0;
        // Line 2 - same
        colors[6] = 1.0; colors[7] = 1.0; colors[8] = 1.0;
        colors[9] = 0.3; colors[10] = 0.6; colors[11] = 1.0;
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });

        const line = new THREE.LineSegments(geometry, material);

        line.userData = {
            life: 0,
            maxLife: 80,
            speed: 0.6,
            active: true,
            angle: angle
        };

        return line;
    }

    function spawnShootingStar() {
        console.log('Attempting to spawn star, current count:', shootingStars.length);

        // Remove old stars if too many
        if (shootingStars.length >= maxShootingStars) {
            const old = shootingStars.shift();
            scene.remove(old);
            old.geometry.dispose();
            old.material.dispose();
            console.log('Removed old star');
        }

        const star = createShootingStar();
        shootingStars.push(star);
        scene.add(star);
        console.log('New star spawned at:', star.geometry.attributes.position.array.slice(0, 3));
    }

    // Spawn shooting stars more frequently
    function startShootingStars() {
        // Initial spawn
        setTimeout(() => spawnShootingStar(), 500);
        // Regular interval
        setInterval(() => {
            spawnShootingStar();
        }, 2000);
    }

    // Start after a short delay
    setTimeout(startShootingStars, 1000);
    console.log('Shooting star system initialized');


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

    // Lines for constellation connections
    const linesGeometry = new THREE.BufferGeometry();
    const maxConnections = constellationCount * 3;
    const linesPositions = new Float32Array(maxConnections * 2 * 3);
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(linesPositions, 3));

    const linesMaterial = new THREE.LineBasicMaterial({
        color: 0x4A6080,  // Muted blue-gray
        transparent: true,
        opacity: 0.15
    });

    const constellationLines = new THREE.LineSegments(linesGeometry, linesMaterial);
    scene.add(constellationLines);

    // ========================================
    // ANIMATION LOOP
    // ========================================

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const time = clock.getElapsedTime();
        const delta = clock.getDelta();

        // Camera scroll movement (0 to -80 over full scroll)
        const targetZ = -scrollProgress * 80;
        camera.position.z += (targetZ - camera.position.z) * 0.05;

        // Rotate star layers
        farStars.rotation.y += farStars.userData.speed;
        midStars.rotation.y += midStars.userData.speed;
        nearStars.rotation.y += nearStars.userData.speed;

        // Mouse parallax for near stars (very subtle)
        nearStars.rotation.x = mouseY * 0.003;
        nearStars.rotation.y += nearStars.userData.speed + mouseX * 0.003;

        // Update nebula clouds with realistic gas effect
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

        // Update shooting stars
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

            // Move all 4 points (2 lines)
            for (let j = 0; j < 4; j++) {
                positions[j * 3] += dx;
                positions[j * 3 + 1] += dy;
            }

            star.geometry.attributes.position.needsUpdate = true;

            // Fade out near end of life
            if (data.life > data.maxLife - 20) {
                star.material.opacity = (data.maxLife - data.life) / 20;
            }

            // Remove dead stars
            if (data.life >= data.maxLife) {
                scene.remove(star);
                shootingStars.splice(i, 1);
            }
        }

        // Update constellation - mouse repulsion
        const positions = constellationPoints.geometry.attributes.position.array;
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(mouseX, mouseY);

        // Map mouse to a point in 3D space
        const vector = new THREE.Vector3(mouseX, mouseY, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const mouse3D = camera.position.clone().add(dir.multiplyScalar(distance));

        let lineIndex = 0;
        const linesPos = constellationLines.geometry.attributes.position.array;

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

            // Draw connections
            let connections = 0;
            for (let j = i + 1; j < constellationCount; j++) {
                if (connections >= 3) break;

                const j3 = j * 3;
                const distTo = Math.sqrt(
                    Math.pow(positions[i3] - positions[j3], 2) +
                    Math.pow(positions[i3 + 1] - positions[j3 + 1], 2) +
                    Math.pow(positions[i3 + 2] - positions[j3 + 2], 2)
                );

                if (distTo < 8) {
                    const li6 = lineIndex * 6;
                    linesPos[li6] = positions[i3];
                    linesPos[li6 + 1] = positions[i3 + 1];
                    linesPos[li6 + 2] = positions[i3 + 2];
                    linesPos[li6 + 3] = positions[j3];
                    linesPos[li6 + 4] = positions[j3 + 1];
                    linesPos[li6 + 5] = positions[j3 + 2];
                    lineIndex++;
                    connections++;
                }
            }
        }

        // Clear unused lines
        for (let i = lineIndex * 6; i < maxConnections * 6; i++) {
            linesPos[i] = 0;
        }

        constellationPoints.geometry.attributes.position.needsUpdate = true;
        constellationLines.geometry.attributes.position.needsUpdate = true;

        // Adjust constellation opacity based on scroll
        constellationPoints.material.opacity = 0.8 - scrollProgress * 0.3;
        constellationLines.material.opacity = 0.15 - scrollProgress * 0.1;

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
