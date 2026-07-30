/**
 * MS STUDIO — galeria.js
 * Renders individual car gallery on /galeria.html?id=...
 */
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const carId = urlParams.get('id');

  if (!carId || !window.realizacjeData) {
    document.title = 'Nie znaleziono | MS STUDIO';
    document.getElementById('gallery-car-name').textContent = 'Nie znaleziono realizacji';
    return;
  }

  const car = window.realizacjeData.find(c => c.id === carId);

  if (!car) {
    document.title = 'Nie znaleziono | MS STUDIO';
    document.getElementById('gallery-car-name').textContent = 'Nie znaleziono realizacji';
    return;
  }

  // --- Set page title and header ---
  document.title = `${car.name} | MS STUDIO`;
  document.getElementById('gallery-page-title').textContent = `${car.name} | MS STUDIO`;
  document.getElementById('gallery-car-name').textContent = car.name;
  document.getElementById('gallery-car-label').textContent = 'Realizacja';

  // --- Render photo gallery (masonry) ---
  const galleryGrid = document.getElementById('gallery-grid');
  if (galleryGrid && car.images && car.images.length > 0) {
    car.images.forEach((filename, i) => {
      const item = document.createElement('div');
      item.className = 'masonry-item animate-on-scroll';
      if (i > 0) item.classList.add(`delay-${Math.min(i, 3)}`);

      const img = document.createElement('img');
      img.src = `/assets/images/realizacje/${car.id}/${filename}`;
      img.alt = `${car.name} - zdjęcie ${i + 1}`;
      img.loading = 'lazy';
      img.onerror = function() {
        this.src = `https://placehold.co/800x600/161819/54c3ea?text=${encodeURIComponent(car.name)}`;
      };

      item.appendChild(img);
      galleryGrid.appendChild(item);
    });
  }

  // --- Render services list ---
  const servicesList = document.getElementById('gallery-services-list');
  if (servicesList && car.services && car.services.length > 0) {
    car.services.forEach(service => {
      const li = document.createElement('li');
      li.className = 'gallery-service-item';
      li.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" style="width:18px;height:18px;fill:var(--accent);flex-shrink:0;margin-top:2px;">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        <span>${service}</span>
      `;
      servicesList.appendChild(li);
    });
  }

  // --- Render review ---
  if (car.review) {
    const reviewText = document.getElementById('gallery-review-text');
    const reviewAuthor = document.getElementById('gallery-review-author');
    if (reviewText) reviewText.textContent = car.review.text;
    if (reviewAuthor) reviewAuthor.textContent = car.review.author;
  }

  // --- Trigger IntersectionObserver for newly added elements ---
  if (window.scrollObserver) {
    document.querySelectorAll('.animate-on-scroll').forEach(el => window.scrollObserver.observe(el));
  }
});
