(() => {
  const root = document.documentElement;
  const activation = document.querySelector('.activation');
  const screen = document.querySelector('.activation-screen');
  const steps = [...document.querySelectorAll('.activation-steps article')];
  const layers = [...document.querySelectorAll('.screen-layer')];

  const setActive = (index) => {
    if (!screen) return;
    const active = Math.max(0, Math.min(steps.length - 1, index));
    screen.dataset.activeStep = String(active);
    steps.forEach((step, i) => step.classList.toggle('is-active', i === active));
    layers.forEach((layer, i) => layer.classList.toggle('is-active', i === active));
  };

  const updateScroll = () => {
    if (!activation) return;
    const rect = activation.getBoundingClientRect();
    const total = Math.max(1, rect.height - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / total));
    root.style.setProperty('--scroll', String(Math.round(progress * 360)));
    root.style.setProperty('--activation-progress', progress.toFixed(3));
    setActive(Math.min(2, Math.floor(progress * 3.05)));
  };

  setActive(0);
  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', updateScroll, { passive: true });

  window.addEventListener('pointermove', (event) => {
    root.style.setProperty('--mx', String(Math.round((event.clientX / window.innerWidth) * 100)));
    root.style.setProperty('--my', String(Math.round((event.clientY / window.innerHeight) * 100)));
  }, { passive: true });
})();
