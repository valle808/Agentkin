// ALIEN DIMENSION 3.0: DARK VOID (Reverted & Enhanced)
// A dark, holographic neural grid. 
(function () {
    const canvas = document.getElementById('alien-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;

    // CONFIGURATION
    const CONFIG = {
        nodeCount: 150,
        connectionDist: 100,
        speed: 0.5,
        mouseForce: 300
    };

    let nodes = [];
    let mouse = { x: -100, y: -100, active: false };
    let time = 0;

    // RESIZE
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    });

    class Node {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * CONFIG.speed;
            this.vy = (Math.random() - 0.5) * CONFIG.speed;
            this.size = Math.random() * 2 + 1;
            this.hue = Math.random() * 360;
        }

        update() {
            // Movement
            this.x += this.vx;
            this.y += this.vy;

            // Bounce
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;

            // MOUSE INTERACTION: SWIRL / WARP
            if (mouse.active) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.mouseForce) {
                    const force = (CONFIG.mouseForce - dist) / CONFIG.mouseForce;
                    // Swirl Effect (Dark Theme)
                    const angle = Math.atan2(dy, dx);
                    const swirl = 1.5;

                    this.x += Math.cos(angle + swirl) * force * 5;
                    this.y += Math.sin(angle + swirl) * force * 5;

                    this.hue += 10;
                }
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            // Neon / Iridescent (High Saturation for Dark BG)
            const color = `hsla(${this.hue + time}, 100%, 70%, 0.8)`;
            ctx.fillStyle = color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    // INIT
    for (let i = 0; i < CONFIG.nodeCount; i++) nodes.push(new Node());

    // ANIMATION
    function animate() {
        // Trail Effect (Void)
        ctx.fillStyle = 'rgba(5, 5, 5, 0.2)';
        ctx.fillRect(0, 0, width, height);

        time += 0.5;

        nodes.forEach(node => {
            node.update();
            node.draw();
        });

        // CONNECTIONS (Neon)
        nodes.forEach((n1, i) => {
            for (let j = i + 1; j < nodes.length; j++) {
                const n2 = nodes[j];
                const dx = n1.x - n2.x;
                const dy = n1.y - n2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.connectionDist) {
                    const alpha = 1 - dist / CONFIG.connectionDist;
                    ctx.beginPath();
                    ctx.moveTo(n1.x, n1.y);
                    ctx.lineTo(n2.x, n2.y);
                    // Split Hues
                    const midHue = (n1.hue + n2.hue) / 2 + time;
                    ctx.strokeStyle = `hsla(${midHue}, 80%, 50%, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        });

        // Mouse Spotlight
        if (mouse.active) {
            const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 200);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
        }

        requestAnimationFrame(animate);
    }
    animate();
})();
