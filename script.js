(() => {
  const video = document.getElementById('scrub-video');
  const wrapper = document.querySelector('.chapters-wrapper');
  const chapters = document.querySelectorAll('.chapter');

  let videoDuration = 0;
  let videoReady = false;

  // ── Load video as blob ──
  // Fetching the entire file into memory guarantees every frame
  // is available for instant seeking. preload="auto" is just a
  // hint that browsers often ignore for large files.

  fetch('https://www.apple.com/105/media/us/macbook-neo/2026/eee281c9-06d4-45d9-9a37-ef16ad413279/anim/performance/large_2x.mp4')
    .then(r => r.blob())
    .then(blob => {
      video.src = URL.createObjectURL(blob);
    });

  video.addEventListener('loadedmetadata', () => {
    videoDuration = video.duration;
    videoReady = true;
    update();
  });

  // ── Scroll progress (0–1) ──
  // Maps how far you've scrolled through the 700vh wrapper.

  function getProgress() {
    const rect = wrapper.getBoundingClientRect();
    const scrollable = wrapper.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return Math.min(Math.max(-rect.top / scrollable, 0), 1);
  }

  // ── Chapter animation ──
  // Each chapter has three phases: intro (fade in), bridge (hold),
  // outro (fade out). Y values from Apple's CSS custom properties.

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function animateChapter(chapter, progress) {
    const d = chapter.dataset;
    const introStart = +d.introStart, introEnd = +d.introEnd;
    const bridgeStart = +d.bridgeStart, bridgeEnd = +d.bridgeEnd;
    const outroStart = +d.outroStart, outroEnd = +d.outroEnd;

    let opacity = 0;
    let y = 90; // off-screen below

    if (progress >= introStart && progress < introEnd) {
      const t = (progress - introStart) / (introEnd - introStart);
      opacity = t;
      y = lerp(90, 15, t);
    } else if (progress >= introEnd && progress < outroStart) {
      const t = (progress - bridgeStart) / (bridgeEnd - bridgeStart);
      opacity = 1;
      y = lerp(15, -15, Math.min(t, 1));
    } else if (progress >= outroStart && progress <= outroEnd) {
      const t = (progress - outroStart) / (outroEnd - outroStart);
      opacity = 1 - t;
      y = lerp(-15, -120, t);
    }

    chapter.style.opacity = opacity;
    chapter.style.transform = `translateY(${y}px)`;

    // Trigger gradient sweep once (Apple uses toggle:false — never removes)
    const gt = chapter.querySelector('.gradient-text');
    if (progress >= +gt.dataset.gradientTrigger) {
      gt.classList.add('active');
    }
  }

  // ── Bottom headline — triggers on viewport entry ──

  const bottomHL = document.querySelector('.bottom-headline');
  if (bottomHL) {
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) {
        bottomHL.classList.add('active');
        obs.disconnect();
      }
    }, { threshold: 0.5 }).observe(bottomHL);
  }

  // ── Scroll loop ──

  let ticking = false;

  function update() {
    const progress = getProgress();

    // Scrub video — the video is re-encoded with every frame as
    // a keyframe (-g 1) so any currentTime seek is instant.
    if (videoReady) {
      video.currentTime = progress * videoDuration;
    }

    chapters.forEach(ch => animateChapter(ch, progress));
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  update();
})();
