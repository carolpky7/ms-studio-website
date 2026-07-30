/**
 * MS STUDIO — portfolio.js
 * Renders car tiles on /realizacje.html from window.realizacjeData
 */
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('portfolio-grid');
  const empty = document.getElementById('portfolio-empty');

  if (!grid || !window.realizacjeData || window.realizacjeData.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }

  window.realizacjeData.forEach((car, index) => {
    const card = document.createElement('div');
    card.className = 'portfolio-card animate-on-scroll';
    if (index > 0) card.classList.add(`delay-${Math.min(index, 3)}`);

    card.innerHTML = `
      <a href="/galeria.html?id=${car.id}" class="portfolio-card-link" aria-label="Zobacz galerię: ${car.name}">
        <div class="portfolio-card-image">
          <img
            src="${car.coverImage}"
            alt="${car.name}"
            loading="lazy"
            onerror="this.src='https://placehold.co/800x600/161819/54c3ea?text=${encodeURIComponent(car.name)}'"
          />
          <div class="portfolio-card-overlay">
            <span class="portfolio-card-cta">
              Zobacz galerię
              <svg viewBox="0 0 24 24" aria-hidden="true" style="width:16px;height:16px;fill:currentColor;margin-left:6px;">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
              </svg>
            </span>
          </div>
        </div>
        <div class="portfolio-card-info">
          <h3 class="portfolio-card-name">${car.name}</h3>
          <span class="portfolio-card-count">${car.images.length} zdjęć</span>
        </div>
      </a>
    `;

    grid.appendChild(card);
  });

  // Trigger IntersectionObserver for newly added elements
  if (window.scrollObserver) {
    grid.querySelectorAll('.animate-on-scroll').forEach(el => window.scrollObserver.observe(el));
  }
});
