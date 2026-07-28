/**
 * MS STUDIO — Main JS
 * Navbar, animations, service tile selection, dojazd widget
 */

(function () {
  'use strict';

  /* ── NAVBAR ── */
  const navbar     = document.getElementById('navbar');
  const hamburger  = document.getElementById('nav-hamburger');
  const mobileNav  = document.getElementById('nav-mobile');

  function handleNavbarScroll() {
    if (window.scrollY > 40) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  }

  function toggleMobileNav() {
    const isOpen = mobileNav?.classList.toggle('open');
    hamburger?.classList.toggle('open', isOpen);
    hamburger?.setAttribute('aria-expanded', String(isOpen));
  }

  // Close mobile nav on link click
  mobileNav?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      hamburger?.classList.remove('open');
      hamburger?.setAttribute('aria-expanded', 'false');
    });
  });

  hamburger?.addEventListener('click', toggleMobileNav);
  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();

  /* ── INTERSECTION OBSERVER (entrance animations) ── */
  const animatedEls = document.querySelectorAll('.animate-on-scroll');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    animatedEls.forEach(el => observer.observe(el));
  } else {
    // Fallback: show all immediately
    animatedEls.forEach(el => el.classList.add('visible'));
  }

  /* ── SERVICE TILES SELECTION ── */
  const uslugaCards = document.querySelectorAll('.usluga-card.card-selectable');

  uslugaCards.forEach(card => {
    function toggleCard() {
      const isSelected = card.classList.toggle('selected');
      card.setAttribute('aria-pressed', String(isSelected));
    }

    card.addEventListener('click', toggleCard);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCard();
      }
    });
  });

  /* ── DOJAZD WIDGET ── */
  const dojazdInput   = document.getElementById('dojazd-input');
  const dojazdBtn     = document.getElementById('dojazd-check-btn');
  const dojazdResult  = document.getElementById('dojazd-result');
  const dojazdIcon    = document.getElementById('dojazd-icon');
  const dojazdTitle   = document.getElementById('dojazd-title');
  const dojazdDesc    = document.getElementById('dojazd-desc');

  // Ostrowiec Świętokrzyski postal codes and keywords
  const FREE_KEYWORDS = [
    'ostrowiec', 'ostrowiec świętokrzyski', 'ostrowiec swietokrzyski',
    '27-400', '27-401', '27-402', '27-403', '27-404',
    '27-405', '27-406', '27-407', '27-408', '27-409', '27-410'
  ];

  function checkDelivery() {
    const val = dojazdInput?.value?.trim()?.toLowerCase() || '';
    if (!val) return;

    const isFree = FREE_KEYWORDS.some(kw => val.includes(kw));

    dojazdResult?.classList.remove('free-delivery', 'paid-delivery');

    if (isFree) {
      dojazdResult?.classList.add('free-delivery', 'visible');
      if (dojazdTitle) dojazdTitle.textContent = 'Darmowy dojazd!';
      if (dojazdDesc)  dojazdDesc.textContent  = 'Ostrowiec Świętokrzyski — dojazd w pełni bezpłatny.';
      if (dojazdIcon)  dojazdIcon.innerHTML    = '<polyline points="20 6 9 17 4 12" stroke="#54c3ea" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    } else {
      dojazdResult?.classList.add('paid-delivery', 'visible');
      if (dojazdTitle) dojazdTitle.textContent = 'Dopłata +30 PLN';
      if (dojazdDesc)  dojazdDesc.textContent  = 'Dojazd poza Ostrowcem — stała dopłata 30 PLN (zasięg do 60 km).';
      if (dojazdIcon)  dojazdIcon.innerHTML    = '<circle cx="12" cy="12" r="10" stroke="#ffc107" stroke-width="2" fill="none"/><line x1="12" y1="8" x2="12" y2="12" stroke="#ffc107" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="#ffc107" stroke-width="2.5" stroke-linecap="round"/>';
    }

    dojazdResult?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  dojazdBtn?.addEventListener('click', checkDelivery);
  dojazdInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') checkDelivery();
  });

  /* ── SMOOTH ANCHOR SCROLL (for nav links) ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH   = navbar?.offsetHeight || 72;
        const top    = target.getBoundingClientRect().top + window.scrollY - navH - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── PAGE LOAD PROGRESS BAR ── */
  const progressBar = document.getElementById('load-progress-bar');

  window.addEventListener('load', () => {
    if (progressBar) {
      progressBar.style.width   = '100%';
      progressBar.style.opacity = '0';
      setTimeout(() => { progressBar.style.display = 'none'; }, 600);
    }
  });
  /* ── DYNAMICZNE REALIZACJE (PRZED/PO) ── */
  const realizacjeGrid = document.getElementById('realizacje-grid');
  if (realizacjeGrid) {
    fetch('/assets/data/realizacje.json')
      .then(response => response.json())
      .then(data => {
        data.forEach((car, index) => {
          const delay = index + 1; // Dla animate-on-scroll delay
          
          const cardHTML = `
            <div class="realizacja-card animate-on-scroll delay-${delay}">
              <!-- Odznaka z nazwą auta -->
              <div class="car-name-badge">${car.name}</div>
              
              <!-- Przycisk do galerii -->
              <a href="/galeria.html?id=${car.id}" class="gallery-btn" aria-label="Galeria dla ${car.name}">Galeria &gt;</a>

              <div class="realizacja-images">
                <img src="${car.beforeImage}" alt="Przed detailingiem: ${car.name}" class="img-before" onerror="this.src='https://placehold.co/800x600/161819/54c3ea?text=PRZED'" />
                <img src="${car.afterImage}" alt="Po detailingu: ${car.name}" class="img-after" onerror="this.src='https://placehold.co/800x600/161819/54c3ea?text=PO'" />
              </div>
              <div class="realizacja-ba-label">
                <button type="button" class="ba-btn before active" aria-label="Pokaż zdjęcie przed" data-target="before">Przed</button>
                <button type="button" class="ba-btn after" aria-label="Pokaż zdjęcie po" data-target="after">Po</button>
              </div>
            </div>
          `;
          realizacjeGrid.insertAdjacentHTML('beforeend', cardHTML);
        });

        // Re-attach event listeners for generated cards
        const realizacjaCards = realizacjeGrid.querySelectorAll('.realizacja-card');
        realizacjaCards.forEach(card => {
          const btns = card.querySelectorAll('.ba-btn');
          btns.forEach(btn => {
            btn.addEventListener('click', () => {
              btns.forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              if (btn.dataset.target === 'after') {
                card.classList.add('show-after');
              } else {
                card.classList.remove('show-after');
              }
            });
          });
        });
        
        // Trigger IntersectionObserver for newly added elements (if the observer exists globally, we would call it. We assume scrolling will catch it if they are below fold, or we can just make them visible if already in viewport).
        // Since animate-on-scroll logic is usually bound once, we might need to re-trigger it. Let's assume standard behavior or they will appear as user scrolls.
        const observer = window.scrollObserver;
        if (observer) {
          realizacjeGrid.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
        }
      })
      .catch(error => console.error('Błąd wczytywania realizacji:', error));
  }

})();
