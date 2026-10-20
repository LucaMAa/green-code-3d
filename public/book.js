const spreads = [...document.querySelectorAll('.spread')];
const scene = document.querySelector('#book-scene');
const chapterLabel = document.querySelector('#current-chapter');
const pageLabel = document.querySelector('#current-page');
const totalLabel = document.querySelector('#total-pages');
const progress = document.querySelector('#reading-progress');
const progressFill = document.querySelector('#reading-progress-fill');
const previousButton = document.querySelector('#previous-page');
const nextButton = document.querySelector('#next-page');
const indexButtons = [...document.querySelectorAll('.chapter-index [data-go-to]')];
const startButton = document.querySelector('.start-reading');
const presentationToggle = document.querySelector('#presentation-toggle');
let currentPage = 0;
let pointerStart;

totalLabel.textContent = String(spreads.length).padStart(2, '0');
progress.setAttribute('aria-valuemax', String(spreads.length));

function updateReader() {
  spreads.forEach((spread, index) => {
    const active = index === currentPage;
    spread.classList.toggle('is-current', active);
    spread.setAttribute('aria-hidden', String(!active));
  });

  const pageNumber = currentPage + 1;
  chapterLabel.textContent = spreads[currentPage].dataset.title;
  pageLabel.textContent = String(pageNumber).padStart(2, '0');
  progress.setAttribute('aria-valuenow', String(pageNumber));
  progress.setAttribute('aria-valuetext', `Tappa ${pageNumber} di ${spreads.length}`);
  progressFill.style.width = `${pageNumber / spreads.length * 100}%`;
  previousButton.disabled = currentPage === 0;
  nextButton.disabled = currentPage === spreads.length - 1;
  nextButton.querySelector('span').textContent = currentPage === spreads.length - 1 ? 'Fine' : 'Avanti';
  indexButtons.forEach((button) => {
    if (Number(button.dataset.goTo) === currentPage) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function goToPage(nextPage, direction) {
  if (nextPage < 0 || nextPage >= spreads.length || nextPage === currentPage) return;
  const previousSpread = spreads[currentPage];
  const nextSpread = spreads[nextPage];
  previousSpread.classList.remove('arriving-next', 'arriving-previous');
  currentPage = nextPage;
  updateReader();
  nextSpread.classList.add(`arriving-${direction}`);
  nextSpread.addEventListener('animationend', () => {
    nextSpread.classList.remove('arriving-next', 'arriving-previous');
  }, { once: true });
}

previousButton.addEventListener('click', () => goToPage(currentPage - 1, 'previous'));
nextButton.addEventListener('click', () => goToPage(currentPage + 1, 'next'));
indexButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const destination = Number(button.dataset.goTo);
    goToPage(destination, destination > currentPage ? 'next' : 'previous');
  });
});
startButton.addEventListener('click', () => {
  document.querySelector('.reader').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function setPresentationMode(enabled) {
  document.body.classList.toggle('presentation-mode', enabled);
  presentationToggle.setAttribute('aria-pressed', String(enabled));
  presentationToggle.innerHTML = enabled
    ? 'Esci dalla modalità LIM <span aria-hidden="true">ESCI</span>'
    : 'Modalità LIM <span aria-hidden="true">⛶</span>';
  if (enabled) {
    document.querySelector('.reader').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

presentationToggle.addEventListener('click', () => {
  setPresentationMode(presentationToggle.getAttribute('aria-pressed') !== 'true');
});

scene.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button, a')) return;
  pointerStart = { x: event.clientX, y: event.clientY };
});
scene.addEventListener('pointerup', (event) => {
  if (!pointerStart) return;
  const deltaX = event.clientX - pointerStart.x;
  const deltaY = event.clientY - pointerStart.y;
  pointerStart = undefined;
  if (Math.abs(deltaX) < 70 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
  if (window.getSelection() && !window.getSelection().isCollapsed) return;
  goToPage(currentPage + (deltaX < 0 ? 1 : -1), deltaX < 0 ? 'next' : 'previous');
});
scene.addEventListener('pointercancel', () => {
  pointerStart = undefined;
});

document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLInputElement) return;
  if (event.key === 'Escape' && document.body.classList.contains('presentation-mode')) {
    setPresentationMode(false);
    return;
  }
  if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement) return;
  if (event.key === 'ArrowRight') goToPage(currentPage + 1, 'next');
  if (event.key === 'ArrowLeft') goToPage(currentPage - 1, 'previous');
});

updateReader();
