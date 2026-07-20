(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = document.documentElement;
  const reveals = [...document.querySelectorAll('.reveal')];
  const floaters = [
    ...document.querySelectorAll('.memory-card, .moment-panel img, .device-stack img, .final-image')
  ];

  if (reduce) {
    reveals.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  html.classList.add('motion-ready');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px 12% 0px' });

  reveals.forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index % 3, 2) * 60}ms`;
    observer.observe(el);
  });

  let ticking = false;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const update = () => {
    const vh = Math.max(1, window.innerHeight);
    const y = Math.min(1, window.scrollY / vh);
    html.style.setProperty('--scroll', y.toFixed(4));

    floaters.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const progress = clamp((center - vh * 0.5) / vh, -1, 1);
      const depth = Number(el.dataset.depth || (index % 3 === 0 ? 18 : index % 3 === 1 ? -14 : 10));
      el.style.setProperty('--float-y', `${(-progress * depth).toFixed(2)}px`);
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
