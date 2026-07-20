(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = document.documentElement;
  const reveals = [...document.querySelectorAll('.reveal')];

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
  }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });

  reveals.forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
    observer.observe(el);
  });

  let ticking = false;
  const update = () => {
    const y = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
    html.style.setProperty('--scroll', y.toFixed(4));
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
