const slides = [...document.querySelectorAll('.slide')];
const links = [...document.querySelectorAll('nav [data-slide]')];
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
let current = 0;
function showSlide(index, moveFocus = false) {
  current = Math.min(Math.max(index, 0), slides.length - 1);
  slides.forEach((slide, i) => { slide.hidden = i !== current; });
  links.forEach((link, i) => {
    link.classList.toggle('active', i === current);
    if (i === current) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
  document.querySelector('#counter').textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  document.querySelector('#section-name').textContent = links[current].textContent.slice(2).trim();
  document.querySelector('#progress-fill').style.width = `${(current + 1) / slides.length * 100}%`;
  document.querySelector('.progress').setAttribute('aria-valuenow', String(current + 1));
  previous.disabled = current === 0;
  next.disabled = current === slides.length - 1;
  if (moveFocus) {
    const heading = slides[current].querySelector('h1');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (matchMedia('(max-width: 900px)').matches) {
      links[current].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    }
  }
  fitPresentation();
  document.title = `${slides[current].querySelector('h1').textContent.replace(/\s+/g, ' ').trim()} • SES-GO`;
}
function navigate(index) {
  const target = Math.min(Math.max(index, 0), slides.length - 1);
  if (target === current) return;
  history.pushState(null, '', `#${slides[target].id}`);
  showSlide(target, true);
}
function syncHash() {
  if (['#slmb-custeio', '#slmb-implantacao'].includes(location.hash)) {
    history.replaceState(null, '', '#slmb');
  }
  const index = slides.findIndex(slide => `#${slide.id}` === location.hash);
  showSlide(index < 0 ? 0 : index, true);
}
previous.addEventListener('click', () => navigate(current - 1));
next.addEventListener('click', () => navigate(current + 1));
document.querySelector('#begin').addEventListener('click', () => navigate(1));
window.addEventListener('hashchange', syncHash);
window.addEventListener('popstate', syncHash);
document.querySelectorAll('a[href^="#"]').forEach(link => {
  const index = slides.findIndex(slide => `#${slide.id}` === link.getAttribute('href'));
  if (index < 0) return;
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (index !== current) navigate(index);
    closeAgenda();
  });
});
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
  if (['ArrowRight', 'PageDown'].includes(event.key)) { event.preventDefault(); navigate(current + 1); }
  if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); navigate(current - 1); }
  if (event.key === 'Home') { event.preventDefault(); navigate(0); }
  if (event.key === 'End') { event.preventDefault(); navigate(slides.length - 1); }
});
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  document.querySelector('#presentation').focus({ preventScroll: true });
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
// Evita o salto automático do navegador ao abrir um link de unidade.
window.addEventListener('load', () => {
  setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 0);
});

const modeToggle = document.querySelector('#mode-toggle');
const agendaToggle = document.querySelector('#agenda-toggle');
function closeAgenda() {
  document.body.classList.remove('menu-open');
  agendaToggle.setAttribute('aria-expanded', 'false');
}
function fitPresentation() {
  const slide = slides[current];
  if (!document.body.classList.contains('presentation-mode')) {
    slides.forEach(item => { item.style.transform = ''; item.style.top = ''; item.style.width = ''; });
    return;
  }
  const stage = document.querySelector('#presentation');
  const mobile = stage.clientWidth < 620;
  // Mantém uma largura de leitura antes de ajustar o conteúdo à janela.
  slide.style.width = `${mobile ? Math.max(stage.clientWidth, 800) : stage.clientWidth}px`;
  slide.style.transform = '';
  const scale = Math.min(1, stage.clientWidth / slide.offsetWidth, stage.clientHeight / slide.offsetHeight);
  slide.style.transformOrigin = 'top left';
  slide.style.transform = `scale(${scale})`;
  slide.style.left = `${Math.max(0, (stage.clientWidth - slide.offsetWidth * scale) / 2)}px`;
  slide.style.top = `${Math.max(0, (stage.clientHeight - slide.offsetHeight * scale) / 2)}px`;
}
function setPresentation(enabled) {
  document.body.classList.toggle('presentation-mode', enabled);
  modeToggle.setAttribute('aria-pressed', String(enabled));
  modeToggle.textContent = enabled ? 'Modo leitura' : 'Apresentar';
  closeAgenda();
  if (!enabled) slides.forEach(item => { item.style.left = ''; item.style.transformOrigin = ''; });
  fitPresentation();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
modeToggle.addEventListener('click', () => setPresentation(!document.body.classList.contains('presentation-mode')));
agendaToggle.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  agendaToggle.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (document.body.classList.contains('menu-open')) closeAgenda();
    else if (document.body.classList.contains('presentation-mode')) setPresentation(false);
  }
});
window.addEventListener('resize', fitPresentation);
window.addEventListener('load', fitPresentation);
document.querySelectorAll('img').forEach(img => img.addEventListener('load', fitPresentation));
setPresentation(matchMedia('(min-width: 901px)').matches);
