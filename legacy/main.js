// Mentes que Inspiram — Core JS Engine
// Powered by GSAP & Locomotive Scroll

document.addEventListener('DOMContentLoaded', () => {
    // Detecta mobile uma vez para usar em todo o script
    const isMobile = window.innerWidth <= 768;

    // --- MOBILE VIDEO FORCE-PLAY ---
    // iOS Safari requer atenção especial para autoplay de vídeo
    const heroVideo = document.getElementById('hero-video');
    if (heroVideo) {
        // Garante que os atributos essenciais estão presentes
        heroVideo.muted = true;
        heroVideo.playsInline = true;
        heroVideo.setAttribute('playsinline', '');
        heroVideo.setAttribute('webkit-playsinline', '');

        const tryPlay = () => {
            const promise = heroVideo.play();
            if (promise !== undefined) {
                promise.catch(() => {
                    // Silencioso — o poster (imagem) já aparece como fallback
                    console.log('Video autoplay bloqueado — poster visível como fallback');
                });
            }
        };

        // Tentativa 1: imediata
        tryPlay();

        // Tentativa 2: ao carregar metadados
        heroVideo.addEventListener('loadedmetadata', tryPlay, { once: true });

        // Tentativa 3: no primeiro toque do usuário (iOS exige user gesture às vezes)
        const playOnTouch = () => {
            tryPlay();
            document.removeEventListener('touchstart', playOnTouch);
        };
        document.addEventListener('touchstart', playOnTouch, { once: true });

        // Tentativa 4: IntersectionObserver — quando o vídeo entrar na tela
        if ('IntersectionObserver' in window) {
            const obs = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    tryPlay();
                    obs.disconnect();
                }
            }, { threshold: 0.1 });
            obs.observe(heroVideo);
        }
    }


    // --- 0. DYNAMIC EPISODES DATA ---
    const allEpisodes = [
        // Temporada 1
        { id: 1, season: 1, title: "Empatia, Força e Propósito — A Jornada Inspiradora da Sensei Milena Mendes (Milena Mendes)", desc: "Episódio 01", img: "thumbs/Empatia, Força e Propósito - [Referente ao Ep 18].jpeg", link: "https://www.youtube.com/watch?v=2SH3wdR4cks" },
        { id: 2, season: 1, title: "Judô e Educação Criativa (Milena Mendes & Fernanda Badia)", desc: "Episódio 02", img: "thumbs/Judô e Educação Criativa (Milena Mendes) - [Referente ao Ep 2].jpeg", link: "http://www.youtube.com/watch?v=no0fjMc_vjQ" },
        { id: 3, season: 1, title: "Educação, Inclusão e Amor (Alberto Moura)", desc: "Episódio 03", img: "thumbs/Educação, Inclusão e Amor (Alberto Moura) - [Referente ao Ep 3].jpeg", link: "http://www.youtube.com/watch?v=DV_rVqoURbE" },
        { id: 4, season: 1, title: "Quando a Música Encontra a Voz (Natália Magalhães & Carolina Laux)", desc: "Episódio 04", img: "thumbs/Quando a Música encontra a Voz (ComunicaçãoExpressão) - [Referente ao Ep 8].jpeg", link: "https://www.youtube.com/watch?v=xRGv5r4inZQ&t=113s" },
        { id: 5, season: 1, title: "Poder da Presença com Propósito — Cuidado que Transforma (Filipe Geyer)", desc: "Episódio 05", img: "thumbs/Poder da Presença com Propósito (Cuidado que transforma) - [Referente ao Ep 28].jpeg", link: "https://www.youtube.com/watch?v=wAnElgj8-II" },
        { id: 6, season: 1, title: "Educar com Amor e Criatividade (Fernanda Badia)", desc: "Episódio 06", img: "thumbs/Educar com Amor e Criatividade (Fernanda Badia) - [Referente ao Ep 6].jpeg", link: "http://www.youtube.com/watch?v=X8GFOMbq3uY" },
        { id: 7, season: 1, title: "Quando a Neurociência Encontra a Humanização — Uma Conversa Profunda (Dra. Rochele Paz)", desc: "Episódio 07", img: "thumbs/Quando a Neurociência encontra a Humanização - [Referente ao Ep 13].jpeg", link: "https://www.youtube.com/watch?v=lcmCLSFOto8&t=22s" },
        { id: 8, season: 1, title: "Maternidade Atípica, Luta e Transformação Social (Beta Vargas)", desc: "Episódio 08", img: "thumbs/Maternidade Atípica Luta e Transformação - Parte 1 - [Referente ao Ep 23].jpeg", link: "https://www.youtube.com/watch?v=n_pXpG4xLZc" },
        { id: 9, season: 1, title: "Voluntariado que Cura — Histórias Reais do Esquadrão da Alegria (Esquadrão da Alegria)", desc: "Episódio 09", img: "thumbs/Voluntariado que Cura - Parte 1 (Esquadrão da Alegria) - [Referente ao Ep 4].jpeg", link: "https://www.youtube.com/watch?v=BoAKRgZgHJ8&t=2s" },
        { id: 10, season: 1, title: "Voluntariado que Cura — Histórias Reais do Esquadrão da Alegria — Parte 2 (Esquadrão da Alegria)", desc: "Episódio 10", img: "thumbs/Voluntariado que Cura - Parte 2 (Esquadrão da Alegria) - [Referente ao Ep 5].jpeg", link: "https://www.youtube.com/watch?v=IYqbKBwEz10&t=504s" },
        { id: 11, season: 1, title: "Empatia que Transforma — Saúde, Histórias e Propósito (Vanessa Leite)", desc: "Episódio 11", img: "thumbs/Empatia que Transforma (Saúde, Histórias e Propósito) - [Referente ao Ep 7].jpeg", link: "https://www.youtube.com/watch?v=0EaEkYPdQts&t=795s" },
        { id: 12, season: 1, title: "Energia que Transforma — Intenção e Novos Começos (Nivia Bernardes)", desc: "Episódio 12", img: "thumbs/Energia que Transforma (Intenção e novos começos) - [Referente ao Ep 11].jpeg", link: "https://www.youtube.com/watch?v=M_t-K1eUqVU" },
        { id: 13, season: 1, title: "Conhecimento que Muda Destinos — Rumo ao Sucesso (Sigrid Kersting)", desc: "Episódio 13", img: "thumbs/Conhecimento que muda destinos (Rumo ao sucesso) - [Referente ao Ep 10].jpeg", link: "https://www.youtube.com/watch?v=S3Azg39aPtU&t=1266s" },
        { id: 14, season: 1, title: "Saúde, Propósito e Conexões (Sigrid Kersting & Vanessa Leite)", desc: "Episódio 14", img: "thumbs/Saúde, Propósito e Conexões (Sigrid e Vanessa) - [Referente ao Ep 14].jpeg", link: "https://www.youtube.com/watch?v=QMOrzozHlJc" },

        // Temporada 2
        { id: 15, season: 2, title: "Quando as Histórias Educam, o Mundo Floresce (Léia Cassol)", desc: "Episódio 15", img: "thumbs/Quando Histórias Educam (Narrativas e Transformação) - [Referente ao Ep 9].jpeg", link: "https://www.youtube.com/watch?v=sTXSEvPEAT4&t=3s" },
        { id: 16, season: 2, title: "A Leitura Pode Salvar uma Vida — Histórias Reais com Léia Cassol (Léia Cassol)", desc: "Episódio 16", img: "thumbs/A Leitura pode salvar uma vida (Léia Cassol) - [Referente ao Ep 16].jpeg", link: "https://www.youtube.com/watch?v=v3B5L4TgGR8" },
        { id: 17, season: 2, title: "Educação, Inclusão e Transição para o Ensino Superior (Mariângela Pozza)", desc: "Episódio 17", img: "thumbs/Educação, Inclusão e Transição (Mariângela Pozza) - [Referente ao Ep 17].jpeg", link: "https://www.youtube.com/watch?v=OCU17kT-xxw&t=25s" },
        { id: 18, season: 2, title: "Inclusão que Transforma a Educação (Mariângela Pozza & Karla Wunder)", desc: "Episódio 18", img: "thumbs/Inclusão que Transforma a Educação - [Referente ao Ep 19].jpeg", link: "https://www.youtube.com/watch?v=LmUsirVP1iE" },
        { id: 19, season: 2, title: "A Educação Está Adoecendo — Como Virar o Jogo (Mariângela Pozza)", desc: "Episódio 19", img: "thumbs/A Educação está adoecendo (E como virar o jogo) - [Referente ao Ep 15].jpeg", link: "https://www.youtube.com/watch?v=0m-9JNJ9dg0&t=12s" },
        { id: 20, season: 2, title: "Primeira Infância — Brincar, Vínculo e Presença (João Luiz da Silva Rosa)", desc: "Episódio 20", img: "thumbs/1ª Infância Brincar, Vínculo e Presença (João Luiz) - [Referente ao Ep 20].jpeg", link: "http://www.youtube.com/watch?v=J_fMP73BW14" },
        { id: 21, season: 2, title: "Menopausa sem Tabu (Márcia Selister)", desc: "Episódio 21", img: "thumbs/Menopausa sem Tabu! (Márcia Selister) - [Referente ao Ep 21].jpeg", link: "http://www.youtube.com/watch?v=L3E5qhV_emg" },
        { id: 22, season: 2, title: "Educação Antirracista, Diversidade e Inclusão (Vanessa Deimling)", desc: "Episódio 22", img: "thumbs/Educação Antirracista (Diversidade e Inclusão) - [Referente ao Ep 12].jpeg", link: "https://www.youtube.com/watch?v=4y2rx9wcIdE&t=2s" },
        { id: 23, season: 2, title: "Maternidade Atípica e Autismo — Parte 1 (Debora Saueressig)", desc: "Episódio 23", img: "thumbs/Maternidade Atípica Autismo - Parte 2 - [Referente ao Ep 24].jpeg", link: "https://www.youtube.com/watch?v=3P0Li3OZcyg" },
        { id: 24, season: 2, title: "Maternidade Atípica e Autismo — Parte 2 (Debora Saueressig)", desc: "Episódio 24", img: "thumbs/Maternidade Atípica Autismo - Parte 2 - [Referente ao Ep 24].jpeg", link: "https://www.youtube.com/watch?v=EiQp6ojyM6s" },
        { id: 25, season: 2, title: "Educação, Liderança e Inovação — Parte 1 (Cris Vieira)", desc: "Episódio 25", img: "thumbs/Educação, Liderança e Inovação - Parte 1 (Cris Vieira) - [Referente ao Ep 25].jpeg", link: "http://www.youtube.com/watch?v=zrL6AGN8fv4" },
        { id: 26, season: 2, title: "Educação, Liderança e Inovação — Parte 2 (Cris Vieira)", desc: "Episódio 26", img: "thumbs/Educação, Liderança e Inovação - Parte 2 (Cris Vieira) - [Referente ao Ep 26].jpeg", link: "http://www.youtube.com/watch?v=-hu9Y1KPxFE" },
        { id: 27, season: 2, title: "Carreira, Empreendedorismo e Direito Trabalhista (Catharine)", desc: "Episódio 27", img: "thumbs/Carreira, Empreendedorismo e Direito Trabalhista (Catharine) - [Referente ao Ep 27.jpeg", link: "http://www.youtube.com/watch?v=OeAHWnX10Q0" },
        { id: 28, season: 2, title: "Experiência Lux (Larissa Brucki, Tati Brucki & Dani Barcellos)", desc: "Episódio 28", img: "thumbs/Experiência Lux Autoestima e Imagem - [Referente ao Ep 22].jpeg", link: "https://www.youtube.com/watch?v=gApYi0s7g6o" }
    ];

    const timelineTrack = document.querySelector('.timeline__track--episodes');
    let swiperInstance;

    const renderEpisodes = (season) => {
        if (!timelineTrack) return;
        
        // GSAP Fade out
        gsap.to(timelineTrack, {
            opacity: 0,
            y: 20,
            duration: 0.3,
            onComplete: () => {
                timelineTrack.innerHTML = '';
                const filtered = allEpisodes.filter(ep => ep.season === parseInt(season));
                
                filtered.forEach(ep => {
                    const slide = document.createElement('div');
                    slide.className = "swiper-slide";
                    slide.innerHTML = `
                        <a href="${ep.link}" target="_blank" class="timeline__item">
                            <div class="timeline__img reveal-img">
                                <img src="${ep.img}" alt="${ep.title}">
                            </div>
                            <div class="timeline__content">
                                <h3>${ep.title}</h3>
                                <p>${ep.desc}</p>
                            </div>
                        </a>
                    `;
                    timelineTrack.appendChild(slide);
                });
                
                // Forçar aparecimento das imagens na troca de temporada com delay elegante
                timelineTrack.querySelectorAll('.reveal-img').forEach((el, index) => {
                    setTimeout(() => el.classList.add('revealed'), 100 * (index % 5));
                });

                // Re-init reveal animations
                if (window.lucide) lucide.createIcons();
                
                // GSAP Fade in
                gsap.to(timelineTrack, {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    delay: 0.1
                });

                if (swiperInstance) {
                    swiperInstance.update();
                    swiperInstance.slideTo(0);
                }
            }
        });
    };

    // Initialize Swiper for Timeline
    let progressTimeout;
    const progressContainer = document.querySelector('.timeline__progress-container');
    const progressBar = document.querySelector('.timeline__progress-bar');

    if (document.querySelector('.timeline-swiper')) {
        swiperInstance = new Swiper('.timeline-swiper', {
            slidesPerView: 'auto',
            spaceBetween: 30,
            freeMode: true,
            grabCursor: true,
            resistanceRatio: 0.85,
            on: {
                progress: function (s) {
                    const progress = s.progress;
                    if (progressBar) {
                        progressBar.style.width = `${Math.max(0, Math.min(1, progress)) * 100}%`;
                    }
                },
                touchStart: function () {
                    if (progressContainer) progressContainer.classList.add('active');
                    clearTimeout(progressTimeout);
                },
                touchEnd: function () {
                    progressTimeout = setTimeout(() => {
                        if (progressContainer) progressContainer.classList.remove('active');
                    }, 1500);
                },
                sliderMove: function() {
                    if (progressContainer) progressContainer.classList.add('active');
                }
            }
        });
        
        // Initial Render (S1)
        renderEpisodes(1);
    }

    // Season Tabs Logic
    const seasonTabs = document.querySelectorAll('.season-tab');
    seasonTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.classList.contains('active') || tab.hasAttribute('disabled')) return;
            
            seasonTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const season = tab.getAttribute('data-season');
            renderEpisodes(season);
        });
    });

    // --- CONTACT FORM — AJAX Submit ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('submit-btn');
            const successDiv = document.getElementById('form-success');
            const formGroups = contactForm.querySelectorAll('.form-group');

            // Estado de carregamento
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            try {
                const formData = new FormData(contactForm);
                const response = await fetch('send_email.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.status === 'success') {
                    // Confirmar visualmente antes de ocultar
                    submitBtn.textContent = 'Enviado! ✓';
                    submitBtn.style.background = '#2a9d5c';
                    submitBtn.style.color = '#fff';
                    contactForm.reset();

                    // Aguardar 1.2s para o usuário ver "Enviado!" e depois fazer o fade
                    setTimeout(() => {
                        gsap.to([...formGroups, submitBtn], {
                            opacity: 0,
                            y: -10,
                            duration: 0.4,
                            stagger: 0.05,
                            onComplete: () => {
                                formGroups.forEach(g => g.style.display = 'none');
                                submitBtn.style.display = 'none';
                                successDiv.style.display = 'flex';
                                gsap.from(successDiv, { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' });
                            }
                        });
                    }, 1200);
                } else {
                    alert(data.message || 'Erro ao enviar. Tente novamente.');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Enviar Proposta';
                }
            } catch (err) {
                alert('Erro de conexão. Verifique e tente novamente.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar Proposta';
            }
        });
    }

    // --- 1. INITIALIZE LIBRARIES ---
    if (!window.gsap || !window.LocomotiveScroll) {
        document.querySelector('.preloader').style.display = 'none';
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Initialize Locomotive Scroll
    // No mobile: remove todos os data-scroll-speed antes de iniciar
    // evita parallax quebrado e bugs ao rolar para cima
    if (isMobile) {
        document.querySelectorAll('[data-scroll-speed]').forEach(el => {
            el.removeAttribute('data-scroll-speed');
        });
    }

    const scroll = new LocomotiveScroll({
        el: document.querySelector('[data-scroll-container]'),
        smooth: true,
        multiplier: 1,
        lerp: 0.05,
        smartphone: { smooth: false }, // Scroll nativo no celular = mais estável
        tablet: { smooth: true }
    });

    scroll.on('scroll', ScrollTrigger.update);
    ScrollTrigger.scrollerProxy('[data-scroll-container]', {
        scrollTop(value) {
            return arguments.length ? scroll.scrollTo(value, 0, 0) : scroll.scroll.instance.scroll.y;
        },
        getBoundingClientRect() {
            return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
        },
        pinType: document.querySelector('[data-scroll-container]').style.transform ? "transform" : "fixed"
    });

    // Back to top or smooth header
    scroll.on('scroll', (args) => {
        if (args.scroll.y > 100) {
            document.querySelector('.header').classList.add('scrolled');
        } else {
            document.querySelector('.header').classList.remove('scrolled');
        }
    });

    // SET INITIAL STATES IN JS (Safety)
    gsap.set('.hero__line span', { y: '150%' });
    gsap.set('.header', { y: -100, opacity: 0 });
    // No mobile, não aplicamos scale no vídeo para evitar conflicts com CSS transforms
    if (!isMobile) {
        gsap.set('.hero__bg img, .hero__bg video', { scale: 1.2 });
    }
    // Estado inicial do cérebro no hero: invisível, pequeno, inclinado em 3D
    gsap.set('.hero__brain-wrap', {
        opacity: 0,
        scale: 0.15,
        rotationX: 30,
        transformPerspective: 900,
        transformOrigin: 'center center'
    });

    // --- 2. PRELOADER ANIMATION (original) ---
    const initPreloader = () => {
        const tl = gsap.timeline();

        tl.to('.preloader__word', {
            y: 0,
            duration: 1,
            stagger: 0.2,
            ease: 'expo.out'
        });

        tl.to('.preloader__bar', {
            width: '100%',
            duration: 1.5,
            ease: 'power2.inOut',
            onComplete: () => {
                document.querySelector('.preloader').classList.add('preloader--hidden');
                setTimeout(() => {
                    document.querySelector('.preloader').style.display = 'none';
                    initHeroAnimation();
                    scroll.update();
                }, 1200);
            }
        }, '-=0.5');
    };

    // --- 3. HERO ANIMATION — Logo Slide-up Reveal ---
    const initHeroAnimation = () => {
        const tl = gsap.timeline();

        // Logo slides up from under the overflow mask
        tl.to('.hero__logo-svg', {
            y: '0%',
            duration: 1.6,
            ease: 'power4.out',
            onComplete: () => {
                const logoSvg = document.querySelector('.hero__logo-svg');
                if (logoSvg) {
                    logoSvg.classList.add('hero__logo-svg--floating');
                }
            }
        });

        // Zoom out do vídeo/imagem de fundo (desktop)
        if (!isMobile) {
            tl.to('.hero__bg img, .hero__bg video', {
                scale: 1,
                duration: 2.5,
                ease: 'expo.out'
            }, '-=1.8');
        }

        // Header desce
        tl.to('.header', {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out'
        }, isMobile ? '-=1.2' : '-=2');

        // Label e scroll indicator aparecem
        tl.from('.hero__label, .hero__footer', {
            opacity: 0,
            y: 30,
            duration: 1,
            stagger: 0.2,
            ease: 'power3.out'
        }, '-=1');
    };

    // --- 4. NAVIGATION OVERLAY ---
    const navOverlay = document.querySelector('.nav-overlay');
    const menuToggle = document.querySelector('.header__menu-toggle');
    const closeNav = document.querySelector('.nav-overlay__close');
    const navLinks = document.querySelectorAll('.nav-link');

    const openMenu = () => {
        navOverlay.classList.add('active');
        navOverlay.style.visibility = 'visible';
        navOverlay.style.pointerEvents = 'all';
        gsap.to('.nav-link', {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: 'expo.out',
            delay: 0.2
        });
    };

    const closeMenu = () => {
        navOverlay.classList.remove('active');
        navOverlay.style.visibility = 'hidden';
        navOverlay.style.pointerEvents = 'none';
    };

    if (menuToggle) menuToggle.addEventListener('click', openMenu);
    if (closeNav) closeNav.addEventListener('click', closeMenu);
    navLinks.forEach(link => link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href');
        closeMenu();
        scroll.scrollTo(target);
    }));

    // Botão "Assista aos Episódios" — scroll suave via Locomotive
    const btnEpisodes = document.getElementById('btn-scroll-episodes');
    if (btnEpisodes) {
        btnEpisodes.addEventListener('click', () => {
            scroll.scrollTo('#episodes');
        });
    }

    // Card "Programa / Produção" — scroll suave via Locomotive
    const cardEpisodes = document.querySelector('.eco-card--featured');
    if (cardEpisodes) {
        cardEpisodes.addEventListener('click', (e) => {
            e.preventDefault();
            scroll.scrollTo('#episodes');
        });
    }

    // --- 5. SCROLL REVEAL SYSTEM ---
    gsap.utils.toArray('.reveal-img, .reveal-text').forEach(el => {
        ScrollTrigger.create({
            trigger: el,
            scroller: '[data-scroll-container]',
            start: 'top 85%',
            onEnter: () => el.classList.add('revealed'),
            once: true
        });
    });

    // FALLBACK: Se o ScrollTrigger não disparar (ex: no deploy em produção),
    // revela todos os elementos após 2s para garantir que nada fique escondido
    setTimeout(() => {
        document.querySelectorAll('.reveal-img, .reveal-text').forEach(el => {
            el.classList.add('revealed');
        });
        // Também revela e garante visibilidade de elementos essenciais
        document.querySelectorAll('[data-scroll-class="revealed"], .section-header, .about__text, .pillar-card, .commercial-card').forEach(el => {
            el.classList.add('revealed');
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }, 2000);

    gsap.from('.about__text', {
        scrollTrigger: {
            trigger: '.about__text',
            scroller: '[data-scroll-container]',
            start: 'top 85%',
        },
        y: 80, opacity: 0, duration: 1.5, ease: 'expo.out'
    });

    gsap.from('.pillar-card', {
        scrollTrigger: {
            trigger: '.pillars__grid',
            scroller: '[data-scroll-container]',
            start: 'top 75%',
        },
        y: 80, opacity: 0, duration: 1.2, stagger: 0.15, ease: 'expo.out'
    });



    // Marquee / Gallery GSAP effect removed to allow CSS animation to run smoothly without conflicts
    /*
    if (!isMobile) {
        const marquee = document.querySelector('.gallery__marquee');
        if (marquee) {
            gsap.to(marquee, {
                scrollTrigger: {
                    trigger: '.gallery',
                    scroller: '[data-scroll-container]',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1
                },
                xPercent: -50,
                ease: 'none'
            });
        }
    }
    */

    // --- 6. INITIALIZATION ---
    if (window.lucide) lucide.createIcons();

    const startApp = () => {
        scroll.update();
        ScrollTrigger.refresh();
        initPreloader();
        console.log('App Started and ScrollTrigger Refreshed');

        // Force recalculation after images load (Fixes black box overlays on slow networks)
        setTimeout(() => { scroll.update(); ScrollTrigger.refresh(); }, 1000);
        setTimeout(() => { scroll.update(); ScrollTrigger.refresh(); }, 2000);
        setTimeout(() => { scroll.update(); ScrollTrigger.refresh(); }, 3500);
        
        // Also observe image loads natively
        document.querySelectorAll('img').forEach(img => {
            if (!img.complete) {
                img.addEventListener('load', () => {
                    scroll.update();
                    ScrollTrigger.refresh();
                });
            }
        });
    };
    // Start immediately on DOMContentLoaded instead of waiting for heavy media loads
    startApp();

    // Emergency Fallback
    setTimeout(() => {
        const preloader = document.querySelector('.preloader');
        if (preloader && !preloader.classList.contains('preloader--hidden') && preloader.style.display !== 'none') {
            preloader.classList.add('preloader--hidden');
            setTimeout(() => {
                preloader.style.display = 'none';
                initHeroAnimation();
                scroll.update();
            }, 1200);
        }
    }, 4000);

    ScrollTrigger.addEventListener('refresh', () => scroll.update());
    ScrollTrigger.refresh();
});
