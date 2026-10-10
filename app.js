const slides = [...document.querySelectorAll('.slide')];
const links = [...document.querySelectorAll('nav [data-slide]')];
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
let current = 0;
function showSlide(index) {
  current = Math.min(Math.max(index, 0), slides.length - 1);
  slides.forEach((slide, i) => { slide.hidden = i !== current; });
  links.forEach((link, i) => {
    link.classList.toggle('active', i === current);
    if (i === current) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
  document.querySelector('#counter').textContent = `${String(current + 1).padStart(2, '0')} / 07`;
  document.querySelector('#section-name').textContent = links[current].textContent.slice(2).trim();
  document.querySelector('#progress-fill').style.width = `${(current + 1) / slides.length * 100}%`;
  previous.disabled = current === 0;
  next.disabled = current === slides.length - 1;
  document.title = `${slides[current].querySelector('h1').textContent.replace(/\s+/g, ' ').trim()} • SES-GO`;
}
function navigate(index) {
  const target = Math.min(Math.max(index, 0), slides.length - 1);
  showSlide(target);
  if (location.hash !== `#${slides[target].id}`) location.hash = slides[target].id;
}
function syncHash() {
  const index = slides.findIndex(slide => `#${slide.id}` === location.hash);
  showSlide(index < 0 ? 0 : index);
}
previous.addEventListener('click', () => navigate(current - 1));
next.addEventListener('click', () => navigate(current + 1));
document.querySelector('#begin').addEventListener('click', () => navigate(1));
window.addEventListener('hashchange', syncHash);
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
  if (['ArrowRight', 'PageDown'].includes(event.key)) { event.preventDefault(); navigate(current + 1); }
  if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); navigate(current - 1); }
  if (event.key === 'Home') { event.preventDefault(); navigate(0); }
  if (event.key === 'End') { event.preventDefault(); navigate(slides.length - 1); }
});
document.querySelector('#print').addEventListener('click', () => window.print());
const fullscreenButton = document.querySelector('#fullscreen');
if (!document.fullscreenEnabled) fullscreenButton.hidden = true;
fullscreenButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { fullscreenButton.textContent = 'Tela cheia indisponível'; }
});
document.addEventListener('fullscreenchange', () => {
  fullscreenButton.textContent = document.fullscreenElement ? 'Sair da tela cheia ⛶' : 'Tela cheia ⛶';
});
syncHash();
