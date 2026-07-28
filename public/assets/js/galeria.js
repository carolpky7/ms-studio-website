document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const carId = urlParams.get('id');
  const titleEl = document.getElementById('gallery-title');
  const galleryEl = document.getElementById('masonry-gallery');

  if (!carId) {
    titleEl.textContent = 'Nie znaleziono galerii';
    titleEl.style.color = 'var(--text-dim)';
    galleryEl.innerHTML = '<p class="body-lg" style="color:var(--text-dim)">Brak parametru ID w adresie URL.</p>';
    return;
  }

  fetch('/assets/data/realizacje.json')
    .then(res => res.json())
    .then(data => {
      const car = data.find(c => c.id === carId);
      
      if (!car) {
        titleEl.textContent = 'Nie znaleziono galerii';
        titleEl.style.color = 'var(--text-dim)';
        galleryEl.innerHTML = '<p class="body-lg" style="color:var(--text-dim)">Galeria o podanym ID nie istnieje.</p>';
        return;
      }

      // Ustawienie tytułu
      titleEl.innerHTML = `Galeria z realizacji: <br/><span style="color:var(--accent)">${car.name}</span>`;

      // Generowanie Masonry Grid
      if (!car.galleryImages || car.galleryImages.length === 0) {
        galleryEl.innerHTML = '<p class="body-lg" style="color:var(--text-dim)">Ta galeria nie ma jeszcze żadnych zdjęć.</p>';
        return;
      }

      let galleryHTML = '';
      car.galleryImages.forEach(imgSrc => {
        galleryHTML += `
          <div class="masonry-item">
            <img src="${imgSrc}" alt="Zdjęcie ${car.name}" loading="lazy" />
          </div>
        `;
      });
      galleryEl.innerHTML = galleryHTML;
    })
    .catch(err => {
      console.error(err);
      titleEl.textContent = 'Wystąpił błąd';
      galleryEl.innerHTML = '<p class="body-lg" style="color:var(--text-dim)">Nie udało się wczytać danych galerii.</p>';
    });
});
