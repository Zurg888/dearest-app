(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sections = [
    ...document.querySelectorAll('.hero, .quiet-scene, .feature-card, .showcase, .privacy-panel, .final-cta')
  ];
  const revealItems = [
    ...document.querySelectorAll('.hero-copy, .hero-stage, .quiet-copy, .quiet-visual, .feature-card, .showcase-copy, .mosaic, .privacy-panel > div, .final-cta > div, .final-cta > img')
  ];

  document.documentElement.classList.add(reduceMotion ? 'reduced-motion' : 'motion-ready');

  if (reduceMotion) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  sections.forEach((section) => section.classList.add('motion-section'));
  revealItems.forEach((item) => item.classList.add('motion-item'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px 20% 0px' });

  revealItems.forEach((item) => observer.observe(item));

  let ticking = false;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  const update = () => {
    const h = window.innerHeight || 1;
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const raw = (h - rect.top) / (h + rect.height);
      const progress = clamp(raw);
      section.style.setProperty('--p', progress.toFixed(4));
      section.style.setProperty('--center', clamp(1 - Math.abs(progress - 0.5) * 2).toFixed(4));
    });
    ticking = false;
  };

  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  };

  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
})();
