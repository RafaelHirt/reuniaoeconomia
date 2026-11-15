'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const colors = {
    'dispatch-analysis': '#37745c',
    'dispatch-appeal': '#80a992',
    waiting: '#d1b477',
    'report-analysis': '#807099',
    'report-preliminary': '#b3a5c7',
    suspended: '#b99d6c'
  };
  const situationOrder = Object.keys(colors);
  const workflowStages = [
    { title: 'Relatório preliminar', owner: 'COMACG', description: 'Elaboração do relatório preliminar de monitoramento.' },
    { title: 'Manifestação da Parceria Privada', owner: 'Parceria Privada', description: 'Manifestação da parceria privada sobre o relatório preliminar.' },
    { title: 'Manifestação SPAIS', owner: 'SPAIS', description: 'Análise e manifestação da SPAIS sobre o relatório.' },
    { title: 'Manifestação SUREG', owner: 'SUREG', description: 'Análise e manifestação da SUREG sobre o relatório.' },
    { title: 'Relatório conclusivo', owner: 'COMACG', description: 'Consolidação das análises da SPAIS e SUREG no relatório conclusivo.' },
    { title: 'Recurso da Parceria Privada', owner: 'Parceria Privada', description: 'Apresentação de recurso pela parceria privada.' },
    { title: 'Manifestação da GMAE/CG', owner: 'GMAE/CG', description: 'Análise do recurso e manifestação da GMAE/CG antes da decisão do Gabinete.' },
    { title: 'Decisão Gabinete', owner: 'Gabinete', description: 'Decisão do Gabinete sobre o processo.' }
  ];
  // The phase is supplied per process: identical status texts can have different phases.
  const workflowPosition = row => Number.isInteger(row.workflowStep) && row.workflowStep >= 1 && row.workflowStep <= workflowStages.length ? row.workflowStep : null;
  const sortNames = { process: 'processo', period: 'período', value: 'valor', situation: 'situação' };
  const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
  const currency = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  const date = iso => iso.split('-').reverse().join('/');
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const badge = row => `<span class="status-badge ${row.group}">${row.status}</span>`;
  const seiUrl = row => row.seiUrl || 'https://sei.go.gov.br/sei/';
  const range = row => `${date(row.start)} a ${date(row.end)}`;
  const params = new URLSearchParams(location.search);
  let records = [], current = [], situations = [], active = null, toastTimer;
  let tooltipTarget = null, tooltipHideTimer;
  let year = ['2024', '2025', '2026'].includes(params.get('ano')) ? params.get('ano') : 'all';
  const requestedPhase = Number(params.get('fase'));
  let selectedPhase = Number.isInteger(requestedPhase) && requestedPhase >= 1 && requestedPhase <= workflowStages.length ? requestedPhase : null;

  $('searchInput').value = params.get('busca') || '';
  if ([...$('sortSelect').options].some(option => option.value === params.get('ordem'))) {
    $('sortSelect').value = params.get('ordem');
  }

  function prepareSituations() {
    // Each complete andamento remains a distinct management category.
    situations = [...new Map(records.map(row => [row.situation, {
      id: row.situation, label: row.description, color: colors[row.situation] || '#6b8472'
    }])).values()].sort((a, b) => situationOrder.indexOf(a.id) - situationOrder.indexOf(b.id));
    $('statusFilter').innerHTML = '<option value="all">Todas as situações</option>' +
      '<optgroup label="Andamentos completos">' + situations.map(situation =>
        `<option value="${situation.id}">${situation.label}</option>`
      ).join('') + '</optgroup>' +
      '<optgroup label="Agrupamentos"><option value="dispatch">Todos os despachos em elaboração</option><option value="report">Todos os relatórios em elaboração</option></optgroup>';
    const requestedStatus = params.get('situacao');
    if ([...$('statusFilter').options].some(option => option.value === requestedStatus)) {
      $('statusFilter').value = requestedStatus;
    }
  }

  function updateUrl() {
    const query = new URLSearchParams();
    if (year !== 'all') query.set('ano', year);
    if ($('statusFilter').value !== 'all') query.set('situacao', $('statusFilter').value);
    if (selectedPhase) query.set('fase', selectedPhase);
    if ($('searchInput').value.trim()) query.set('busca', $('searchInput').value.trim());
    if ($('sortSelect').value !== 'period-asc') query.set('ordem', $('sortSelect').value);
    history.replaceState(null, '', location.pathname + (query.size ? '?' + query : '') + location.hash);
  }

  function sortRows(a, b) {
    const [field, direction] = $('sortSelect').value.split('-');
    const sign = direction === 'desc' ? -1 : 1;
    if (field === 'value') {
      // Values that have not been assessed remain last in both directions.
      if (a.cents === null && b.cents === null) return a.start.localeCompare(b.start);
      if (a.cents === null) return 1;
      if (b.cents === null) return -1;
      return sign * (a.cents - b.cents) || a.start.localeCompare(b.start);
    }
    if (field === 'process') return sign * collator.compare(a.id, b.id);
    if (field === 'situation') return sign * collator.compare(a.description, b.description) || a.start.localeCompare(b.start);
    return sign * a.start.localeCompare(b.start);
  }

  function renderSort() {
    const [field, direction] = $('sortSelect').value.split('-');
    document.querySelectorAll('[data-sort-column]').forEach(header => {
      const selected = header.dataset.sortColumn === field;
      if (selected) header.setAttribute('aria-sort', direction === 'asc' ? 'ascending' : 'descending');
      else header.removeAttribute('aria-sort');
      const button = header.querySelector('button');
      const nextDirection = selected ? (direction === 'asc' ? 'decrescente' : 'crescente') : (header.dataset.sortColumn === 'value' ? 'decrescente' : 'crescente');
      button.setAttribute('aria-label', `Ordenar por ${sortNames[header.dataset.sortColumn]}, ordem ${nextDirection}`);
      button.querySelector('use').setAttribute('href', selected ? '#i-sort-up' : '#i-sort');
      button.querySelector('svg').classList.toggle('sort-desc', selected && direction === 'desc');
    });
    $('sortStatus').textContent = `Ordenação: ${$('sortSelect').selectedOptions[0].textContent}`;
  }

  function hideBarTooltip() {
    clearTimeout(tooltipHideTimer);
    tooltipTarget?.removeAttribute('aria-describedby');
    tooltipTarget?.removeAttribute('aria-controls');
    tooltipTarget?.setAttribute('aria-expanded', 'false');
    tooltipTarget = null;
    $('barTooltip').hidden = true;
    document.querySelectorAll('.legend-button.is-chart-hover').forEach(button => button.classList.remove('is-chart-hover'));
  }

  function positionBarTooltip(hideIfOutside = false) {
    if (!tooltipTarget || $('barTooltip').hidden) return;
    const anchor = tooltipTarget.getBoundingClientRect();
    if (hideIfOutside && (anchor.bottom <= 0 || anchor.top >= window.innerHeight)) {
      hideBarTooltip();
      return;
    }
    const tooltip = $('barTooltip');
    const box = tooltip.getBoundingClientRect();
    const margin = 12;
    const left = Math.max(margin, Math.min(document.documentElement.clientWidth - box.width - margin, anchor.left + anchor.width / 2 - box.width / 2));
    const above = anchor.top - box.height - margin;
    const below = anchor.bottom + margin;
    const top = above >= margin ? above : Math.max(margin, Math.min(window.innerHeight - box.height - margin, below));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function showBarTooltip(column) {
    const row = records.find(item => item.id === column.dataset.detail);
    if (!row) return;
    hideBarTooltip();
    tooltipTarget = column;
    $('barTooltipPeriod').textContent = `${row.label} ${row.year}`;
    $('barTooltipValue').textContent = row.cents === null ? 'Valor não apurado' : currency(row.cents);
    $('barTooltipRange').textContent = range(row);
    $('barTooltipStatus').textContent = row.description;
    const position = workflowPosition(row);
    $('barTooltipPhase').hidden = !position;
    $('barTooltipPhase').textContent = position ? `Fase ${position} de ${workflowStages.length} · ${workflowStages[position - 1].title}` : '';
    $('barTooltipProcess').textContent = row.id;
    $('barTooltipSei').href = seiUrl(row);
    $('barTooltipSei').dataset.sei = row.id;
    $('barTooltipSei').setAttribute('aria-label', `Abrir SEI interno para consultar ${row.id}`);
    const tooltip = $('barTooltip');
    tooltip.style.setProperty('--status-color', colors[row.situation] || '#6b8472');
    tooltip.hidden = false;
    positionBarTooltip();
    column.setAttribute('aria-describedby', 'barTooltipStatus');
    column.setAttribute('aria-controls', 'barTooltip');
    column.setAttribute('aria-expanded', 'true');
    document.querySelectorAll('[data-situation]').forEach(button => {
      button.classList.toggle('is-chart-hover', button.dataset.situation === row.situation);
    });
  }

  function scheduleBarTooltipHide() {
    clearTimeout(tooltipHideTimer);
    tooltipHideTimer = setTimeout(() => {
      if (tooltipTarget && (tooltipTarget.matches(':hover') || tooltipTarget === document.activeElement || $('barTooltip').matches(':hover') || $('barTooltip').contains(document.activeElement))) return;
      hideBarTooltip();
    }, 160);
  }

  function renderChart() {
    hideBarTooltip();
    $('barChart').innerHTML = [...current].sort((a, b) => a.start.localeCompare(b.start)).map(row => {
      const value = row.cents === null ? 'N/A' : new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(row.cents / 100000000);
      const height = row.cents === null ? '12px' : `${row.cents / 1200000000 * 100}%`;
      const label = row.cents === null ? 'valor não apurado' : currency(row.cents);
      return `<button class="bar-column ${row.cents === null ? 'missing' : ''}" data-detail="${row.id}" aria-haspopup="dialog" aria-expanded="false" aria-label="${row.label} ${row.year}, ${label}, abrir processo ${row.id}"><span class="bar-space"><span class="bar-value">${value}</span><span class="bar" style="height:${height}"></span></span><span class="bar-label">${row.label}</span><span class="bar-year">${row.year}</span></button>`;
    }).join('');
    if (!current.length) $('barChart').innerHTML = '<span class="chart-empty">Nenhum processo neste recorte</span>';

    const counts = situations.map(situation => {
      const processes = current.filter(row => row.situation === situation.id);
      return { ...situation, processes, count: processes.length };
    }).filter(situation => situation.count > 0);
    let angle = 0;
    const slices = counts.map(situation => {
      const start = angle;
      angle += situation.count / current.length * 360;
      return `${situation.color} ${start}deg ${angle}deg`;
    });
    $('donut').style.background = current.length ? `conic-gradient(${slices.join(',')})` : '#eef1e9';
    $('donutCount').textContent = current.length;
    $('donutLabel').textContent = current.length === 1 ? 'processo' : 'processos';
    $('donut').setAttribute('aria-label', current.length ? counts.map(situation =>
      `${situation.label}: ${situation.count} ${situation.count === 1 ? 'processo' : 'processos'}`
    ).join('; ') : 'Nenhum processo neste recorte');
    $('situationLegend').innerHTML = counts.length ? counts.map(situation => {
      const percentage = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(situation.count / current.length * 100);
      const process = situation.count === 1 ? situation.processes[0] : null;
      const processLink = process ? `<a class="legend-sei" data-sei="${process.id}" href="${seiUrl(process)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir SEI interno, processo ${process.id}">SEI ${process.id}${icon('external')}</a>` : '';
      return `<div class="legend-item"><button class="legend-button" data-situation="${situation.id}" style="--dot:${situation.color}" aria-pressed="${$('statusFilter').value === situation.id}" aria-label="Filtrar: ${situation.label}, ${situation.count} ${situation.count === 1 ? 'processo' : 'processos'}, ${percentage}%"><i></i><span class="legend-label">${situation.label}</span><span class="legend-stat"><strong>${situation.count}</strong><small>${percentage}%</small></span></button>${processLink}</div>`;
    }).join('') : '<p class="situation-empty">Nenhum processo neste recorte.</p>';
    const suspended = current.filter(row => row.group === 'suspended');
    $('suspendedNote').hidden = suspended.length === 0;
    const suspendedLinks = suspended.map(row => `<a class="note-sei" data-sei="${row.id}" href="${seiUrl(row)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir SEI interno, processo ${row.id}">SEI ${row.id}${icon('external')}</a>`).join('');
    $('suspendedNote').innerHTML = `${icon('pause')}<span>Glosa suspensa<strong>${currency(suspended.reduce((sum, row) => sum + (row.cents || 0), 0))}</strong></span><span class="note-quantity"><span>${suspended.length} ${suspended.length === 1 ? 'processo' : 'processos'}</span>${suspendedLinks}</span>`;
  }

  function renderPipelineOverview(baseRows) {
    const mappedCount = baseRows.filter(row => workflowPosition(row)).length;
    const unknownCount = baseRows.length - mappedCount;
    $('overviewPipelineTotal').textContent = `${mappedCount} ${mappedCount === 1 ? 'processo no fluxo' : 'processos no fluxo'}${unknownCount ? ` · ${unknownCount} sem fase definida` : ''}`;
    $('phaseOverviewSteps').innerHTML = workflowStages.map((stage, index) => {
      const number = index + 1;
      const processes = baseRows.filter(row => workflowPosition(row) === number);
      const suspended = processes.filter(row => row.group === 'suspended').length;
      const selected = number === selectedPhase;
      const countLabel = processes.length === 1 ? 'processo' : 'processos';
      return `<li class="phase-overview-step"><button class="phase-card ${processes.length ? 'has-processes' : 'is-empty'} ${selected ? 'is-active' : ''} ${suspended ? 'has-suspended' : ''}" data-phase="${number}" aria-pressed="${selected}" aria-expanded="${selected}" aria-controls="phaseResults" aria-label="Fase ${number}: ${stage.title}, ${processes.length} ${countLabel}. Ver processos"><span class="phase-card-heading"><span class="phase-card-number">${number}</span><span>FASE ${number}</span></span><span class="phase-card-title">${stage.title}</span><span class="phase-card-quantity"><strong>${processes.length}</strong><span>${countLabel}</span></span>${suspended ? `<span class="phase-card-note">${suspended} ${suspended === 1 ? 'glosa suspensa' : 'glosas suspensas'}</span>` : ''}</button></li>`;
    }).join('');
    $('phaseResults').hidden = !selectedPhase;
    if (!selectedPhase) {
      $('phaseProcessRows').innerHTML = '';
      return;
    }
    $('phaseResultsTitle').textContent = `Fase ${selectedPhase} · ${workflowStages[selectedPhase - 1].title}`;
    $('phaseResultsCount').textContent = `${current.length} ${current.length === 1 ? 'processo nesta fase' : 'processos nesta fase'}`;
    $('phaseEmpty').hidden = current.length !== 0;
    $('phaseProcessRows').innerHTML = current.map(row => `<li class="phase-process" data-process-id="${row.id}"><div class="phase-process-reference"><strong>${row.label} ${row.year}</strong><span>${range(row)}</span><a class="phase-process-sei" data-sei="${row.id}" href="${seiUrl(row)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir SEI interno, processo ${row.id}">SEI ${row.id}${icon('external')}</a></div><div class="phase-process-status">${badge(row)}<p>${row.description}</p></div><div class="phase-process-action"><strong>${row.cents === null ? 'Valor não apurado' : currency(row.cents)}</strong><button class="button secondary" data-detail="${row.id}" aria-label="Ver detalhes e fluxo do processo ${row.id}">Ver detalhes${icon('chevron')}</button></div></li>`).join('');
  }

  function clearPhaseFilter() {
    const previous = selectedPhase;
    selectedPhase = null;
    render();
    const button = $('phaseOverviewSteps').querySelector(`[data-phase="${previous}"]`);
    button?.focus({ preventScroll: true });
    button?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function render() {
    const search = normalize($('searchInput').value.trim());
    const status = $('statusFilter').value;
    const baseRows = records.filter(row => (year === 'all' || row.year === Number(year)) &&
      (status === 'all' || row.situation === status || row.group === status) &&
      (!search || normalize(`${row.id} ${row.description} ${row.label} ${row.year} ${range(row)}`).includes(search))
    );
    current = baseRows.filter(row => !selectedPhase || workflowPosition(row) === selectedPhase).sort(sortRows);
    const total = current.reduce((sum, row) => sum + (row.cents || 0), 0);
    $('metricTotal').textContent = currency(total);
    $('metricTotalNote').textContent = current.some(row => row.group === 'suspended') ?
      'Inclui o valor da glosa suspensa' : 'Considera apenas os valores apurados';
    $('metricCount').textContent = String(current.length).padStart(2, '0');
    $('resultBadge').textContent = current.length;
    $('resultText').textContent = `Exibindo ${current.length} de ${records.length} processos`;
    $('scopeText').textContent = (year === 'all' && status === 'all' && !search && !selectedPhase) ? 'Visão de todos os processos' :
      'Filtros aplicados';
    const hasFilters = year !== 'all' || status !== 'all' || Boolean(search) || Boolean(selectedPhase);
    $('backToOverview').hidden = !hasFilters;
    $('headerBack').hidden = !hasFilters;
    $('clearFilters').hidden = !hasFilters && $('sortSelect').value === 'period-asc';
    $('statusFilter').title = $('statusFilter').selectedOptions[0].textContent;
    document.querySelectorAll('[data-year]').forEach(button => {
      const selected = button.dataset.year === year;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $('processRows').innerHTML = current.map(row => `<tr data-id="${row.id}"><td><a class="process-number" data-sei="${row.id}" href="${seiUrl(row)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir SEI interno, processo ${row.id}" title="Abrir o SEI interno em outra aba; o número será copiado">${row.id}${icon('external')}</a><span class="process-caption">Abrir SEI interno</span></td><td><span class="period-label">${row.label} ${row.year}</span><span class="period-range">${range(row)}</span></td><td class="value-cell"><span class="amount ${row.cents === null ? 'no-amount' : ''}">${row.cents === null ? 'Valor não apurado' : currency(row.cents)}</span></td><td>${badge(row)}<span class="status-description">${row.description}</span></td><td><button class="row-arrow" data-detail="${row.id}" aria-label="Ver detalhes e fluxo do processo ${row.id}" title="Ver detalhes e fluxo">${icon('chevron')}</button></td></tr>`).join('');
    $('emptyState').hidden = current.length !== 0;
    renderChart();
    renderSort();
    renderPipelineOverview(baseRows);
    updateUrl();
  }

  function placeWorkflowInfo(number) {
    const button = $('workflowSteps').querySelector(`[data-workflow-step="${number}"]`);
    if (!button) return;
    const host = window.matchMedia('(max-width: 820px)').matches ? button.closest('li') : $('workflowInfoHost');
    host.append($('workflowStepInfo'));
  }

  function showWorkflowStep(row, number) {
    const stage = workflowStages[number - 1];
    if (!stage) return;
    const position = workflowPosition(row);
    let relation = 'Etapa de referência do fluxo';
    if (position) relation = number === position ? 'Etapa atual deste processo' : number < position ? 'Etapa anterior no fluxo' : 'Etapa seguinte no fluxo';
    $('workflowInfoKicker').textContent = `Etapa ${number} · ${relation}`;
    $('workflowInfoTitle').textContent = stage.title;
    $('workflowInfoDescription').textContent = `${stage.description} Responsável: ${stage.owner}.`;
    $('workflowStepInfo').hidden = false;
    document.querySelectorAll('[data-workflow-step]').forEach(button => {
      const selected = Number(button.dataset.workflowStep) === number;
      button.setAttribute('aria-expanded', String(selected));
      button.closest('li').classList.toggle('is-selected', selected);
    });
    placeWorkflowInfo(number);
  }

  function renderWorkflow(row) {
    $('workflowInfoHost').append($('workflowStepInfo'));
    const position = workflowPosition(row);
    const suspended = row.group === 'suspended';
    $('detailPhaseNumber').textContent = position || '—';
    $('dialogPhaseBadge').textContent = position ? `Fase ${position} de ${workflowStages.length}` : 'Fase não indicada';
    $('dialogPhaseBadge').classList.toggle('is-suspended', suspended);
    $('pipelinePosition').textContent = position ? `Etapa ${position} de ${workflowStages.length}` : 'Etapa não indicada';
    $('pipelinePosition').classList.toggle('is-unknown', !position);
    $('pipelinePosition').classList.toggle('is-suspended', suspended);
    $('pipelinePosition').closest('.process-pipeline').classList.toggle('is-suspended', suspended);
    $('pipelineContext').classList.toggle('is-unknown', !position);
    $('pipelineContext').classList.toggle('is-suspended', suspended);
    $('pipelineContext').classList.toggle('is-final', position === workflowStages.length);
    $('pipelineCurrentLabel').textContent = position ? `VOCÊ ESTÁ AQUI · FASE ${position} DE ${workflowStages.length}` : 'FASE NÃO INDICADA';
    $('pipelineCurrentTitle').textContent = position ? workflowStages[position - 1].title : row.status;
    $('pipelineCurrentNote').textContent = !position ?
      (suspended ? 'A glosa está suspensa. O andamento informado não identifica uma etapa deste fluxo.' : 'O andamento informado ainda não tem uma etapa definida neste fluxo.') :
      suspended ? 'Glosa suspensa' : row.situation === 'waiting' ? 'Aguardando despacho SPAIS' : row.situation === 'dispatch-appeal' ? 'Análise de recurso hierárquico' : 'Em elaboração';
    $('pipelineNextGroup').hidden = !position || position === workflowStages.length;
    $('pipelineNextTitle').textContent = position && position < workflowStages.length ? workflowStages[position].title : 'Fim da sequência de referência';
    $('workflowSteps').innerHTML = workflowStages.map((stage, index) => {
      const number = index + 1;
      const state = !position ? 'is-unknown' : number < position ? 'is-past' : number === position ? 'is-current' : 'is-future';
      const label = !position ? 'Etapa do fluxo' : number < position ? 'Anterior' : number === position ? 'Você está aqui' : number === position + 1 ? 'Próxima etapa' : 'Seguinte';
      return `<li class="workflow-step ${state}"><button type="button" class="workflow-step-button" data-workflow-step="${number}" aria-controls="workflowStepInfo" aria-expanded="false"${number === position ? ' aria-current="step"' : ''} aria-label="Etapa ${number}: ${stage.title}. ${label}. Consultar explicação"><span class="workflow-number">${number}</span><span class="workflow-step-label"><span>${stage.title}</span><small>${label}</small></span></button></li>`;
    }).join('');
    $('workflowStepInfo').hidden = true;
    if (position) showWorkflowStep(row, position);
  }

  function detail(id) {
    hideBarTooltip();
    const row = records.find(item => item.id === id);
    if (!row) return;
    active = row;
    $('detailTitle').textContent = row.id;
    $('detailPeriodLabel').textContent = `${row.label} ${row.year}`;
    $('detailValue').textContent = row.cents === null ? 'Valor não apurado' : currency(row.cents);
    $('detailValueNote').textContent = row.cents === null ?
      'O valor deste processo ainda não foi apurado e não compõe o total.' :
      row.group === 'suspended' ? 'Valor incluído na soma dos valores apurados. A glosa está suspensa.' :
      'Valor apurado para este período de referência.';
    $('detailPeriod').textContent = range(row);
    $('detailStatus').innerHTML = badge(row);
    $('detailDescription').textContent = row.description;
    $('openSei').href = seiUrl(row);
    $('openSei').dataset.sei = row.id;
    renderWorkflow(row);
    $('detailDialog').showModal();
    $('detailDialog').scrollTop = 0;
    $('detailDialog').querySelector('.detail-dialog-body').scrollTop = 0;
  }

  function returnToOverview() {
    selectedPhase = null;
    year = 'all';
    $('statusFilter').value = 'all';
    $('searchInput').value = '';
    render();
  }

  function clear() {
    $('sortSelect').value = 'period-asc';
    returnToOverview();
  }

  function toast(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimer = setTimeout(() => $('toast').hidden = true, 3500);
  }

  function exportCsv() {
    const header = ['Processo', 'Unidade', 'Acompanhamento', 'Início do período', 'Fim do período', 'Valor apurado (R$)', 'Situação', 'Andamento'];
    const csv = [header, ...current.map(row => [row.id, 'HUGO', 'COMACG', date(row.start), date(row.end),
      row.cents === null ? 'Valor não apurado' : (row.cents / 100).toFixed(2).replace('.', ','), row.status, row.description
    ])].map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `hugo-comacg-${year === 'all' ? 'todos' : year}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`${current.length} ${current.length === 1 ? 'processo exportado' : 'processos exportados'} em CSV`);
  }

  document.addEventListener('click', event => {
    const phase = event.target.closest('[data-phase]');
    if (phase) {
      const number = Number(phase.dataset.phase);
      if (selectedPhase === number) clearPhaseFilter();
      else {
        selectedPhase = number;
        render();
        $('phaseResultsTitle').focus({ preventScroll: true });
        $('phaseResults').scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
      return;
    }
    if (event.target.closest('[data-clear-phase]')) {
      clearPhaseFilter();
      return;
    }
    const workflowStep = event.target.closest('[data-workflow-step]');
    if (workflowStep && active) {
      showWorkflowStep(active, Number(workflowStep.dataset.workflowStep));
      $('workflowStepInfo').scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      return;
    }
    const seiLink = event.target.closest('[data-sei]');
    if (seiLink) {
      navigator.clipboard?.writeText(seiLink.dataset.sei).then(() => toast('Número copiado para pesquisar no SEI'))
        .catch(() => toast('Use o número do processo na pesquisa do SEI'));
      return;
    }
    const sortButton = event.target.closest('[data-sort]');
    if (sortButton) {
      const field = sortButton.dataset.sort;
      const [currentField, direction] = $('sortSelect').value.split('-');
      $('sortSelect').value = `${field}-${currentField === field ? (direction === 'asc' ? 'desc' : 'asc') : (field === 'value' ? 'desc' : 'asc')}`;
      render();
      return;
    }
    const link = event.target.closest('[data-detail]');
    if (link) { detail(link.dataset.detail); return; }
    const row = event.target.closest('tr[data-id]');
    if (row) { detail(row.dataset.id); return; }
    const filter = event.target.closest('[data-situation]');
    if (filter) {
      $('statusFilter').value = $('statusFilter').value === filter.dataset.situation ? 'all' : filter.dataset.situation;
      render();
    }
    const tab = event.target.closest('[data-year]');
    if (tab) { year = tab.dataset.year; render(); }
    const nav = event.target.closest('[data-nav]');
    if (nav) document.querySelectorAll('[data-nav]').forEach(item => item.classList.toggle('active', item === nav));
  });
  $('searchInput').addEventListener('input', render);
  $('barChart').addEventListener('pointerover', event => {
    if (event.pointerType === 'touch') return;
    const column = event.target.closest('.bar-column');
    if (column && !column.contains(event.relatedTarget)) showBarTooltip(column);
  });
  $('barChart').addEventListener('pointerout', event => {
    const column = event.target.closest('.bar-column');
    if (column && !column.contains(event.relatedTarget)) scheduleBarTooltipHide();
  });
  $('barChart').addEventListener('focusin', event => {
    const column = event.target.closest('.bar-column');
    if (column) showBarTooltip(column);
  });
  $('barChart').addEventListener('focusout', scheduleBarTooltipHide);
  $('barTooltip').addEventListener('pointerenter', () => clearTimeout(tooltipHideTimer));
  $('barTooltip').addEventListener('pointerleave', scheduleBarTooltipHide);
  $('barTooltip').addEventListener('focusin', () => clearTimeout(tooltipHideTimer));
  $('barTooltip').addEventListener('focusout', scheduleBarTooltipHide);
  document.addEventListener('keydown', event => {
    if (!tooltipTarget || $('barTooltip').hidden) return;
    const column = tooltipTarget;
    const insidePopover = $('barTooltip').contains(event.target);
    if (event.key === 'Escape') {
      if (insidePopover) column.focus({ preventScroll: true });
      hideBarTooltip();
    } else if (event.key === 'Tab' && event.target === column && !event.shiftKey) {
      event.preventDefault();
      $('barTooltipSei').focus();
    } else if (event.key === 'Tab' && insidePopover) {
      event.preventDefault();
      if (event.shiftKey) column.focus({ preventScroll: true });
      else {
        const columns = [...$('barChart').querySelectorAll('.bar-column')];
        const next = columns[columns.indexOf(column) + 1] || $('situationLegend').querySelector('button');
        hideBarTooltip();
        next?.focus();
      }
    }
  });
  window.addEventListener('scroll', event => {
    if (!$('barTooltip').contains(event.target)) positionBarTooltip(true);
  }, { capture: true, passive: true });
  window.addEventListener('resize', () => positionBarTooltip(true), { passive: true });
  window.addEventListener('resize', () => {
    if (!$('detailDialog').open) return;
    const selected = $('workflowSteps').querySelector('[aria-expanded="true"]');
    if (selected) placeWorkflowInfo(Number(selected.dataset.workflowStep));
  }, { passive: true });
  $('statusFilter').addEventListener('change', render);
  $('sortSelect').addEventListener('change', render);
  $('clearFilters').addEventListener('click', clear);
  $('emptyClear').addEventListener('click', clear);
  $('backToOverview').addEventListener('click', returnToOverview);
  $('headerBack').addEventListener('click', returnToOverview);
  $('backFromDetail').addEventListener('click', () => $('detailDialog').close());
  $('closeDialog').addEventListener('click', () => $('detailDialog').close());
  $('detailDialog').addEventListener('click', event => {
    const rect = $('detailDialog').getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $('detailDialog').close();
  });
  $('copyProcess').addEventListener('click', async () => {
    if (!active) return;
    try { await navigator.clipboard.writeText(active.id); toast('Número do processo copiado'); }
    catch { toast('Não foi possível copiar. Selecione o número do processo.'); }
  });
  $('exportButton').addEventListener('click', exportCsv);
  $('printButton').addEventListener('click', () => window.print());
  fetch('data.json').then(response => {
    if (!response.ok) throw new Error('data');
    return response.json();
  }).then(data => { records = data; prepareSituations(); render(); }).catch(() => {
    $('processRows').innerHTML = '<tr><td colspan="5">Não foi possível carregar os dados. Atualize a página para tentar novamente.</td></tr>';
    $('resultText').textContent = 'Falha ao carregar os processos';
    toast('Não foi possível carregar a base do painel');
  });
})();
