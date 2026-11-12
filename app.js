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

function initializeCostComparison() {
  const fields = {
    atual: { column: 1, label: 'Custeio atual', short: 'Atual' },
    loa: { column: 2, label: 'Custeio LOA 2027', short: 'LOA 2027' },
    aditivo: { column: 3, label: 'Custeio mensal no aditivo — 1ª fase', short: 'Aditivo' }
  };
  const first = document.querySelector('#cost-first');
  const second = document.querySelector('#cost-second');
  const format = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  // Read the displayed source amounts once and calculate in whole cents.
  const rows = [...document.querySelectorAll('.cost-table tbody tr')].map(row => ({
    row,
    cents: Object.fromEntries(Object.entries(fields).map(([key, field]) => [
      key, Number(row.cells[field.column].textContent.replace(/[^\d-]/g, ''))
    ]))
  }));

  function render() {
    let total = 0;
    rows.forEach(({ row, cents }) => {
      const difference = cents[first.value] - cents[second.value];
      row.cells[4].textContent = format.format(difference / 100);
      total += difference;
    });
    const formula = `${fields[first.value].label} − ${fields[second.value].label}`;
    document.querySelector('#cost-difference-formula').textContent = `${fields[first.value].short} − ${fields[second.value].short}`;
    document.querySelector('#cost-formula').textContent = formula;
    document.querySelector('#cost-caption').textContent = `Valores mensais em reais, com total de cada coluna. Diferença mensal: ${formula}.`;
    document.querySelector('.cost-table tfoot td:last-child').textContent = format.format(total / 100);
    document.querySelector('#cost-total').textContent = format.format(total / 100);
    fitPresentation();
  }

  first.addEventListener('change', render);
  second.addEventListener('change', render);
  document.querySelector('#cost-invert').addEventListener('click', () => {
    const firstKey = first.value;
    first.value = second.value;
    second.value = firstKey;
    render();
  });
  document.querySelector('.cost-comparison').hidden = false;
  render();
}

function fitPresentation() {
  const presenting = document.body.classList.contains('presentation-mode');
  if (!presenting) {
    slides.forEach(item => { item.style.transform = ''; item.style.top = ''; item.style.width = ''; item.style.left = ''; });
    return;
  }
  const stage = document.querySelector('#presentation');
  const slide = slides[current];
  const minimumWidth = stage.clientWidth < 620 ? 800 : 0;
  slide.style.width = `${Math.min(1320, Math.max(stage.clientWidth, minimumWidth))}px`;
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
    slides[current].scrollTop = 0;
    const heading = slides[current].querySelector('h1');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
    const enteredSlide = slides[current];
    requestAnimationFrame(() => {
      if (slides[current] === enteredSlide) window.scrollTo({ top: 0, behavior: 'instant' });
    });
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
  if (event.target.closest('.cost-table-scroll, .cost-comparison')) return;
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
initializeCostComparison();
setPresentation(matchMedia('(min-width: 901px)').matches);
syncHash();
