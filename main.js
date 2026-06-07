/* ============================================
   Mentes que Inspiram — Scrollytelling Engine
   Canvas 2D + Scroll-driven narrative
   v3: Infinite loop | Golden collapse | Logo glow
   ============================================ */

(function () {
    'use strict';

    // ── roundRect polyfill ────────────────────────
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            r = Math.min(r, Math.min(Math.abs(w), Math.abs(h)) / 2);
            this.beginPath();
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            this.closePath();
        };
    }

    // ── Utilities ─────────────────────────────────
    const lerp   = (a, b, t) => a + (b - a) * t;
    const clamp  = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
    const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
    const eio    = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;

    const SCENES = 8;

    // ── Canvas Setup ──────────────────────────────
    const canvas = document.getElementById('mentes-canvas');
    const ctx    = canvas.getContext('2d');
    let W, H, DPR;

    // Preload brand brain icon
    const brainImage = new Image();
    brainImage.src = 'img/logo-brain.svg';

    function resizeCanvas() {
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        W   = window.innerWidth;
        H   = window.innerHeight;
        canvas.width  = W * DPR;
        canvas.height = H * DPR;
        canvas.style.width  = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // ── Dust Particles ────────────────────────────
    function makeDust(n) {
        const p = [];
        for (let i = 0; i < n; i++) p.push({
            x: Math.random(), y: Math.random(),
            vx: (Math.random() - .5) * .00015,
            vy: -(Math.random() * .0003 + .0001),
            r:   0.8 + Math.random() * 1.8, // Highlighted sizes (was .4 + 1.2)
            a:   0.12 + Math.random() * 0.18, // Highlighted opacities (was .04 + .10)
            ph:  Math.random() * Math.PI * 2,
        });
        return p;
    }
    const dust = makeDust(160);

    // ── Network Nodes (Ecossistema) ───────────────
    const NODE_DATA = [
        { lbl: 'Programa',    icon: 'play'       },
        { lbl: 'Livro',       icon: 'book'       },
        { lbl: 'Cursos',      icon: 'mortarboard'},
        { lbl: 'Eventos',     icon: 'calendar'   },
        { lbl: 'Parcerias',   icon: 'handshake'  },
        { lbl: 'Consultorias',icon: 'briefcase'  },
        { lbl: 'Projetos',    icon: 'star'       },
    ];
    const nodes = NODE_DATA.map((nd, i) => {
        const a = (i / NODE_DATA.length) * Math.PI * 2 - Math.PI / 2;
        return { 
            lbl: nd.lbl, 
            icon: nd.icon, 
            bx: Math.cos(a), 
            by: Math.sin(a), 
            phase: Math.random() * Math.PI * 2,
            scale: 1.0,
            targetScale: 1.0
        };
    });

    // ── Mouse tracking for Ecosystem Scene ────────
    let mouseX = -9999;
    let mouseY = -9999;
    window.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
    window.addEventListener('mouseleave', () => {
        mouseX = -9999;
        mouseY = -9999;
    });
    window.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.touches[0].clientX - rect.left;
            mouseY = e.touches[0].clientY - rect.top;
        }
    }, { passive: true });
    window.addEventListener('scroll', () => {
        mouseX = -9999;
        mouseY = -9999;
    }, { passive: true });

    // ── Ripple pool ───────────────────────────────
    const ripples = Array.from({length: 5}, (_, i) => ({ t: i / 5 }));

    // ── State ─────────────────────────────────────
    let scrollProgress     = 0;
    let targetProgress     = 0;
    let time               = 0;
    let lastNow            = performance.now();
    let siteVisible        = false;
    let metricsAnimated    = false;
    let typewriterDone     = false;
    let currentScene       = -1;
    let loopTransition     = null;  // { phase, startTime }
    let heroSparks         = [];
    let heroAnimated       = false;

    // ── Scroll Driver ─────────────────────────────
    const driver = document.getElementById('scroll-driver');

    function onScroll() {
        if (loopTransition) return; // block scroll updates during loop
        const max = driver.offsetHeight - window.innerHeight;
        targetProgress = clamp(window.scrollY / Math.max(max, 1), 0, 1);
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    // ── Video ─────────────────────────────────────
    const programVideo = document.getElementById('program-video');
    let videoFadeTarget      = 0;
    let videoCurrentOpacity  = 0;

    function updateProgramVideo(idx, p) {
        if (!programVideo) return;
        let target = 0;
        // Video in O Programa (scene 3): card frame
        if (idx === 3) {
            target = smooth(0.05, 0.35, p) * (1 - smooth(0.8, 0.98, p));
        }
        videoFadeTarget = target;
    }

    // ── Hero Sparks (canvas) ──────────────────────
    let logoCenterX = 0.5;
    let logoCenterY = 0.46;

    function updateLogoCenter() {
        const logoWrap = document.querySelector('.scene-logo-wrap');
        if (logoWrap) {
            const rect = logoWrap.getBoundingClientRect();
            // normalized coordinates relative to screen bounds
            logoCenterX = (rect.left + rect.width / 2) / Math.max(W, 1);
            logoCenterY = (rect.top + rect.height / 2) / Math.max(H, 1);
        } else {
            logoCenterX = 0.5;
            logoCenterY = 0.46;
        }
    }

    function initHeroSparks() {
        if (heroAnimated) return;
        heroAnimated = true;
        updateLogoCenter();
        const sx = logoCenterX;
        const sy = logoCenterY;
        heroSparks = [];
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2 + (Math.random() - .5) * .4;
            const speed = .0012 + Math.random() * .002;
            heroSparks.push({
                x: sx, y: sy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed * .6,
                life: 1,
                decay: .012 + Math.random() * .01,
                size: 1.5 + Math.random() * 2.5,
            });
        }
        // Trigger logo glow animation
        const logo = document.querySelector('.story-logo');
        if (logo) {
            logo.classList.remove('logo-entering');
            void logo.offsetWidth; // reflow to restart animation
            logo.classList.add('logo-entering');
        }
    }

    function drawHeroSparks() {
        if (!heroSparks.length) return;
        heroSparks = heroSparks.filter(s => {
            s.x  += s.vx;
            s.y  += s.vy;
            s.vy += .000025; // slight gravity
            s.life -= s.decay;
            if (s.life <= 0) return false;

            const r   = s.size * s.life;
            const px  = s.x * W;
            const py  = s.y * H;

            const grd = ctx.createRadialGradient(px, py, 0, px, py, r * 4);
            grd.addColorStop(0, `rgba(255,240,185,${s.life * .85})`);
            grd.addColorStop(1, 'rgba(201,168,76,0)');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(px, py, r * 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,242,200,${s.life * .9})`;
            ctx.fill();
            return true;
        });
    }

    // ── Scroll Tracker ────────────────────────────
    const trackerDots  = document.querySelectorAll('.tracker-dot');
    const scrollTracker = document.getElementById('scroll-tracker');

    function updateScrollTracker(idx) {
        trackerDots.forEach((dot, i) => dot.classList.toggle('active', i === idx));
    }

    // ── Scene Progress Helper ─────────────────────
    function getSectionProgress(sp) {
        const sz  = 1 / SCENES;
        const idx = clamp(Math.floor(sp / sz), 0, SCENES - 1);
        const p   = clamp((sp % sz) / sz, 0, 1);
        return { idx, p };
    }

    // ── Scene Text Management ─────────────────────
    const scenes       = Array.from(document.querySelectorAll('.story-scene'));
    const storyWrapper = document.getElementById('story-wrapper');
    const skipBtn      = document.getElementById('skip-btn');
    const siteContent  = document.getElementById('site-content');

    let preloaderFinished = false;

    function updateScenes(idx, p) {
        // Hero animation: trigger once scene 0 is sufficiently visible
        if (idx === 0 && !heroAnimated && preloaderFinished) {
            initHeroSparks();
        }

        if (idx !== currentScene) {
            if (currentScene >= 0) triggerSceneFlash();
            if (currentScene >= 0 && scenes[currentScene]) scenes[currentScene].classList.remove('active');
            if (scenes[idx]) scenes[idx].classList.add('active');
            currentScene = idx;

            if (preloaderFinished) {
                if (idx === 0 && !typewriterDone) initTypewriter();
                if (idx === 1) animateTraits();
                if (idx === 3) animatePillars();
                if (idx === 4) animateList();
                if (idx === 5 && !metricsAnimated) animateMetrics();
            }
            updateScrollTracker(idx);
        }

        scenes.forEach((el, i) => {
            if (i === idx) {
                let op;
                if (i === 0) {
                    // Fully visible at 0, fades out past 0.85
                    op = 1 - smooth(0.85, 1, p);
                } else if (i === SCENES - 1) {
                    op = smooth(0.1, 0.35, p);
                } else {
                    op = smooth(0.05, 0.22, p) * (1 - smooth(0.82, 0.98, p));
                }
                el.style.opacity = op;
                const cnt = el.querySelector('.scene-inner');
                if (cnt) cnt.style.transform = `translateY(${(0.5 - p) * 28}px)`;
            } else {
                el.style.opacity = 0;
            }
        });

        updateProgramVideo(idx, p);
    }

    // ── Typewriter ────────────────────────────────
    function initTypewriter() {
        typewriterDone = true;
        const line1El = document.getElementById('tagline-1');
        const line2El = document.getElementById('tagline-2');
        if (!line1El || !line2El) return;

        const line1 = 'Algumas conversas não terminam';
        const line2 = 'quando o episódio acaba.';
        let i = 0, phase = 1;
        line1El.innerHTML = '<span class="tagline-cursor"></span>';
        line2El.innerHTML = '';

        function typeChar() {
            if (phase === 1) {
                if (i < line1.length) {
                    const cur = line1El.querySelector('.tagline-cursor');
                    line1El.textContent = line1.slice(0, i + 1);
                    if (cur) line1El.appendChild(cur);
                    else line1El.insertAdjacentHTML('beforeend', '<span class="tagline-cursor"></span>');
                    i++;
                    setTimeout(typeChar, 55);
                } else {
                    const cur = line1El.querySelector('.tagline-cursor');
                    if (cur) cur.remove();
                    i = 0; phase = 2;
                    line2El.innerHTML = '<span class="tagline-cursor"></span>';
                    setTimeout(typeChar, 280);
                }
            } else {
                if (i < line2.length) {
                    const cur = line2El.querySelector('.tagline-cursor');
                    line2El.textContent = line2.slice(0, i + 1);
                    if (cur) line2El.appendChild(cur);
                    else line2El.insertAdjacentHTML('beforeend', '<span class="tagline-cursor"></span>');
                    i++;
                    setTimeout(typeChar, 65);
                }
            }
        }
        setTimeout(typeChar, 600);
    }

    // ── Scene Flash ───────────────────────────────
    let flashEl = null;
    function triggerSceneFlash() {
        if (!flashEl) {
            flashEl = document.createElement('div');
            flashEl.id = 'scene-flash';
            document.body.appendChild(flashEl);
        }
        flashEl.style.transition = 'none';
        flashEl.style.opacity = '1';
        requestAnimationFrame(() => {
            flashEl.style.transition = 'opacity 0.6s ease';
            flashEl.style.opacity = '0';
        });
    }

    // ── List Animations ───────────────────────────
    function animateTraits() {
        document.querySelectorAll('.trait').forEach((el, i) => {
            el.classList.remove('visible');
            setTimeout(() => el.classList.add('visible'), 200 + i * 150);
        });
    }
    function animatePillars() {
        const frame = document.querySelector('.scene-video-frame');
        if (frame) {
            frame.classList.remove('visible');
            setTimeout(() => frame.classList.add('visible'), 400);
        }
        document.querySelectorAll('.scene-pillar').forEach((el, i) => {
            el.classList.remove('visible');
            setTimeout(() => el.classList.add('visible'), 200 + i * 200);
        });
    }
    function animateList() {
        document.querySelectorAll('.scene-list li').forEach((el, i) => {
            el.classList.remove('visible');
            setTimeout(() => el.classList.add('visible'), 100 + i * 120);
        });
    }

    // ── Metrics Animation ─────────────────────────
    function animateMetrics() {
        metricsAnimated = true;
        document.querySelectorAll('.metric-card').forEach((card, ci) => {
            setTimeout(() => card.classList.add('visible'), 200 + ci * 180);
        });
        document.querySelectorAll('.metric-stat__val[data-target]').forEach((el, i) => {
            setTimeout(() => {
                const target = +el.dataset.target;
                const isK    = el.dataset.format === 'k';
                animateCountUp(el, target, isK, 1800);
            }, 350 + i * 100);
        });
    }

    function animateCountUp(el, target, isK, dur) {
        const start = performance.now();
        function step(now) {
            const t = clamp((now - start) / dur, 0, 1);
            const v = Math.round(eio(t) * target);
            el.textContent = isK ? (v >= 1000 ? (v/1000).toFixed(0)+'K' : v) : v;
            if (t < 1) requestAnimationFrame(step);
            else el.textContent = isK ? (target >= 1000 ? (target/1000).toFixed(0)+'K' : target) : target;
        }
        requestAnimationFrame(step);
    }

    // ══════════════════════════════════════════════
    // LOOP TRANSITION — "Colapso e Renascimento"
    // ══════════════════════════════════════════════

    function triggerLoopTransition() {
        if (loopTransition || siteVisible) return;
        loopTransition = { phase: 'fill', startTime: performance.now() };
    }

    function doLoopReset() {
        // Scroll to top (invisible during gold overlay)
        window.scrollTo(0, 0);
        scrollProgress  = 0;
        targetProgress  = 0;
        time            = 0;
        metricsAnimated = false;
        typewriterDone  = false;
        heroAnimated    = false;
        heroSparks      = [];
        currentScene    = -1;
        videoFadeTarget = 0;

        // Reset DOM stagger animations
        document.querySelectorAll('.trait, .scene-pillar, .scene-list li')
            .forEach(el => el.classList.remove('visible'));
        document.querySelectorAll('.metric-card')
            .forEach(el => el.classList.remove('visible'));

        // Reset tagline
        const t1 = document.getElementById('tagline-1');
        const t2 = document.getElementById('tagline-2');
        if (t1) t1.innerHTML = '';
        if (t2) t2.innerHTML = '';

        // Reset logo class so animation can replay
        const logo = document.querySelector('.story-logo');
        if (logo) logo.classList.remove('logo-entering');

        // Reset scenes
        scenes.forEach(s => {
            s.classList.remove('active');
            s.style.opacity = 0;
        });
    }

    // Draws the golden wave overlay on canvas
    function drawLoopTransition(now) {
        if (!loopTransition) return;

        const cx  = W / 2, cy = H / 2;
        const diag = Math.sqrt(W * W + H * H);
        const maxR = diag / 2 * 1.08;
        const elapsed = (now - loopTransition.startTime) / 1000;

        function goldFill(radius, alpha) {
            if (radius <= 0 || alpha <= 0) return;
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(radius, 1));
            grd.addColorStop(0,   `rgba(245,225,165,${alpha})`);
            grd.addColorStop(0.45,`rgba(201,168,76,${alpha * .96})`);
            grd.addColorStop(1,   `rgba(145,100,25,${alpha * .88})`);
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();
        }

        if (loopTransition.phase === 'fill') {
            const dur = 0.58;
            const t   = clamp(elapsed / dur, 0, 1);
            const ease = eio(t);
            goldFill(ease * maxR, ease * .94);

            if (t >= 1) {
                loopTransition = { phase: 'hold', startTime: performance.now() };
                doLoopReset();
            }

        } else if (loopTransition.phase === 'hold') {
            goldFill(maxR, .94);
            if (elapsed >= 0.08) {
                loopTransition = { phase: 'reveal', startTime: performance.now() };
            }

        } else if (loopTransition.phase === 'reveal') {
            const dur  = 0.7;
            const t    = clamp(elapsed / dur, 0, 1);
            const ease = 1 - eio(t);
            goldFill(ease * maxR, ease * .94);
            if (t >= 1) loopTransition = null;
        }
    }

    // Clickable scroll tracker dots
    trackerDots.forEach((dot) => {
        dot.addEventListener('click', () => {
            if (loopTransition) return;
            const targetScene = parseInt(dot.getAttribute('data-scene'));
            const maxScroll = driver.offsetHeight - window.innerHeight;
            
            let targetP = 0;
            if (targetScene === 0) {
                targetP = 0;
            } else if (targetScene === SCENES - 1) {
                targetP = 0.95;
            } else {
                targetP = (targetScene + 0.5) / SCENES;
            }
            
            window.scrollTo({
                top: targetP * maxScroll,
                behavior: 'smooth'
            });
        });
    });

    // ── Preloader Simulation ──────────────────────
    const preloader = document.getElementById('preloader');
    const preloaderBar = document.querySelector('.preloader__bar');

    function simulatePreloader() {
        const start = performance.now();
        const duration = 1800; // 1.8 seconds

        function updateProgress(now) {
            const elapsed = now - start;
            const progress = clamp(elapsed / duration, 0, 1);
            if (preloaderBar) {
                preloaderBar.style.width = `${progress * 100}%`;
            }

            if (progress < 1) {
                requestAnimationFrame(updateProgress);
            } else {
                setTimeout(() => {
                    if (preloader) {
                        preloader.classList.add('loaded');
                    }
                    document.body.classList.remove('loading');
                    preloaderFinished = true;

                    // Trigger initial scene effects
                    initHeroSparks();
                    initTypewriter();
                }, 200);
            }
        }
        requestAnimationFrame(updateProgress);
    }
    
    // Start preloader
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', simulatePreloader);
    } else {
        simulatePreloader();
    }

    // ══════════════════════════════════════════════
    // CANVAS DRAWING ENGINE
    // ══════════════════════════════════════════════

    function drawBackground(sp) {
        const cx = W/2, cy = H/2;
        const t4 = smooth(3/SCENES, 5/SCENES, sp);
        const t7 = smooth(6/SCENES, 1, sp);
        const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W*.8);
        const r0 = Math.round(lerp(lerp(11,20,t4),25,t7));
        const g0 = Math.round(lerp(lerp(18,10,t4),20,t7));
        const b0 = Math.round(lerp(lerp(32,38,t4),28,t7));
        bg.addColorStop(0, `rgb(${r0+10},${g0+12},${b0+8})`);
        bg.addColorStop(1, `rgb(${r0},${g0},${b0})`);
        ctx.fillStyle = bg;
        ctx.fillRect(0,0,W,H);
    }

    function drawDust(sp) {
        const goldMix = smooth(0.6,1,sp);
        dust.forEach(p => {
            p.y += p.vy;
            p.x += p.vx + Math.sin(time*.4+p.ph)*.00003;
            if (p.y < -0.05) { p.y=1.05; p.x=Math.random(); }
            if (p.x<-0.05||p.x>1.05) { p.x=Math.random(); p.y=Math.random(); }
            const flicker = 0.65+Math.sin(time*1.8+p.ph)*.35;
            const alpha   = p.a*flicker;
            const r = Math.round(lerp(180,201,goldMix));
            const g = Math.round(lerp(160,168,goldMix));
            const b = Math.round(lerp(220,76,goldMix));
            ctx.beginPath();
            ctx.arc(p.x*W, p.y*H, p.r, 0, Math.PI*2);
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.fill();
        });
    }

    // ── Scene 0: Hero ─────────────────────────────
    function drawHero(p) {
        updateLogoCenter();
        const cx = logoCenterX * W;
        const cy = logoCenterY * H;
        const R  = Math.min(W,H)*.22;
        const pulse = 1+Math.sin(time*1.3)*.04;

        const aura = ctx.createRadialGradient(cx,cy,0,cx,cy,R*2.2*pulse);
        aura.addColorStop(0, `rgba(201,168,76,${.06*smooth(0,.6,p)})`);
        aura.addColorStop(.5,`rgba(107,63,160,${.04*smooth(0,.6,p)})`);
        aura.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = aura;
        ctx.fillRect(0,0,W,H);

        const orbReveal = smooth(.2,.7,p);
        if (orbReveal > 0) {
            for (let i=0; i<24; i++) {
                const a  = (i/24)*Math.PI*2+time*.15;
                const r  = R*(1.1+Math.sin(time*.5+i*.8)*.08);
                const ox = cx+Math.cos(a)*r;
                const oy = cy+Math.sin(a)*r*.55;
                const sz = .8+Math.sin(time+i*.7)*.4;
                const al = orbReveal*(.3+Math.sin(time*1.2+i)*.15);
                ctx.beginPath();
                ctx.arc(ox,oy,sz,0,Math.PI*2);
                ctx.fillStyle = `rgba(201,168,76,${al})`;
                ctx.fill();
            }
        }

        const strokeP = smooth(0,.4,p);
        if (strokeP > 0) {
            ctx.beginPath();
            ctx.arc(cx,cy,R*.92,-Math.PI/2,-Math.PI/2+Math.PI*2*strokeP);
            ctx.strokeStyle = `rgba(201,168,76,${.18*strokeP})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Canvas hero sparks (burst on entry)
        drawHeroSparks();
    }

    // ── Scene 1: Woman ────────────────────────────
    function drawWoman(p) {
        const cx = W/2, cy = H/2;
        const R  = Math.min(W,H)*.35;
        const pulse = 1+Math.sin(time*1)*.025;
        const ring  = smooth(0,.5,p);

        const bg = ctx.createRadialGradient(cx,cy,0,cx,cy,R*1.8);
        bg.addColorStop(0,  `rgba(26,53,96,${.2*ring})`);
        bg.addColorStop(.5, `rgba(107,63,160,${.08*ring})`);
        bg.addColorStop(1,  'rgba(0,0,0,0)');
        ctx.fillStyle = bg;
        ctx.fillRect(0,0,W,H);

        for (let i=0; i<4; i++) {
            const delay = i*.12;
            const r = smooth(delay,delay+.5,p)*R*pulse*(0.4+i*.2);
            if (r<1) continue;
            const al = (1-i*.22)*ring*.25;
            ctx.beginPath();
            ctx.arc(cx,cy,r,0,Math.PI*2);
            ctx.strokeStyle = i%2===0?`rgba(201,168,76,${al})`:`rgba(107,63,160,${al*.7})`;
            ctx.lineWidth = 1-i*.15;
            ctx.stroke();
        }

        const dotR = R*.92*pulse;
        for (let i=0; i<12; i++) {
            const a  = (i/12)*Math.PI*2+time*.2;
            const ox = cx+Math.cos(a)*dotR;
            const oy = cy+Math.sin(a)*dotR*.6;
            const al = ring*(.2+Math.sin(time*1.5+i)*.1);
            ctx.beginPath();
            ctx.arc(ox,oy,1.2,0,Math.PI*2);
            ctx.fillStyle = `rgba(201,168,76,${al})`;
            ctx.fill();
        }
    }

    // ── Scene 2: Talk (ripples) ───────────────────
    function drawTalk(p) {
        const cx = W/2, cy = H/2;
        const maxR = Math.min(W,H)*.48;
        ripples.forEach((rp,i) => {
            rp.t = (rp.t+.003)%1;
            const r  = rp.t*maxR;
            const al = smooth(0,.3,p)*(1-rp.t)*.4;
            ctx.beginPath();
            ctx.ellipse(cx,cy,r,r*.55,0,0,Math.PI*2);
            ctx.strokeStyle = i%2===0?`rgba(201,168,76,${al})`:`rgba(107,63,160,${al*.8})`;
            ctx.lineWidth   = 1.5-rp.t;
            ctx.stroke();
        });
        const coreA = smooth(.1,.5,p)*(.6+Math.sin(time*2)*.2);
        const core  = ctx.createRadialGradient(cx,cy,0,cx,cy,70);
        core.addColorStop(0,`rgba(201,168,76,${coreA})`);
        core.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(cx,cy,70,0,Math.PI*2);
        ctx.fill();
    }

    // ── Scene 3: Program (crystal + dark overlay) ─
    function drawProgram(p) {
        const isDesktop = W > 900;
        const cx = isDesktop ? W * 0.32 : W / 2;
        const cy = H/2;
        const R  = Math.min(W,H)*.22;
        const grow = smooth(0,.6,p);

        ctx.save();
        ctx.translate(cx,cy);
        const sides = 6;
        ctx.beginPath();
        for (let i=0; i<sides; i++) {
            const a = (i/sides)*Math.PI*2-Math.PI/6;
            const r = R*grow*(1+Math.sin(time*.8+i)*.015);
            i===0?ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r):ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(201,168,76,${grow*.5})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const inner = R*.55*grow;
        for (let i=0; i<sides; i++) {
            const a=(i/sides)*Math.PI*2-Math.PI/6;
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.lineTo(Math.cos(a)*inner,Math.sin(a)*inner);
            ctx.strokeStyle=`rgba(107,63,160,${grow*.35})`;
            ctx.lineWidth=.7;
            ctx.stroke();
        }

        const cG = ctx.createRadialGradient(0,0,0,0,0,R*.25*grow);
        cG.addColorStop(0,`rgba(201,168,76,${grow*.6})`);
        cG.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=cG;
        ctx.beginPath();
        ctx.arc(0,0,R*.25*grow,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
    }

    // ── Canvas Icon Drawers ───────────────────────
    function drawIconPlay(c,x,y,s,a){c.save();c.translate(x,y);c.globalAlpha=a;c.fillStyle='rgba(201,168,76,1)';c.beginPath();c.moveTo(-s*.35,-s*.45);c.lineTo(s*.5,0);c.lineTo(-s*.35,s*.45);c.closePath();c.fill();c.restore();}
    function drawIconBook(c,x,y,s,a){c.save();c.translate(x,y);c.globalAlpha=a;c.strokeStyle='rgba(201,168,76,1)';c.lineWidth=1.5;c.lineCap='round';const w=s*.7,h=s*.6;c.beginPath();c.rect(-w*.55,-h/2,w*.5,h);c.stroke();c.beginPath();c.rect(w*.05,-h/2,w*.5,h);c.stroke();c.restore();}
    function drawIconMortarboard(c,x,y,s,a){c.save();c.translate(x,y);c.globalAlpha=a;c.strokeStyle='rgba(201,168,76,1)';c.lineWidth=1.5;c.lineCap='round';const z=s*.55;c.beginPath();c.moveTo(0,-z*.5);c.lineTo(z,0);c.lineTo(0,z*.35);c.lineTo(-z,0);c.closePath();c.stroke();c.beginPath();c.moveTo(z*.6,z*.15);c.lineTo(z*.6,z*.75);c.stroke();c.restore();}
    function drawIconCalendar(c,x,y,s,a){c.save();c.translate(x,y);c.globalAlpha=a;c.strokeStyle='rgba(201,168,76,1)';c.lineWidth=1.5;c.lineCap='round';const w=s*.7,h=s*.65;c.beginPath();c.rect(-w/2,-h*.3,w,h);c.stroke();c.beginPath();c.moveTo(-w/2,-h*.3+h*.28);c.lineTo(w/2,-h*.3+h*.28);c.stroke();[-0.22,0.22].forEach(dx=>{c.beginPath();c.arc(dx*w,h*.15,2,0,Math.PI*2);c.fillStyle=`rgba(201,168,76,${a})`;c.fill();});c.restore();}
    function drawIconHandshake(c,x,y,s,a){c.save();c.translate(x,y);c.globalAlpha=a;c.strokeStyle='rgba(201,168,76,1)';c.lineWidth=1.5;c.lineCap='round';const r=s*.3;c.beginPath();c.arc(-r,0,r*.55,0,Math.PI*2);c.stroke();c.beginPath();c.arc(r,0,r*.55,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(-r*.45,0);c.lineTo(r*.45,0);c.stroke();c.restore();}
    function drawIconBriefcase(c,x,y,s,a){c.save();c.translate(x,y);c.globalAlpha=a;c.strokeStyle='rgba(201,168,76,1)';c.lineWidth=1.5;c.lineCap='round';const w=s*.7,h=s*.5;c.beginPath();c.rect(-w/2,-h*.3,w,h);c.stroke();c.beginPath();c.moveTo(-w*.22+2,-h*.65);c.arcTo(w*.22,-h*.65,w*.22,-h*.3,2);c.lineTo(w*.22,-h*.3);c.lineTo(-w*.22,-h*.3);c.lineTo(-w*.22,-h*.65);c.closePath();c.stroke();c.restore();}
    function drawIconStar(c,x,y,s,a){c.save();c.translate(x,y);c.globalAlpha=a;c.strokeStyle='rgba(201,168,76,1)';c.fillStyle='rgba(201,168,76,0.25)';c.lineWidth=1.2;const oR=s*.45,iR=s*.2;c.beginPath();for(let i=0;i<10;i++){const ang=(i*Math.PI)/5-Math.PI/2,r=i%2===0?oR:iR;i===0?c.moveTo(Math.cos(ang)*r,Math.sin(ang)*r):c.lineTo(Math.cos(ang)*r,Math.sin(ang)*r);}c.closePath();c.fill();c.stroke();c.restore();}

    const iconDrawers = {play:drawIconPlay,book:drawIconBook,mortarboard:drawIconMortarboard,calendar:drawIconCalendar,handshake:drawIconHandshake,briefcase:drawIconBriefcase,star:drawIconStar};

    // ── Scene 4: Ecosystem Network ────────────────
    function drawEcosystem(p) {
        const isDesktop = W > 900;
        const cx = isDesktop ? W * 0.63 : W / 2;
        const cy = isDesktop ? H * 0.45 : H * 0.38;
        const R  = Math.min(W,H)*.3;
        const grow = smooth(0,.7,p);

        const coreGlow = ctx.createRadialGradient(cx,cy,0,cx,cy,80);
        coreGlow.addColorStop(0,`rgba(201,168,76,${grow*.35})`);
        coreGlow.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=coreGlow;
        ctx.beginPath();ctx.arc(cx,cy,80,0,Math.PI*2);ctx.fill();

        // Render stylized gold brain in the center instead of dot/text
        const brainW = Math.max(50, Math.min(W, H) * 0.08) * grow;
        const brainH = brainW / 1.602;
        if (brainW > 0 && brainImage.complete) {
            ctx.save();
            ctx.globalAlpha = smooth(0.2, 0.7, grow);
            ctx.drawImage(brainImage, cx - brainW / 2, cy - brainH / 2, brainW, brainH);
            ctx.restore();
        }

        nodes.forEach((nd,i)=>{
            const delay=i/nodes.length*.5;
            const ap=smooth(delay,delay+.35,grow);
            if(ap<=0)return;
            const float=Math.sin(time*.7+nd.phase)*.03;
            const nx=cx+nd.bx*R*ap;
            const ny=cy+nd.by*R*.65*ap+float*R;

            // Hover / touch scaling check
            let isHovered = false;
            if (ap > 0.8) {
                const dx = mouseX - nx;
                const dy = mouseY - (ny - 12);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 42) {
                    isHovered = true;
                }
            }
            nd.targetScale = isHovered ? 1.38 : 1.0;
            nd.scale = lerp(nd.scale, nd.targetScale, 0.15);

            ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(nx,ny);
            const lg=ctx.createLinearGradient(cx,cy,nx,ny);
            lg.addColorStop(0,`rgba(201,168,76,${ap*.5})`);
            lg.addColorStop(1,`rgba(107,63,160,${ap*.25})`);
            ctx.strokeStyle=lg;ctx.lineWidth=(1-i*.05)*nd.scale;ctx.stroke();

            const nr=(4+Math.sin(time*1.2+nd.phase)*1)*nd.scale;
            const ng=ctx.createRadialGradient(nx,ny,0,nx,ny,nr*4);
            ng.addColorStop(0,`rgba(201,168,76,${ap*.7})`);ng.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=ng;ctx.beginPath();ctx.arc(nx,ny,nr*4,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.arc(nx,ny,nr,0,Math.PI*2);ctx.fillStyle=`rgba(228,213,160,${ap})`;ctx.fill();

            const iconSize=Math.max(12,Math.min(W,H)*.036)*nd.scale;
            const iconY=ny-nr-iconSize*.85;
            const drawer=iconDrawers[nd.icon];
            if(drawer)drawer(ctx,nx,iconY,iconSize,ap*.85);

            if(ap>.2){
                ctx.save();
                ctx.globalAlpha=smooth(.2,.6,ap);
                const fs=Math.max(10,Math.min(W,H)*.022)*nd.scale;
                ctx.font=`${isHovered ? '500' : '400'} ${fs}px Montserrat,sans-serif`;
                ctx.fillStyle=isHovered ? 'rgba(255,255,255,1)' : 'rgba(232,213,160,1)';
                ctx.textAlign='center';ctx.textBaseline='top';
                ctx.fillText(nd.lbl,nx,ny+nr+6);
                ctx.restore();
            }
        });
    }

    // ── Scene 5: Audience ─────────────────────────
    function drawAudience(p) {
        const cx=W/2,cy=H/2;
        const count=Math.round(smooth(0,.8,p)*200);
        const spread=Math.min(W,H)*.38;
        for(let i=0;i<count;i++){
            const a=(i/count)*Math.PI*2+time*.03;
            const r=spread*((.3+(i/count)*.7)+Math.sin(time*.5+i)*.05);
            const x=cx+Math.cos(a+i*.7)*r;
            const y=cy+Math.sin(a+i*.5)*r*.55;
            const al=smooth(0,.5,p)*(.3+Math.sin(time+i*.3)*.15);
            const sz=.6+Math.sin(i*.9+time)*.4;
            ctx.beginPath();ctx.arc(x,y,sz,0,Math.PI*2);
            ctx.fillStyle=i%3===0?`rgba(201,168,76,${al})`:i%3===1?`rgba(155,111,208,${al*.7})`:`rgba(176,184,200,${al*.4})`;
            ctx.fill();
        }
        const pa=smooth(.2,.7,p);
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,120);
        g.addColorStop(0,`rgba(201,168,76,${pa*.18})`);g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    }

    // ── Scene 6: Partners (constellation) ────────
    function drawPartners(p) {
        const cx=W/2,cy=H/2;
        const R=Math.min(W,H)*.38;
        const rev=smooth(0,.7,p);
        const stars=[];
        for(let i=0;i<40;i++){
            const seed=i*137.508;
            const a=(seed%360)*Math.PI/180;
            const r=R*(.2+((seed*7)%80)/100);
            stars.push({x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r*.6,r:.5+(i%3)*.5});
        }
        [[0,5],[5,12],[12,20],[20,7],[7,3],[3,15],[15,28],[28,0]].forEach(([a,b])=>{
            if(!stars[a]||!stars[b])return;
            ctx.beginPath();ctx.moveTo(stars[a].x,stars[a].y);ctx.lineTo(stars[b].x,stars[b].y);
            ctx.strokeStyle=`rgba(201,168,76,${rev*.15})`;ctx.lineWidth=.5;ctx.stroke();
        });
        stars.forEach((s,i)=>{
            const delay=i/40*.5;
            const ap=smooth(delay,delay+.3,rev);
            if(ap<=0)return;
            const pulse=1+Math.sin(time*1.5+i*.8)*.3;
            const g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*5*pulse);
            g.addColorStop(0,`rgba(228,213,160,${ap*.9})`);g.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=g;ctx.beginPath();ctx.arc(s.x,s.y,s.r*5*pulse,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.arc(s.x,s.y,s.r*pulse,0,Math.PI*2);ctx.fillStyle=`rgba(228,213,160,${ap})`;ctx.fill();
        });
    }

    // ── Scene 7: CTA — pulsing golden rings ───────
    function drawCTA(p) {
        const cx=W/2,cy=H/2;
        const pulse=smooth(0,.5,p);

        const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H));
        bg.addColorStop(0,`rgba(201,168,76,${pulse*.08})`);
        bg.addColorStop(.4,`rgba(107,63,160,${pulse*.04})`);
        bg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

        for(let i=0;i<3;i++){
            const t=((time*.25+i/3)%1);
            const r=t*Math.min(W,H)*.6;
            const al=pulse*(1-t)*.15;
            ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
            ctx.strokeStyle=`rgba(201,168,76,${al})`;ctx.lineWidth=1.5;ctx.stroke();
        }

        const hal=ctx.createRadialGradient(cx,cy,0,cx,cy,200);
        hal.addColorStop(0,`rgba(201,168,76,${pulse*.25})`);hal.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=hal;ctx.beginPath();ctx.arc(cx,cy,200,0,Math.PI*2);ctx.fill();
    }

    // ── Main Draw ─────────────────────────────────
    function draw(now) {
        const { idx, p } = getSectionProgress(scrollProgress);

        ctx.clearRect(0,0,W,H);
        drawBackground(scrollProgress);
        drawDust(scrollProgress);

        switch(idx){
            case 0: drawHero(p);      break;
            case 1: drawWoman(p);     break;
            case 2: drawTalk(p);      break;
            case 3: drawProgram(p);   break;
            case 4: drawEcosystem(p); break;
            case 5: drawAudience(p);  break;
            case 6: drawPartners(p);  break;
            case 7: drawCTA(p);       break;
        }

        updateScenes(idx, p);

        // ── Loop transition overlay (top layer) ────
        if (loopTransition) {
            drawLoopTransition(now);
        }

        // ── Trigger loop at end (replaces auto-reveal) ──
        if (scrollProgress >= 0.985 && !loopTransition && !siteVisible) {
            triggerLoopTransition();
        }
    }

    // ── Animation Loop ────────────────────────────
    function tick(now) {
        if (!siteVisible) {
            const dt = Math.min((now - lastNow) / 1000, .05);
            lastNow = now;
            time   += dt;
            scrollProgress = lerp(scrollProgress, targetProgress, .07);
            draw(now);

            // Smooth video opacity
            if (programVideo) {
                videoCurrentOpacity = lerp(videoCurrentOpacity, videoFadeTarget, .05);
                programVideo.style.opacity = videoCurrentOpacity;
            }
        }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // ── Lucide icons ──────────────────────────────
    if (window.lucide) lucide.createIcons();

})();
