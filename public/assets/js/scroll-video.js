/**
 * MS STUDIO — Scroll-Driven Video Hero
 * Preloads 67 HD frames and scrubs through them on scroll
 */

(function () {
  'use strict';

  const FRAME_BASE   = '/frames/Proffesional_Video_of_a_man_po_Seedance_20_';
  const FRAME_START  = 5671900;
  const FRAME_COUNT  = 34;

  const heroSection  = document.getElementById('hero');
  const canvas       = document.getElementById('hero-canvas');
  const ctx          = canvas.getContext('2d');
  const loader       = document.getElementById('hero-loader');
  const loaderFill   = document.getElementById('loader-fill');
  const frameBar     = document.getElementById('hero-frame-bar');
  const heroCta      = document.getElementById('hero-cta');
  const scrollInd    = document.getElementById('hero-scroll-indicator');

  const frames       = new Array(FRAME_COUNT);
  let   loadedCount  = 0;
  let   currentFrame = 0;
  let   allLoaded    = false;
  let   rafPending   = false;

  /* ── Resize canvas to full viewport ── */
  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    if (frames[currentFrame] && frames[currentFrame].complete) {
      drawFrame(currentFrame);
    }
  }

  /* ── Draw a single frame ── */
  function drawFrame(index) {
    const img = frames[index];
    if (!img || !img.complete) return;

    const cW = canvas.width;
    const cH = canvas.height;
    const iW = img.naturalWidth  || img.width;
    const iH = img.naturalHeight || img.height;

    // Cover-fit (like background-size: cover)
    const scale = Math.max(cW / iW, cH / iH);
    const dW    = iW * scale;
    const dH    = iH * scale;
    const dX    = (cW - dW) / 2;
    const dY    = (cH - dH) / 2;

    ctx.clearRect(0, 0, cW, cH);
    ctx.drawImage(img, dX, dY, dW, dH);
  }

  /* ── Preload all frames ── */
  function preloadFrames() {
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      const idx = i; // capture for closure

      img.onload = function () {
        loadedCount++;
        const pct = (loadedCount / FRAME_COUNT) * 100;
        loaderFill.style.width = pct + '%';

        // Draw first frame as soon as it's ready
        if (idx === 0) drawFrame(0);

        if (loadedCount === FRAME_COUNT) {
          onAllLoaded();
        }
      };

      img.onerror = function () {
        loadedCount++; // don't block on errors
        if (loadedCount === FRAME_COUNT) onAllLoaded();
      };

      img.src = `${FRAME_BASE}${FRAME_START + i}.jpg`;
      frames[i] = img;
    }
  }

  /* ── All frames loaded ── */
  function onAllLoaded() {
    allLoaded = true;

    // Hide loader with fade
    loader.classList.add('hidden');
    setTimeout(() => { loader.style.display = 'none'; }, 700);

    // Draw current frame based on current scroll
    updateFrame();
  }

  /* ── Calculate scroll progress & update frame ── */
  function updateFrame() {
    if (!heroSection) return;

    const scrollTop    = window.scrollY;
    const sectionTop   = heroSection.offsetTop;
    const sectionH     = heroSection.offsetHeight;
    const viewportH    = window.innerHeight;
    const scrollRange  = sectionH - viewportH;

    const rawProgress  = (scrollTop - sectionTop) / scrollRange;
    const progress     = Math.max(0, Math.min(1, rawProgress));

    // Map progress to frame index
    const frameIndex   = Math.min(
      Math.floor(progress * FRAME_COUNT),
      FRAME_COUNT - 1
    );

    // Update frame bar
    if (frameBar) {
      frameBar.style.width = (progress * 100) + '%';
    }

    // Show CTA after frame 23
    if (heroCta) {
      if (frameIndex >= 23) {
        heroCta.classList.add('visible');
      } else {
        heroCta.classList.remove('visible');
      }
    }

    // Hide scroll indicator after first scroll
    if (scrollInd && scrollTop > 60) {
      scrollInd.style.opacity = '0';
    } else if (scrollInd) {
      scrollInd.style.opacity = '1';
    }

    // Only redraw if frame changed
    if (frameIndex !== currentFrame) {
      currentFrame = frameIndex;

      // Use best available frame (fallback to nearest loaded)
      let drawIndex = frameIndex;
      if (!frames[drawIndex] || !frames[drawIndex].complete) {
        // Find nearest loaded frame
        for (let d = 1; d < FRAME_COUNT; d++) {
          if (frameIndex - d >= 0 && frames[frameIndex - d]?.complete) {
            drawIndex = frameIndex - d;
            break;
          }
          if (frameIndex + d < FRAME_COUNT && frames[frameIndex + d]?.complete) {
            drawIndex = frameIndex + d;
            break;
          }
        }
      }
      drawFrame(drawIndex);
    }

    rafPending = false;
  }

  /* ── Scroll handler (throttled with rAF) ── */
  function onScroll() {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(updateFrame);
    }
  }

  /* ── Init ── */
  function init() {
    if (!canvas || !heroSection) return;

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    preloadFrames();
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
