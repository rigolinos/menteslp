/**
 * Ecosystem Controller — Dual Mode
 * Desktop: Floating constellation + SVG light curves + brain GSAP engine
 * Mobile: Vertical kinetic portal list + focus-scroll lens + bottom-slide overlay
 */
(function() {
    'use strict';

    var isMobile = window.innerWidth < 768;

    // ── Orbital positions for desktop ──
    var PORTAL_ORBITS = [
        { ax: -0.30, ay: -0.30 },
        { ax:  0.32, ay: -0.28 },
        { ax: -0.36, ay:  0.04 },
        { ax:  0.38, ay:  0.06 },
        { ax: -0.26, ay:  0.34 },
        { ax:  0.28, ay:  0.36 },
    ];

    // ── DOM refs ──
    var constellation = document.getElementById('eco-constellation');
    var portals = document.querySelectorAll('.eco-portal');
    var ecoSvg = document.getElementById('eco-svg');
    var ecoTitleFloat = document.querySelector('.eco-title-float');
    var overlaysContainer = document.getElementById('overlays-container');
    var overlayTitle = document.getElementById('overlay-title');
    var overlayBody = document.getElementById('overlay-body');
    var closeBtn = document.getElementById('close-overlay');

    // Mobile refs
    var mobileList = document.getElementById('eco-mobile-list');
    var mobileTrack = document.getElementById('eco-mobile-track');
    var mobilePortals = document.querySelectorAll('.eco-mobile-portal');

    var brainCx = 0.5;
    var brainCy = 0.48;
    var isEcoActive = false;
    var entranceTimeline = null;
    var breathTween = null;

    // ══════════════════════════════════════════════
    // SVG SETUP (Desktop only)
    // ══════════════════════════════════════════════
    var svgNS = 'http://www.w3.org/2000/svg';
    var lightPath = null;

    if (ecoSvg) {
        var defs = document.createElementNS(svgNS, 'defs');
        var gradient = document.createElementNS(svgNS, 'linearGradient');
        gradient.id = 'eco-gradient';
        var stop1 = document.createElementNS(svgNS, 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', 'rgba(201,168,76,0.6)');
        var stop2 = document.createElementNS(svgNS, 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', 'rgba(201,168,76,0.05)');
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        ecoSvg.appendChild(defs);

        lightPath = document.createElementNS(svgNS, 'path');
        lightPath.classList.add('eco-light-path');
        lightPath.setAttribute('stroke', 'url(#eco-gradient)');
        ecoSvg.appendChild(lightPath);
    }


    // ══════════════════════════════════════════════
    // GSAP BRAIN ENGINE — 3 Layers of Motion
    // ══════════════════════════════════════════════

    function startBreathing() {
        if (breathTween) breathTween.kill();
        var eb = window.__ecoBrain;
        if (!eb) return;
        breathTween = window.gsap.to(eb, {
            breathScale: 1.04,
            duration: 3,
            ease: 'power1.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    function stopBreathing() {
        if (breathTween) { breathTween.kill(); breathTween = null; }
        var eb = window.__ecoBrain;
        if (eb) window.gsap.to(eb, { breathScale: 1.0, duration: 0.5 });
    }

    function brainReactToPortal(portalEl) {
        var eb = window.__ecoBrain;
        if (!eb) return;
        var rect = portalEl.getBoundingClientRect();
        var px = rect.left + rect.width / 2;
        var cx = window.innerWidth * brainCx;
        var dx = px - cx;
        var tiltAmount = Math.min(8, Math.abs(dx) / 80);
        var tiltAngle = (dx > 0 ? 1 : -1) * tiltAmount;
        window.gsap.to(eb, {
            rotateAngle: tiltAngle,
            glowIntensity: 2.2,
            duration: 0.4,
            ease: 'power2.out'
        });
    }

    function brainPulse() {
        var eb = window.__ecoBrain;
        if (!eb) return;
        window.gsap.to(eb, {
            glowIntensity: 2.5,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: function() {
                window.gsap.to(eb, { glowIntensity: 1.0, duration: 0.6, ease: 'power2.inOut' });
            }
        });
    }

    function brainResetReaction() {
        var eb = window.__ecoBrain;
        if (!eb) return;
        window.gsap.to(eb, {
            rotateAngle: 0,
            glowIntensity: 1.0,
            duration: 0.6,
            ease: 'power2.inOut'
        });
    }

    function brainExplode(callback) {
        var eb = window.__ecoBrain;
        if (!eb) { if (callback) callback(); return; }
        stopBreathing();
        var tl = window.gsap.timeline({
            onComplete: function() {
                window.gsap.set(eb, {
                    explodeScale: 1.0, explodeAlpha: 1.0,
                    glowIntensity: 1.0, rotateAngle: 0
                });
            }
        });
        tl.to(eb, {
            explodeScale: 1.5, explodeAlpha: 0,
            glowIntensity: 4.0, duration: 0.4, ease: 'power4.out'
        });
        tl.add(function() { if (callback) callback(); }, 0.25);
    }


    // ══════════════════════════════════════════════
    // DESKTOP: Constellation Layout & Animation
    // ══════════════════════════════════════════════

    function layoutPortals() {
        var W = window.innerWidth;
        var H = window.innerHeight;
        var cx = W * brainCx;
        var cy = H * brainCy;
        portals.forEach(function(portal, i) {
            var orbit = PORTAL_ORBITS[i];
            portal.style.left = (cx + orbit.ax * W) + 'px';
            portal.style.top = (cy + orbit.ay * H) + 'px';
        });
        if (ecoSvg) ecoSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    }

    function animateConstellationDesktop() {
        if (entranceTimeline) entranceTimeline.kill();
        layoutPortals();
        var W = window.innerWidth;
        var H = window.innerHeight;

        entranceTimeline = window.gsap.timeline();
        entranceTimeline.to(constellation, { opacity: 1, duration: 0.4, ease: 'power2.out' });
        entranceTimeline.to(ecoTitleFloat, { opacity: 1, duration: 0.6, ease: 'power2.out' }, '<0.1');

        portals.forEach(function(portal, i) {
            var orbit = PORTAL_ORBITS[i];
            var cx = W * brainCx;
            var cy = H * brainCy;
            window.gsap.set(portal, {
                x: (cx + orbit.ax * W) > cx ? -60 : 60,
                y: (cy + orbit.ay * H) > cy ? -40 : 40,
                scale: 0, opacity: 0
            });
            entranceTimeline.to(portal, {
                x: 0, y: 0, scale: 1, opacity: 1,
                duration: 1.2, ease: 'power4.out', delay: i * 0.08
            }, '<0.05');
        });

        entranceTimeline.add(function() { startBreathing(); }, 0.6);
        isEcoActive = true;
    }


    // ══════════════════════════════════════════════
    // MOBILE: Vertical Kinetic Engine
    // ══════════════════════════════════════════════

    var mobileFocusIndex = 0;

    function animateConstellationMobile() {
        if (entranceTimeline) entranceTimeline.kill();

        entranceTimeline = window.gsap.timeline();
        entranceTimeline.to(mobileList, { opacity: 1, duration: 0.4, ease: 'power2.out' });
        entranceTimeline.to(ecoTitleFloat, { opacity: 1, duration: 0.5, ease: 'power2.out' }, '<0.1');

        // Stagger each portal appearing
        mobilePortals.forEach(function(portal, i) {
            window.gsap.set(portal, { y: 40, opacity: 0, scale: 0.7, filter: 'blur(4px)' });
            entranceTimeline.to(portal, {
                y: 0, opacity: 0.25, scale: 0.8, filter: 'blur(2px)',
                duration: 0.8, ease: 'power4.out'
            }, 0.15 + i * 0.1);
        });

        // Set initial focus on center item
        entranceTimeline.add(function() {
            mobileFocusIndex = Math.floor(mobilePortals.length / 2);
            updateMobileFocus(mobileFocusIndex);
            startBreathing();
        });

        isEcoActive = true;
    }

    function updateMobileFocus(index) {
        mobileFocusIndex = index;
        mobilePortals.forEach(function(portal, i) {
            if (i === index) {
                portal.classList.add('eco-mobile-focused');
                window.gsap.to(portal, {
                    opacity: 1, scale: 1, filter: 'blur(0px)',
                    duration: 0.4, ease: 'power2.out'
                });
            } else {
                portal.classList.remove('eco-mobile-focused');
                var distance = Math.abs(i - index);
                var targetOpacity = Math.max(0.15, 0.4 - distance * 0.12);
                var targetScale = Math.max(0.7, 0.9 - distance * 0.08);
                var targetBlur = Math.min(4, distance * 2);
                window.gsap.to(portal, {
                    opacity: targetOpacity,
                    scale: targetScale,
                    filter: 'blur(' + targetBlur + 'px)',
                    duration: 0.4, ease: 'power2.out'
                });
            }
        });

        // Brain pulse on focus change
        brainPulse();
    }

    // Touch-based focus detection for mobile
    var touchStartY = 0;
    var lastFocusTime = 0;

    if (mobileTrack) {
        mobileTrack.addEventListener('touchstart', function(e) {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        mobileTrack.addEventListener('touchmove', function(e) {
            var now = Date.now();
            if (now - lastFocusTime < 150) return; // throttle

            var dy = touchStartY - e.touches[0].clientY;
            if (Math.abs(dy) > 30) {
                lastFocusTime = now;
                touchStartY = e.touches[0].clientY;
                var newIndex = mobileFocusIndex + (dy > 0 ? 1 : -1);
                newIndex = Math.max(0, Math.min(mobilePortals.length - 1, newIndex));
                if (newIndex !== mobileFocusIndex) {
                    updateMobileFocus(newIndex);
                }
            }
        }, { passive: true });
    }

    // Also allow clicking directly on mobile portals to focus+open
    mobilePortals.forEach(function(portal, i) {
        portal.addEventListener('click', function() {
            if (!portal.classList.contains('eco-mobile-focused')) {
                // First tap = focus
                updateMobileFocus(i);
            } else {
                // Second tap = open overlay
                var overlayId = portal.getAttribute('data-overlay');
                if (overlayId) {
                    brainExplode(function() { openOverlay(overlayId); });
                }
            }
        });
    });


    // ══════════════════════════════════════════════
    // SHARED: Scene Activation
    // ══════════════════════════════════════════════

    function animateConstellation() {
        if (isMobile) {
            animateConstellationMobile();
        } else {
            animateConstellationDesktop();
        }
    }

    function hideConstellation() {
        if (entranceTimeline) entranceTimeline.kill();
        isEcoActive = false;
        stopBreathing();

        if (!isMobile && constellation) {
            window.gsap.to(constellation, { opacity: 0, duration: 0.3 });
        }
        if (isMobile && mobileList) {
            window.gsap.to(mobileList, { opacity: 0, duration: 0.3 });
        }
        window.gsap.to(ecoTitleFloat, { opacity: 0, duration: 0.3 });

        portals.forEach(function(p) { p.classList.remove('eco-active', 'eco-dimmed'); });
        if (lightPath) window.gsap.to(lightPath, { opacity: 0, duration: 0.2 });
    }

    window.addEventListener('resize', function() {
        var wasMobile = isMobile;
        isMobile = window.innerWidth < 768;
        if (wasMobile !== isMobile && isEcoActive) {
            hideConstellation();
            setTimeout(animateConstellation, 100);
        }
        if (!isMobile && isEcoActive) layoutPortals();
    });


    // ══════════════════════════════════════════════
    // DESKTOP: SVG Light Curve + Hover + Click
    // ══════════════════════════════════════════════

    function drawLightCurve(portalEl) {
        if (!lightPath) return;
        var W = window.innerWidth;
        var H = window.innerHeight;
        var cx = W * brainCx, cy = H * brainCy;
        var rect = portalEl.getBoundingClientRect();
        var px = rect.left + rect.width / 2;
        var py = rect.top + rect.height / 2;
        var dx = px - cx, dy = py - cy;
        var perpX = -dy * 0.15, perpY = dx * 0.15;

        var d = 'M ' + cx + ' ' + cy
            + ' C ' + (cx + dx * 0.25 + perpX) + ' ' + (cy + dy * 0.25 + perpY)
            + ', ' + (cx + dx * 0.75 - perpX * 0.5) + ' ' + (cy + dy * 0.75 - perpY * 0.5)
            + ', ' + px + ' ' + py;
        lightPath.setAttribute('d', d);

        var pathLength = lightPath.getTotalLength();
        lightPath.style.strokeDasharray = pathLength;
        lightPath.style.strokeDashoffset = pathLength;
        window.gsap.to(lightPath, { opacity: 1, strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' });
    }

    function clearLightCurve() {
        if (!lightPath) return;
        window.gsap.to(lightPath, { opacity: 0, duration: 0.3, ease: 'power2.in' });
    }

    // Desktop hover
    portals.forEach(function(portal) {
        portal.addEventListener('mouseenter', function() {
            if (!isEcoActive) return;
            portals.forEach(function(p) {
                if (p !== portal) { p.classList.add('eco-dimmed'); p.classList.remove('eco-active'); }
                else { p.classList.add('eco-active'); p.classList.remove('eco-dimmed'); }
            });
            drawLightCurve(portal);
            brainReactToPortal(portal);
        });
        portal.addEventListener('mouseleave', function() {
            portals.forEach(function(p) { p.classList.remove('eco-dimmed', 'eco-active'); });
            clearLightCurve();
            brainResetReaction();
        });
    });

    // Desktop click
    portals.forEach(function(portal) {
        portal.addEventListener('click', function(e) {
            var overlayId = portal.getAttribute('data-overlay');
            if (!overlayId) return;
            var rect = portal.getBoundingClientRect();
            var originX = rect.left + rect.width / 2;
            var originY = rect.top + rect.height / 2;

            var flash = document.createElement('div');
            flash.className = 'eco-portal-flash';
            flash.style.left = originX + 'px';
            flash.style.top = originY + 'px';
            flash.style.width = '10px'; flash.style.height = '10px';
            flash.style.marginLeft = '-5px'; flash.style.marginTop = '-5px';
            document.body.appendChild(flash);

            var maxDist = Math.sqrt(window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight);
            var targetScale = (maxDist * 2.5) / 5;

            brainExplode(function() { openOverlay(overlayId); });

            var flashTl = window.gsap.timeline({ onComplete: function() { flash.remove(); } });
            flashTl.to(flash, { scale: targetScale, opacity: 0.7, duration: 0.5, ease: 'power3.in' });
            flashTl.to(flash, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 0.4);
        });
    });


    // ══════════════════════════════════════════════
    // OVERLAY MANAGEMENT (Responsive)
    // ══════════════════════════════════════════════

    var mockContent = {
        'programa': '<p style="font-size:1.25rem;color:#94a3b8;margin-bottom:2rem;">Assista aos episódios completos no YouTube e Spotify.</p>',
        'cursos': '<p style="font-size:1.25rem;color:#94a3b8;margin-bottom:2rem;">Formações e capacitações imersivas para educadores e gestores.</p>',
        'livro': '<p style="font-size:1.25rem;color:#94a3b8;margin-bottom:2rem;">A obra que deu origem ao movimento Mentes que Inspiram.</p>',
        'eventos': '<p style="font-size:1.25rem;color:#94a3b8;margin-bottom:2rem;">Experiências presenciais e eventos corporativos transformadores.</p>',
        'consultoria': '<p style="font-size:1.25rem;color:#94a3b8;margin-bottom:2rem;">Planos institucionais para escolas e empresas.</p>',
        'mediakit': '<p style="font-size:1.25rem;color:#94a3b8;margin-bottom:2rem;">Oportunidades de parceria e patrocínio com a marca.</p>'
    };

    function openOverlay(id) {
        if (window.ScrollTrigger) {
            window.ScrollTrigger.getAll().forEach(function(st) { st.disable(false, false); });
        }
        document.body.style.overflow = 'hidden';

        overlayTitle.textContent = id.charAt(0).toUpperCase() + id.slice(1);
        overlayBody.innerHTML = mockContent[id] || '<p>Conteúdo em construção...</p>';

        if (isMobile) {
            // Mobile: slide from bottom
            overlaysContainer.classList.add('overlay-open-mobile');
            overlaysContainer.style.pointerEvents = 'auto';
            window.gsap.fromTo(overlaysContainer,
                { y: '100%' },
                { y: '0%', duration: 0.5, ease: 'power3.out' }
            );
        } else {
            // Desktop: fade in
            window.gsap.to(overlaysContainer, {
                autoAlpha: 1, pointerEvents: 'auto',
                duration: 0.6, ease: 'power3.out'
            });
        }

        window.history.pushState({ overlay: id }, '', '/' + id);
    }

    function closeOverlay() {
        if (isMobile) {
            window.gsap.to(overlaysContainer, {
                y: '100%', duration: 0.4, ease: 'power2.in',
                onComplete: function() {
                    overlaysContainer.classList.remove('overlay-open-mobile');
                    overlaysContainer.style.pointerEvents = 'none';
                    document.body.style.overflow = '';
                    if (window.ScrollTrigger) {
                        window.ScrollTrigger.getAll().forEach(function(st) { st.enable(); });
                    }
                    if (isEcoActive) startBreathing();
                }
            });
        } else {
            window.gsap.to(overlaysContainer, {
                autoAlpha: 0, pointerEvents: 'none',
                duration: 0.4, ease: 'power2.in',
                onComplete: function() {
                    document.body.style.overflow = '';
                    if (window.ScrollTrigger) {
                        window.ScrollTrigger.getAll().forEach(function(st) { st.enable(); });
                    }
                    if (isEcoActive) startBreathing();
                }
            });
        }
        window.history.pushState({}, '', '/');
    }

    closeBtn.addEventListener('click', closeOverlay);

    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.overlay) { openOverlay(e.state.overlay); }
        else { closeOverlay(); }
    });

    var currentPath = window.location.pathname.replace('/', '');
    if (currentPath && mockContent[currentPath]) {
        setTimeout(function() { openOverlay(currentPath); }, 500);
    }

    // ── Scene watcher ──
    function watchScene() {
        var ecoSection = document.getElementById('scene-ecosystem');
        if (!ecoSection) return;
        var isActive = ecoSection.classList.contains('active');
        var opacityVal = parseFloat(ecoSection.style.opacity || 0);

        if (isActive && opacityVal > 0.3 && !isEcoActive) {
            animateConstellation();
        } else if ((!isActive || opacityVal < 0.1) && isEcoActive) {
            hideConstellation();
        }
        requestAnimationFrame(watchScene);
    }
    requestAnimationFrame(watchScene);

})();
