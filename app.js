import { UNITS, HEAL, PHASES, DP_TOTALS, HEMODIALYSIS_TOTAL, SCENARIOS, money, quantity, percentage, calculateScenario, schedule, validMonths } from './budget.js';

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

function budgetMetric(label, value, detail, emphasis = false, key = '') {
  return `<div class="budget-metric${emphasis ? ' budget-metric-emphasis' : ''}"><span>${label}</span><strong${key ? ` data-total="${key}"` : ''}>${money(value)}</strong><small>${detail}</small></div>`;
}

function renderTimeline(result) {
  return `<div class="phase-timeline" aria-label="Cronograma de janeiro a dezembro de 2027">${schedule(result.months).map(item => `<div class="phase-period phase-${item.phase + 1}" style="flex:${item.months}" title="${PHASES[item.phase]}: ${item.label}, ${item.months} meses"><div><strong>${PHASES[item.phase]}</strong><span>${item.label}</span></div><small>${item.months} ${item.months === 1 ? 'mês' : 'meses'}</small></div>`).join('')}</div>`;
}

function renderScenario(target, result, showMetrics = true, costLabel = 'Termo Aditivo das fases simuladas') {
  const methodId = `${target.id}-method`;
  const formula = result.months.flatMap((months, phase) => months ? [`(${months} × custeio mensal da ${PHASES[phase]})`] : []).join(' + ');
  target.innerHTML = `${showMetrics ? `<div class="budget-metrics">${budgetMetric('PLOA 2027 · anual', result.ploa, 'Seis policlínicas · valor mensal × 12', false, 'ploa')}${budgetMetric(`${costLabel} · anual`, result.needed, 'Conforme a distribuição de fases', false, 'needed')}${budgetMetric('Acréscimo à PLOA · anual', result.difference, `${percentage(result.increase)} acima da PLOA`, true, 'difference')}</div>` : ''}
    ${renderTimeline(result)}
    <div class="scenario-columns">
      <section class="budget-table-card">
        <div class="table-card-heading"><h2>Custeio e diferença para a PLOA</h2><span>VALORES ANUAIS</span></div>
        <p class="budget-scroll-hint"><span aria-hidden="true">↔</span> Deslize para ver todas as colunas.</p>
        <div class="budget-table-scroll" role="region" aria-label="Custos anuais e diferença para a PLOA por policlínica" tabindex="0">
          <table class="annual-budget-table" aria-describedby="${methodId}"><caption class="sr-only">Valores anuais de 2027. A diferença é o valor anual do ${costLabel} menos a PLOA anual.</caption><colgroup><col class="budget-unit-col"><col span="3"></colgroup><thead><tr><th scope="col">Unidade</th><th scope="col">PLOA 2027</th><th scope="col">${costLabel}</th><th scope="col">Diferença<br>Termo Aditivo − PLOA</th></tr></thead><tbody>${result.rows.map(row => `<tr><th scope="row">${row.name}</th><td>${money(row.ploa)}</td><td>${money(row.needed)}</td><td>${money(row.difference)}</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row">Total</th><td data-total="ploa">${money(result.ploa)}</td><td data-total="needed">${money(result.needed)}</td><td data-total="difference">${money(result.difference)}</td></tr></tfoot></table>
        </div>
      </section>
      <section class="budget-table-card dp-card">
        <div class="table-card-heading"><h2>DP por fase e Hemodiálise</h2><span>QUANTIDADE</span></div>
        <p class="budget-scroll-hint"><span aria-hidden="true">↔</span> Deslize para ver todas as colunas.</p>
        <div class="budget-table-scroll" role="region" aria-label="DP por fase e quantidade de Hemodiálise conforme a planilha" tabindex="0">
          <table class="dp-table"><caption class="sr-only">DP previstas por unidade e fase, com a quantidade de Hemodiálise informada na planilha. Hemodiálise não está discriminada por fase.</caption><colgroup><col class="dp-unit-col"><col span="3" class="dp-phase-col"><col class="hemodialysis-col"></colgroup><thead><tr><th scope="col">Unidade</th>${PHASES.map((phase, i) => `<th scope="col" class="${result.months[i] ? 'active-phase' : 'inactive-phase'}">${phase}<small>${result.months[i]} ${result.months[i] === 1 ? 'mês' : 'meses'}</small></th>`).join('')}<th scope="col" class="hemodialysis-cell">Hemodiálise<small>Planilha</small></th></tr></thead><tbody>${UNITS.map(unit => `<tr><th scope="row">${unit.name}</th>${unit.dp.map((value, i) => `<td class="${result.months[i] ? 'active-phase' : 'inactive-phase'}">${value}</td>`).join('')}<td class="hemodialysis-cell">${quantity(unit.hemodialysis)}</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row">Total</th>${DP_TOTALS.map((value, i) => `<td class="${result.months[i] ? 'active-phase' : 'inactive-phase'}">${value}</td>`).join('')}<td class="hemodialysis-cell">${quantity(HEMODIALYSIS_TOTAL)}</td></tr></tfoot></table>
        </div>
      </section>
    </div>
    <div class="scenario-method" id="${methodId}"><p><strong>${costLabel} · anual</strong> = ${formula}. <strong>Diferença</strong> = ${costLabel} (anual) − PLOA anual.</p><p>PLOA anual = valor mensal informado × 12, sem reajustes. DP previstas em cada fase; fases com 0 meses não compõem o custeio deste cenário. Hemodiálise: quantidade informada na planilha, sem discriminação por fase.</p></div>`;
}

function renderComparison(simulation) {
  const comparisons = [
    { key: 'first', label: 'Cenário I', result: calculateScenario(SCENARIOS.first) },
    { key: 'phased', label: 'Cenário II', result: calculateScenario(SCENARIOS.phased) },
    { key: 'simulation', label: 'Sua simulação', result: simulation }
  ];
  document.querySelector('#scenario-comparison').innerHTML = `<div class="comparison-heading"><h2>Comparação anual</h2><span>PLOA 2027: <strong>${money(simulation.ploa)}</strong></span></div><p class="budget-scroll-hint"><span aria-hidden="true">↔</span> Deslize para comparar os valores.</p><div class="budget-table-scroll comparison-scroll" role="region" aria-label="Comparação dos dois cenários e da simulação" tabindex="0"><table class="scenario-summary-table"><caption class="sr-only">Comparação anual para as seis policlínicas, com a mesma PLOA em todos os cenários.</caption><thead><tr><th scope="col">Cenário</th><th scope="col">Meses nas fases I / II / III</th><th scope="col">Termo Aditivo · anual</th><th scope="col">Acréscimo à PLOA</th><th scope="col">Acréscimo %</th></tr></thead><tbody>${comparisons.map(({ key, label, result }) => `<tr data-scenario-row="${key}" class="${key === 'simulation' ? 'simulation-row' : ''}"><th scope="row">${label}</th><td>${result.months.join(' / ')}</td><td data-total="needed">${money(result.needed)}</td><td data-total="difference">${money(result.difference)}</td><td>${percentage(result.increase)}</td></tr>`).join('')}</tbody></table></div>`;
}

function initializeSimulation() {
  const inputs = [...document.querySelectorAll('.month-fields input')];
  const status = document.querySelector('#simulation-validation');
  const results = document.querySelector('#simulation-results');
  const presets = [...document.querySelectorAll('[data-months]')];
  function update() {
    const months = inputs.map(input => input.valueAsNumber);
    const valid = validMonths(months);
    const validValues = months.every(value => Number.isInteger(value) && value >= 0 && value <= 12);
    inputs.forEach(input => input.setAttribute('aria-invalid', String(!valid)));
    results.hidden = !valid;
    document.querySelector('#simulation-print-error').hidden = valid;
    status.classList.toggle('is-invalid', !valid);
    presets.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.months === months.join(','))));
    if (!valid) {
      status.textContent = validValues ? `Distribua exatamente 12 meses. Total informado: ${months.reduce((sum, value) => sum + value, 0)} meses.` : 'Preencha cada fase com um número inteiro de 0 a 12 meses.';
      document.querySelector('#simulation-announcement').textContent = 'Simulação não calculada. Verifique a distribuição dos meses.';
      fitPresentation();
      return;
    }
    const simulation = calculateScenario(months);
    status.textContent = '12 de 12 meses distribuídos. As fases seguem a ordem I → II → III.';
    renderComparison(simulation);
    renderScenario(document.querySelector('#scenario-simulation'), simulation, false);
    document.querySelector('#simulation-announcement').textContent = `Termo Aditivo anual: ${money(simulation.needed)}. Acréscimo à PLOA: ${money(simulation.difference)}, equivalente a ${percentage(simulation.increase)}.`;
    fitPresentation();
  }
  inputs.forEach(input => input.addEventListener('input', update));
  presets.forEach(button => button.addEventListener('click', () => {
    button.dataset.months.split(',').forEach((value, index) => { inputs[index].value = value; });
    update();
  }));
  document.querySelector('#simulation-controls').hidden = false;
  update();
}

function initializeBudgetViews() {
  renderScenario(document.querySelector('#scenario-first'), calculateScenario(SCENARIOS.first), true, 'Termo Aditivo 1º Fase');
  renderScenario(document.querySelector('#scenario-phased'), calculateScenario(SCENARIOS.phased), true, 'Termo Aditivo Fases RD');
  const difference = HEAL.current - HEAL.ploa;
  document.querySelector('#heal-report').innerHTML = `<div class="budget-metrics heal-metrics">${budgetMetric('PLOA 2027 · mensal', HEAL.ploa, 'Valor informado para o HEAL', false, 'ploa')}${budgetMetric('Custeio atual · mensal', HEAL.current, 'Valor mensal atual do HEAL', false, 'current')}${budgetMetric('Diferença mensal', difference, `${percentage(difference / HEAL.ploa)} acima da PLOA`, true, 'difference')}</div><div class="heal-chart" role="img" aria-label="PLOA mensal de ${money(HEAL.ploa)} e custeio atual mensal de ${money(HEAL.current)}"><div class="heal-bar-row"><span>PLOA 2027</span><div class="heal-bar-track"><div class="heal-bar ploa-bar" style="width:${HEAL.ploa / HEAL.current * 100}%"></div></div><strong>${money(HEAL.ploa)}</strong></div><div class="heal-bar-row"><span>Custeio atual</span><div class="heal-bar-track"><div class="heal-bar current-bar" style="width:100%"></div></div><strong>${money(HEAL.current)}</strong></div></div><div class="heal-difference"><div><span>DIFERENÇA MENSAL · HEAL</span><p>Valor atual − valor PLOA</p></div><strong>${money(difference)}</strong></div><p class="heal-note">Valores mensais. O HEAL é apresentado separadamente dos cenários das seis policlínicas.</p>`;
  initializeSimulation();
}

function fitPresentation() {
  const presenting = document.body.classList.contains('presentation-mode');
  if (!presenting) {
    slides.forEach(item => { item.style.transform = ''; item.style.top = ''; item.style.width = ''; item.style.left = ''; });
    return;
  }
  const stage = document.querySelector('#presentation');
  const slide = slides[current];
  const minimumWidth = Number(slide.dataset.minWidth) || (stage.clientWidth < 620 ? 800 : 0);
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
  const meetingName = current === 0 ? 'Reunião SUPECC' : 'Reunião com a SUBPAS';
  document.querySelector('#meeting-name').textContent = meetingName;
  document.querySelector('#meeting-partner').textContent = current === 0 ? 'SES-GO / SUPECC' : 'SES-GO / SUBPAS';
  document.title = `${slides[current].querySelector('h1').textContent.replace(/\s+/g, ' ').trim()} • ${meetingName}`;
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
  if (event.target.closest('.budget-table-scroll, .simulation-controls')) return;
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
initializeBudgetViews();
setPresentation(matchMedia('(min-width: 901px)').matches);
syncHash();
