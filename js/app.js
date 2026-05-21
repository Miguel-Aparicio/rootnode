/* ── Scroll position memory ── */
    history.scrollRestoration = 'manual';
    const SCROLL_KEY = 'rootnode_scrollY';
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved !== null) {
      requestAnimationFrame(() => window.scrollTo({ top: +saved, behavior: 'instant' }));
    }
    window.addEventListener('pagehide', () => {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    });

    /* ── Mobile nav toggle ── */
    const toggle = document.querySelector('.nav__toggle');
    const mobileMenu = document.getElementById('nav-mobile');
    toggle?.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      mobileMenu.classList.toggle('is-open', !open);
    });
    mobileMenu?.querySelectorAll('.nav__mobile-link').forEach(l => {
      l.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('is-open');
      });
    });

    /* ── Logo morph animation ── */
    (function () {
      const morph   = document.getElementById('logo-morph');
      const navMark = document.querySelector('.nav__logo-mark');
      if (!morph || !navMark) return;

      const isMobile  = () => window.innerWidth <= 640;
      const HERO_SIZE  = 140;  // px — large centered logo (desktop)
      const NAV_SIZE   = 32;   // px — nav logo mark
      const SCROLL_END = 420;  // px of scroll to complete transition

      function lerp(a, b, t) { return a + (b - a) * t; }
      function ease(t) { return t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t; }

      let rafId = null;

      function update() {
        rafId = null;
        const raw      = Math.min(window.scrollY / SCROLL_END, 1);
        const progress = ease(raw);

        /* Target: nav logo mark center in viewport */
        const nr   = navMark.getBoundingClientRect();
        const navCX = nr.left + nr.width  / 2;
        const navCY = nr.top  + nr.height / 2;

        /* Source: centered on screen, at ~38% from top */
        const heroSize = isMobile() ? 88 : HERO_SIZE;
        const heroCX = window.innerWidth  * 0.5;
        const heroCY = isMobile() ? window.innerHeight * 0.22 : window.innerHeight * 0.38;

        const size = lerp(heroSize, NAV_SIZE, progress);
        const cx   = lerp(heroCX,   navCX,    progress);
        const cy   = lerp(heroCY,   navCY,    progress);
        const fs   = lerp(isMobile() ? 2.0 : 3.1, 0.68, progress);

        morph.style.width    = size + 'px';
        morph.style.height   = size + 'px';
        morph.style.left     = (cx - size / 2) + 'px';
        morph.style.top      = (cy - size / 2) + 'px';
        morph.style.fontSize = fs + 'rem';

        /* Float animation: full at top, fades out as scroll progresses */
        morph.style.animationPlayState = progress > 0 ? 'paused' : 'running';
        /* Reset transform when animating via JS path to avoid double offset */
        if (progress > 0) morph.style.transform = 'translateY(0)';

        /* Cross-fade: morph out, navMark in — starts at 80% progress */
        const fade = Math.max(0, (progress - 0.8) / 0.2);
        morph.style.opacity   = String(1 - fade);
        navMark.style.opacity = String(fade);

        /* Glow shadow on hero state */
        const glow = lerp(24, 0, progress);
        morph.style.boxShadow = glow > 0
          ? `0 0 ${glow}px ${glow * 0.6}px rgba(195,118,255,0.35)`
          : 'none';
      }

      function schedule() {
        if (!rafId) rafId = requestAnimationFrame(update);
      }

      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule, { passive: true });

      /* Initial render after layout */
      requestAnimationFrame(update);
    }());
