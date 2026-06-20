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
        { ax: -0.22, ay: -0.22 },
        { ax:  0.24, ay: -0.20 },
        { ax: -0.28, ay:  0.03 },
        { ax:  0.28, ay:  0.04 },
        { ax: -0.20, ay:  0.26 },
        { ax:  0.22, ay:  0.28 },
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
    // GSAP BRAIN ENGINE — 3 Layers of Motion
    // ══════════════════════════════════════════════
    window.__ecoLine = { startProgress: 0, endProgress: 0, px: 0, py: 0, active: false };

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
        entranceTimeline.to(constellation, { opacity: 1, duration: 0.1 });
        entranceTimeline.to(ecoTitleFloat, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0);

        portals.forEach(function(portal, i) {
            var orbit = PORTAL_ORBITS[i];
            // Nascer exatamente do centro (Cérebro)
            var startX = -orbit.ax * W;
            var startY = -orbit.ay * H;

            window.gsap.set(portal, {
                x: startX,
                y: startY,
                scale: 0.1, 
                opacity: 0
            });
            
            // Explodir para fora de forma elástica e rápida
            entranceTimeline.to(portal, {
                x: 0, y: 0, scale: 1, opacity: 1,
                duration: 0.7, 
                ease: 'back.out(1.2)'
            }, 0.15 + (i * 0.05));
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
        window.__ecoLine.active = false;
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
        var rect = portalEl.getBoundingClientRect();
        window.__ecoLine.px = rect.left + rect.width / 2;
        window.__ecoLine.py = rect.top + rect.height / 2;
        window.__ecoLine.active = true;
        
        window.gsap.killTweensOf(window.__ecoLine);
        window.gsap.to(window.__ecoLine, { 
            endProgress: 1, 
            startProgress: 0,
            duration: 0.5, 
            ease: 'power2.out' 
        });
    }

    function clearLightCurve() {
        window.gsap.killTweensOf(window.__ecoLine);
        window.gsap.to(window.__ecoLine, { 
            startProgress: 1, 
            duration: 0.4, 
            ease: 'power2.inOut',
            onComplete: function() { 
                window.__ecoLine.active = false; 
                window.__ecoLine.startProgress = 0;
                window.__ecoLine.endProgress = 0;
            }
        });
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

    var activeOverlayId = null;

    function openOverlay(id) {
        activeOverlayId = id;

        // Esconde todas as sections
        document.querySelectorAll('.overlay-section').forEach(function(el) {
            el.classList.add('hidden');
        });

        // Mostra a section desejada (Astro nativo)
        var targetSection = document.getElementById('overlay-content-' + id);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            
            // GSAP Stagger Entrance para o conteúdo (animando de baixo para cima)
            var elementsToAnimate = targetSection.querySelectorAll('h1, h2, h3, h4, p, img, a, button, .bento-item, .grid > div, video, iframe');
            if (elementsToAnimate.length > 0) {
                window.gsap.fromTo(elementsToAnimate, 
                    { y: 40, opacity: 0 }, 
                    { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out', delay: 0.2 }
                );
            }
        }

        if (window.ScrollTrigger) {
            window.ScrollTrigger.getAll().forEach(function(st) { st.disable(false, false); });
        }
        document.body.style.overflow = 'hidden';

        overlaysContainer.style.pointerEvents = 'auto';

        if (isMobile) {
            // Mobile: slide from bottom (Bottom Sheet)
            overlaysContainer.classList.add('overlay-open-mobile');
            window.gsap.fromTo(overlaysContainer,
                { y: '100%', autoAlpha: 1 },
                { y: '0%', duration: 0.6, ease: 'power3.out' }
            );
        } else {
            // Desktop: fade in
            window.gsap.fromTo(overlaysContainer,
                { autoAlpha: 0, y: 0 },
                { autoAlpha: 1, duration: 0.6, ease: 'power3.out' }
            );
        }

        window.history.pushState({ overlay: id }, '', '/' + id);
    }

    function closeOverlay() {
        if (!activeOverlayId) return;

        // GARBAGE COLLECTION: Mata animações daquele portal específico para não vazar memória
        window.gsap.killTweensOf("#overlay-content-" + activeOverlayId + " *");

        var targetSection = document.getElementById('overlay-content-' + activeOverlayId);

        var onCompleteClose = function() {
            overlaysContainer.style.pointerEvents = 'none';
            if (targetSection) targetSection.classList.add('hidden');
            activeOverlayId = null;
            document.body.style.overflow = '';
            if (window.ScrollTrigger) {
                window.ScrollTrigger.getAll().forEach(function(st) { st.enable(); });
            }
            if (isEcoActive) startBreathing();
        };

        if (isMobile) {
            window.gsap.to(overlaysContainer, {
                y: '100%', duration: 0.4, ease: 'power2.in',
                onComplete: function() {
                    overlaysContainer.classList.remove('overlay-open-mobile');
                    onCompleteClose();
                }
            });
        } else {
            window.gsap.to(overlaysContainer, {
                autoAlpha: 0, duration: 0.4, ease: 'power2.in',
                onComplete: onCompleteClose
            });
        }
        window.history.pushState({}, '', '/');
    }

    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);

    // UX: Universal Close (Escape Key)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && activeOverlayId) {
            closeOverlay();
        }
    });

    // UX: Universal Close (Click Outside)
    if (overlaysContainer) {
        overlaysContainer.addEventListener('click', function(e) {
            if (e.target === overlaysContainer || e.target.id === 'overlay-content') {
                closeOverlay();
            }
        });
    }

    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.overlay) { openOverlay(e.state.overlay); }
        else { closeOverlay(); }
    });

    var currentPath = window.location.pathname.replace('/', '');
    // Verifica se há portal correspondente na URL para abrir direto
    if (currentPath && document.getElementById('overlay-content-' + currentPath)) {
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
