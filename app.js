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

function createMeetingClock() {
  const storageKey = 'ses-go-meeting-clock-v1';
  const durations = Object.fromEntries(slides.map(slide => [slide.id, 0]));
  let active = slides[0].id;
  let running = false;
  let checkpoint = Date.now();
  const clock = document.querySelector('.meeting-clock');
  const toggle = document.querySelector('#clock-toggle');
  const reset = document.querySelector('#clock-reset');
  const summary = document.querySelector('#clock-summary');
  const status = document.querySelector('#clock-status');
  const topicNames = { I: 'Pauta I · Condicionantes', II: 'Pauta II · Aditivos', III: 'Pauta III · Prazos', abertura: 'Abertura', encerramento: 'Encerramento' };
  const topicOf = slide => slide.dataset.pauta || slide.id;
  const pageNames = Object.fromEntries(slides.map((slide, i) => [slide.id, links[i].textContent.slice(2).trim()]));
  const groups = ['abertura', 'I', 'II', 'III', 'encerramento'].map(topic => {
    const group = document.createElement('section');
    const heading = document.createElement('h3');
    const value = document.createElement('span');
    heading.append(document.createTextNode(topicNames[topic]), value);
    group.append(heading);
    const pages = slides.filter(slide => topicOf(slide) === topic).map(slide => {
      const line = document.createElement('div');
      const time = document.createElement('span');
      line.className = 'clock-page-row';
      line.append(document.createTextNode(pageNames[slide.id]), time);
      group.append(line);
      return { id: slide.id, time };
    });
    document.querySelector('#clock-breakdown').append(group);
    return { topic, value, pages };
  });

  function settle() {
    const now = Date.now();
    if (running) durations[active] += Math.max(0, now - checkpoint);
    checkpoint = now;
  }
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey));
    if (stored && Object.hasOwn(durations, stored.active)) {
      for (const id of Object.keys(durations)) {
        const value = stored.durations?.[id];
        if (Number.isFinite(value) && value >= 0) durations[id] = value;
      }
      active = stored.active;
      running = stored.running === true;
      if (Number.isFinite(stored.checkpoint)) checkpoint = stored.checkpoint;
      settle();
    }
  } catch { /* Storage may be unavailable in private browsing. */ }

  function persist() {
    try { sessionStorage.setItem(storageKey, JSON.stringify({ durations, active, running, checkpoint })); } catch { /* Keep the clock usable without storage. */ }
  }
  function format(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const parts = [Math.floor(seconds / 60) % 60, seconds % 60];
    if (seconds >= 3600) parts.unshift(Math.floor(seconds / 3600));
    return parts.map(value => String(value).padStart(2, '0')).join(':');
  }
  function render() {
    const slide = slides.find(item => item.id === active);
    const topic = topicOf(slide);
    const total = Object.values(durations).reduce((sum, value) => sum + value, 0);
    const topicTotal = slides.filter(item => topicOf(item) === topic).reduce((sum, item) => sum + durations[item.id], 0);
    document.querySelector('#page-time').textContent = format(durations[active]);
    document.querySelector('#page-time').setAttribute('aria-label', `Tempo em ${pageNames[active]}: ${format(durations[active])}`);
    document.querySelector('#topic-time-label').textContent = slide.dataset.pauta ? `Pauta ${slide.dataset.pauta}` : topicNames[topic];
    document.querySelector('#topic-time').textContent = format(topicTotal);
    document.querySelector('#meeting-time').textContent = format(total);
    groups.forEach(group => {
      group.value.textContent = format(group.pages.reduce((sum, page) => sum + durations[page.id], 0));
      group.pages.forEach(page => { page.time.textContent = format(durations[page.id]); });
    });
    toggle.textContent = running ? 'Pausar' : total > 0 ? 'Retomar' : 'Iniciar';
    toggle.setAttribute('aria-label', `${toggle.textContent} cronômetro da reunião`);
    reset.disabled = total === 0 && !running;
    clock.classList.toggle('is-running', running);
    const message = running ? 'Em andamento' : total > 0 ? 'Pausado' : 'Pronto para iniciar';
    if (status.textContent !== message) status.textContent = message;
  }
  function start() {
    if (running) return;
    checkpoint = Date.now();
    running = true;
    render();
    persist();
  }
  toggle.addEventListener('click', () => {
    if (!running) { start(); return; }
    settle();
    running = false;
    render();
    persist();
  });
  reset.addEventListener('click', () => {
    running = false;
    Object.keys(durations).forEach(id => { durations[id] = 0; });
    checkpoint = Date.now();
    render();
    persist();
  });
  window.setInterval(() => {
    if (!running) return;
    settle();
    render();
    persist();
  }, 1000);
  window.addEventListener('pagehide', () => { settle(); persist(); });
  window.addEventListener('pageshow', () => { settle(); render(); persist(); });
  document.addEventListener('click', event => {
    if (!summary.contains(event.target)) summary.open = false;
  });
  render();
  return {
    start,
    changePage(slide) {
      settle();
      active = slide.id;
      summary.open = false;
      render();
      persist();
    }
  };
}
const meetingClock = createMeetingClock();
const posse = document.querySelector('#posse');
function fitPresentation() {
  const presenting = document.body.classList.contains('presentation-mode');
  document.body.classList.toggle('document-slide', presenting && slides[current] === posse);
  if (!presenting) {
    slides.forEach(item => { item.style.transform = ''; item.style.top = ''; item.style.width = ''; item.style.left = ''; });
    return;
  }
  const stage = document.querySelector('#presentation');
  const slide = slides[current];
  if (slide === posse) {
    slide.style.transform = ''; slide.style.top = ''; slide.style.width = ''; slide.style.left = '';
    return;
  }
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
  meetingClock.changePage(slides[current]);
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
document.querySelector('#begin').addEventListener('click', () => { navigate(1); meetingClock.start(); });
document.querySelector('#back-to-posse').addEventListener('click', () => {
  const heading = document.querySelector('#title-1');
  heading.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  heading.focus({ preventScroll: true });
});
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
    const clockSummary = document.querySelector('#clock-summary');
    if (clockSummary.open) { clockSummary.open = false; clockSummary.querySelector('summary').focus(); }
    else if (document.body.classList.contains('menu-open')) closeAgenda(true);
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
  if (event.target.closest('.units-table-scroll')) return;
  if (document.body.classList.contains('document-slide') && ['PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) return;
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
