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
    $('barTooltipProcess').textContent = row.id;
    const tooltip = $('barTooltip');
    tooltip.style.setProperty('--status-color', colors[row.situation] || '#6b8472');
    tooltip.hidden = false;
    positionBarTooltip();
    column.setAttribute('aria-describedby', 'barTooltip');
    document.querySelectorAll('[data-situation]').forEach(button => {
      button.classList.toggle('is-chart-hover', button.dataset.situation === row.situation);
    });
  }

  function scheduleBarTooltipHide() {
    clearTimeout(tooltipHideTimer);
    tooltipHideTimer = setTimeout(() => {
      if (tooltipTarget && (tooltipTarget.matches(':hover') || tooltipTarget === document.activeElement || $('barTooltip').matches(':hover'))) return;
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
      return `<button class="bar-column ${row.cents === null ? 'missing' : ''}" data-detail="${row.id}" aria-label="${row.label} ${row.year}, ${label}, abrir processo ${row.id}"><span class="bar-space"><span class="bar-value">${value}</span><span class="bar" style="height:${height}"></span></span><span class="bar-label">${row.label}</span><span class="bar-year">${row.year}</span></button>`;
    }).join('');
    if (!current.length) $('barChart').innerHTML = '<span class="chart-empty">Nenhum processo neste recorte</span>';

    const counts = situations.map(situation => ({
      ...situation, count: current.filter(row => row.situation === situation.id).length
    })).filter(situation => situation.count > 0);
    let angle = 0;
    const slices = counts.map(situation => {
      const start = angle;
      angle += situation.count / current.length * 360;
      return `${situation.color} ${start}deg ${angle}deg`;
    });
    $('donut').style.background = current.length ? `conic-gradient(${slices.join(',')})` : '#eef1e9';
    $('donutCount').textContent = current.length;
    $('donut').setAttribute('aria-label', current.length ? counts.map(situation =>
      `${situation.label}: ${situation.count} ${situation.count === 1 ? 'processo' : 'processos'}`
    ).join('; ') : 'Nenhum processo neste recorte');
    $('situationLegend').innerHTML = counts.length ? counts.map(situation => {
      const percentage = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(situation.count / current.length * 100);
      return `<button class="legend-button" data-situation="${situation.id}" style="--dot:${situation.color}" aria-pressed="${$('statusFilter').value === situation.id}" aria-label="Filtrar: ${situation.label}, ${situation.count} ${situation.count === 1 ? 'processo' : 'processos'}, ${percentage}%"><i></i><span class="legend-label">${situation.label}</span><span class="legend-stat"><strong>${situation.count}</strong><small>${percentage}%</small></span></button>`;
    }).join('') : '<p class="situation-empty">Nenhum processo neste recorte.</p>';
    const suspended = current.filter(row => row.group === 'suspended');
    $('suspendedNote').hidden = suspended.length === 0;
    $('suspendedNote').innerHTML = `${icon('pause')}<span>Glosa suspensa<strong>${currency(suspended.reduce((sum, row) => sum + (row.cents || 0), 0))}</strong></span><span class="note-quantity">${suspended.length} ${suspended.length === 1 ? 'processo' : 'processos'}</span>`;
  }

  function render() {
    const search = normalize($('searchInput').value.trim());
    const status = $('statusFilter').value;
    current = records.filter(row => (year === 'all' || row.year === Number(year)) &&
      (status === 'all' || row.situation === status || row.group === status) &&
      (!search || normalize(`${row.id} ${row.description} ${row.label} ${row.year} ${range(row)}`).includes(search))
    ).sort(sortRows);
    const total = current.reduce((sum, row) => sum + (row.cents || 0), 0);
    $('metricTotal').textContent = currency(total);
    $('metricTotalNote').textContent = current.some(row => row.group === 'suspended') ?
      'Inclui o valor da glosa suspensa' : 'Considera apenas os valores apurados';
    $('metricCount').textContent = String(current.length).padStart(2, '0');
    $('resultBadge').textContent = current.length;
    $('resultText').textContent = `Exibindo ${current.length} de ${records.length} processos`;
    $('scopeText').textContent = (year === 'all' && status === 'all' && !search) ? 'Visão de todos os processos' :
      'Filtros aplicados';
    $('clearFilters').hidden = year === 'all' && status === 'all' && !search && $('sortSelect').value === 'period-asc';
    $('statusFilter').title = $('statusFilter').selectedOptions[0].textContent;
    document.querySelectorAll('[data-year]').forEach(button => {
      const selected = button.dataset.year === year;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $('processRows').innerHTML = current.map(row => `<tr data-id="${row.id}"><td><a class="process-number" data-sei="${row.id}" href="${seiUrl(row)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir SEI interno, processo ${row.id}" title="Abrir o SEI interno em outra aba; o número será copiado">${row.id}${icon('external')}</a><span class="process-caption">Abrir SEI interno</span></td><td><span class="period-label">${row.label} ${row.year}</span><span class="period-range">${range(row)}</span></td><td class="value-cell"><span class="amount ${row.cents === null ? 'no-amount' : ''}">${row.cents === null ? 'Valor não apurado' : currency(row.cents)}</span></td><td>${badge(row)}<span class="status-description">${row.description}</span></td><td><button class="row-arrow" data-detail="${row.id}" aria-label="Abrir processo ${row.id}">${icon('chevron')}</button></td></tr>`).join('');
    $('emptyState').hidden = current.length !== 0;
    renderChart();
    renderSort();
    updateUrl();
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
    $('detailDialog').showModal();
  }

  function clear() {
    year = 'all';
    $('statusFilter').value = 'all';
    $('searchInput').value = '';
    $('sortSelect').value = 'period-asc';
    render();
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
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') hideBarTooltip();
  });
  window.addEventListener('scroll', event => {
    if (!$('barTooltip').contains(event.target)) positionBarTooltip(true);
  }, { capture: true, passive: true });
  window.addEventListener('resize', () => positionBarTooltip(true), { passive: true });
  $('statusFilter').addEventListener('change', render);
  $('sortSelect').addEventListener('change', render);
  $('clearFilters').addEventListener('click', clear);
  $('emptyClear').addEventListener('click', clear);
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
