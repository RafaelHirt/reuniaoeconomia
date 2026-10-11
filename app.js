const slides = [...document.querySelectorAll('.slide')];
const links = [...document.querySelectorAll('.sidebar [data-slide]')];
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const modeToggle = document.querySelector('#mode-toggle');
const agendaToggle = document.querySelector('#agenda-toggle');
const agenda = document.querySelector('#agenda-menu');
const agendaClose = document.querySelector('#agenda-close');
const backdrop = document.querySelector('#menu-backdrop');
let current = 0;

function fitPresentation() {
  if (!document.body.classList.contains('presentation-mode')) {
    slides.forEach(item => { item.style.transform = ''; item.style.top = ''; item.style.width = ''; item.style.left = ''; });
    return;
  }
  const stage = document.querySelector('#presentation');
  const slide = slides[current];
  slide.style.width = `${Math.min(1320, Math.max(stage.clientWidth, stage.clientWidth < 620 ? 800 : 0))}px`;
  slide.style.transform = '';
  const scale = Math.min(1, stage.clientWidth / slide.offsetWidth, stage.clientHeight / slide.offsetHeight);
  slide.style.transformOrigin = 'top left';
  slide.style.transform = `scale(${scale})`;
  slide.style.left = `${Math.max(0, (stage.clientWidth - slide.offsetWidth * scale) / 2)}px`;
  slide.style.top = `${Math.max(0, (stage.clientHeight - slide.offsetHeight * scale) / 2)}px`;
}

function showSlide(index, moveFocus = false) {
  current = Math.min(Math.max(index, 0), slides.length - 1);
  slides.forEach((slide, i) => { slide.hidden = i !== current; });
  links.forEach((link, i) => {
    link.classList.toggle('active', i === current);
    if (i === current) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-pauta-link]').forEach(link => {
    if (link.dataset.pautaLink === slides[current].dataset.pauta) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
  document.querySelector('#counter').textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  document.querySelector('#section-name').textContent = links[current].textContent.slice(2).trim();
  document.querySelector('#progress-fill').style.width = `${(current + 1) / slides.length * 100}%`;
  document.querySelector('.progress').setAttribute('aria-valuenow', String(current + 1));
  document.querySelector('.progress').setAttribute('aria-valuemax', String(slides.length));
  previous.disabled = current === 0;
  next.disabled = current === slides.length - 1;
  document.title = `${slides[current].querySelector('h1').textContent.replace(/\s+/g, ' ').trim()} • SES-GO`;
  fitPresentation();
  if (moveFocus) {
    const heading = slides[current].querySelector('h1');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (matchMedia('(max-width: 900px)').matches && !document.body.classList.contains('presentation-mode')) {
      links[current].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    }
  }
}

function closeAgenda(restoreFocus = false) {
  const wasOpen = document.body.classList.contains('menu-open');
  document.body.classList.remove('menu-open');
  agendaToggle.setAttribute('aria-expanded', 'false');
  backdrop.hidden = true;
  agenda.removeAttribute('role');
  agenda.removeAttribute('aria-modal');
  if (restoreFocus && wasOpen) agendaToggle.focus({ preventScroll: true });
}
function openAgenda() {
  document.body.classList.add('menu-open');
  agendaToggle.setAttribute('aria-expanded', 'true');
  backdrop.hidden = false;
  agenda.setAttribute('role', 'dialog');
  agenda.setAttribute('aria-modal', 'true');
  agenda.setAttribute('aria-label', 'Pautas da reunião');
  links[current].focus({ preventScroll: true });
}
function navigate(index) {
  const target = Math.min(Math.max(index, 0), slides.length - 1);
  closeAgenda();
  if (target !== current) history.pushState(null, '', `#${slides[target].id}`);
  showSlide(target, true);
}
function syncHash() {
  if (['#slmb-custeio', '#slmb-implantacao'].includes(location.hash)) history.replaceState(null, '', '#slmb');
  const index = slides.findIndex(slide => `#${slide.id}` === location.hash);
  closeAgenda();
  showSlide(index < 0 ? 0 : index, true);
}
function setPresentation(enabled) {
  closeAgenda();
  document.body.classList.toggle('presentation-mode', enabled);
  modeToggle.setAttribute('aria-pressed', String(enabled));
  modeToggle.textContent = enabled ? 'Modo leitura' : 'Apresentar';
  fitPresentation();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

previous.addEventListener('click', () => navigate(current - 1));
next.addEventListener('click', () => navigate(current + 1));
document.querySelector('#begin').addEventListener('click', () => navigate(1));
modeToggle.addEventListener('click', () => setPresentation(!document.body.classList.contains('presentation-mode')));
agendaToggle.addEventListener('click', () => document.body.classList.contains('menu-open') ? closeAgenda(true) : openAgenda());
agendaClose.addEventListener('click', () => closeAgenda(true));
backdrop.addEventListener('click', () => closeAgenda(true));
window.addEventListener('hashchange', syncHash);
window.addEventListener('popstate', syncHash);
document.querySelectorAll('a[href^="#"]').forEach(link => {
  const index = slides.findIndex(slide => `#${slide.id}` === link.getAttribute('href'));
  if (index < 0) return;
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(index);
  });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (document.body.classList.contains('menu-open')) closeAgenda(true);
    else if (document.body.classList.contains('presentation-mode')) setPresentation(false);
    return;
  }
  if (document.body.classList.contains('menu-open')) {
    if (event.key === 'Tab') {
      const items = [...agenda.querySelectorAll('a, button')];
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    return;
  }
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
  fullscreenButton.textContent = document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia';
  fitPresentation();
});
window.addEventListener('resize', fitPresentation);
window.addEventListener('load', () => {
  fitPresentation();
  setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 0);
});
document.querySelectorAll('img').forEach(img => img.addEventListener('load', fitPresentation));
setPresentation(matchMedia('(min-width: 901px)').matches);
syncHash();
