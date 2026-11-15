'use strict';
(() => {
 const $ = id => document.getElementById(id);
 const groups = [
  { id:'dispatch', label:'Despacho em elaboração', color:'#37745c' },
  { id:'report', label:'Relatório em elaboração', color:'#9a8cb5' },
  { id:'waiting', label:'Aguardando SPAIS', color:'#d1b477' },
  { id:'suspended', label:'Glosa suspensa', color:'#b99d6c' }
 ];
 const currency = cents => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
 const date = iso => iso.split('-').reverse().join('/');
 const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
 const badge = row => `<span class="status-badge ${row.group}">${row.status}</span>`;
 const seiUrl = row => row.seiUrl || 'https://sei.go.gov.br/sei/';
 const range = row => `${date(row.start)} a ${date(row.end)}`;
 let records = [], current = [], active = null, year = 'all', toastTimer;
 const params = new URLSearchParams(location.search);
 if(['2024','2025','2026'].includes(params.get('ano'))) year = params.get('ano');
 if(groups.some(g=>g.id===params.get('situacao'))) $('statusFilter').value=params.get('situacao');
 $('searchInput').value=params.get('busca')||'';

 function updateUrl(){
  const q = new URLSearchParams();
  if(year!=='all') q.set('ano',year);
  if($('statusFilter').value!=='all')q.set('situacao',$('statusFilter').value);
  if($('searchInput').value.trim())q.set('busca',$('searchInput').value.trim());
  history.replaceState(null,'',location.pathname+(q.size?'?'+q:'')+location.hash);
 }
 function render(){
  const search=normalize($('searchInput').value.trim()), status=$('statusFilter').value;
  current=records.filter(r=>(year==='all'||r.year===Number(year))&&(status==='all'||r.group===status)&&(!search||normalize(`${r.id} ${r.description} ${r.label} ${r.year} ${range(r)}`).includes(search)));
  const sort=$('sortSelect').value;
  current.sort((a,b)=>{
   if(sort.startsWith('value')){
    if(a.cents===null&&b.cents===null)return a.start.localeCompare(b.start);
    if(a.cents===null)return 1;if(b.cents===null)return -1;
    return sort==='value-desc'?b.cents-a.cents:a.cents-b.cents;
   }
   return sort==='period-desc'?b.start.localeCompare(a.start):a.start.localeCompare(b.start);
  });
  const withValue=current.filter(r=>r.cents!==null), total=withValue.reduce((s,r)=>s+r.cents,0);
  $('metricTotal').textContent=currency(total);
  $('metricCount').textContent=String(current.length).padStart(2,'0');
  $('metricDraft').textContent=String(current.filter(r=>['dispatch','report'].includes(r.group)).length).padStart(2,'0');
  $('metricMissing').textContent=String(current.length-withValue.length).padStart(2,'0');
  $('metricTotalNote').textContent=`${withValue.length} ${withValue.length===1?'processo com valor informado':'processos com valor informado'}`;
  $('resultBadge').textContent=current.length;
  $('resultText').textContent=`Exibindo ${current.length} de ${records.length} processos`;
  $('scopeText').textContent=(year==='all'&&status==='all'&&!search)?'Visão de todos os processos':`${current.length} ${current.length===1?'processo no':'processos no'} recorte selecionado`;
  $('clearFilters').hidden=year==='all'&&status==='all'&&!search;
  document.querySelectorAll('[data-year]').forEach(b=>{const selected=b.dataset.year===year;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  $('processRows').innerHTML=current.map(r=>`<tr data-id="${r.id}"><td><a class="process-number" data-sei="${r.id}" href="${seiUrl(r)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir SEI interno, processo ${r.id}" title="Abrir o SEI interno em outra aba; o número será copiado">${r.id}${icon('external')}</a><span class="process-caption">Abrir SEI interno</span></td><td><span class="period-label">${r.label} ${r.year}</span><span class="period-range">${range(r)}</span></td><td class="value-cell"><span class="amount ${r.cents===null?'no-amount':''}">${r.cents===null?'Não informado':currency(r.cents)}</span></td><td>${badge(r)}<span class="status-description">${r.description}</span></td><td><button class="row-arrow" data-detail="${r.id}" aria-label="Abrir processo ${r.id}">${icon('chevron')}</button></td></tr>`).join('');
  $('emptyState').hidden=current.length!==0;
  $('barChart').innerHTML=[...current].sort((a,b)=>a.start.localeCompare(b.start)).map(r=>{
   const value=r.cents===null?'N/I':new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(r.cents/100000000);
   const height=r.cents===null?12:(r.cents/1200000000)*149;
   return `<button class="bar-column ${r.cents===null?'missing':''}" data-detail="${r.id}" title="${r.label} ${r.year}: ${r.cents===null?'valor não informado':currency(r.cents)}" aria-label="${r.label} ${r.year}, ${r.cents===null?'valor não informado':currency(r.cents)}, abrir processo ${r.id}"><span class="bar-space"><span class="bar-value">${value}</span><span class="bar" style="height:${height}px"></span></span><span class="bar-label">${r.label}</span><span class="bar-year">${r.year}</span></button>`;
  }).join('');
  if(!current.length)$('barChart').innerHTML='<span class="chart-empty" style="margin:auto;color:#a0ab95;font-size:10px">Nenhum processo neste recorte</span>';
  let angle=0;
  const slices=groups.map(g=>{const count=current.filter(r=>r.group===g.id).length;const start=angle;angle+=current.length?count/current.length*360:0;return `${g.color} ${start}deg ${angle}deg`;});
  $('donut').style.background=current.length?`conic-gradient(${slices.join(',')})`:'#eef1e9';
  $('donutCount').textContent=current.length;
  $('donut').setAttribute('aria-label',groups.map(g=>`${g.label}: ${current.filter(r=>r.group===g.id).length}`).join('; '));
  $('situationLegend').innerHTML=groups.map(g=>`<button class="legend-button" data-group="${g.id}" style="--dot:${g.color}" aria-pressed="${status===g.id}" aria-label="Filtrar ${g.label}"><i></i><span>${g.label}</span><strong>${current.filter(r=>r.group===g.id).length}</strong></button>`).join('');
  const suspended=current.filter(r=>r.group==='suspended');
  $('suspendedNote').innerHTML=`${icon('pause')}<span>Glosa suspensa<strong>${currency(suspended.reduce((s,r)=>s+(r.cents||0),0))}</strong></span><span class="note-quantity">${suspended.length} ${suspended.length===1?'processo':'processos'}</span>`;
  updateUrl();
 }
 function detail(id){
  const row=records.find(r=>r.id===id);if(!row)return;active=row;
  $('detailTitle').textContent=row.id;
  $('detailPeriodLabel').textContent=`${row.label} ${row.year}`;
  $('detailValue').textContent=row.cents===null?'Não informado':currency(row.cents);
  $('detailValueNote').textContent=row.cents===null?'Este processo não compõe o total dos valores informados.':row.group==='suspended'?'Valor incluído na soma dos valores informados. A glosa está suspensa.':'Valor informado para este período de referência.';
  $('detailPeriod').textContent=range(row);
  $('detailStatus').innerHTML=badge(row);
  $('detailDescription').textContent=row.description;
  $('openSei').href=seiUrl(row);$('openSei').dataset.sei=row.id;
  $('detailDialog').showModal();
 }
 function clear(){year='all';$('statusFilter').value='all';$('searchInput').value='';$('sortSelect').value='period-asc';render();}
 function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
 function exportCsv(){
  const header=['Processo','Unidade','Acompanhamento','Início do período','Fim do período','Valor informado (R$)','Situação','Andamento'];
  const csv=[header,...current.map(r=>[r.id,'HUGO','COMACG',date(r.start),date(r.end),r.cents===null?'Não informado':(r.cents/100).toFixed(2).replace('.',','),r.status,r.description])].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}));
  const link=document.createElement('a');link.href=url;link.download=`hugo-comacg-${year==='all'?'todos':year}.csv`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`${current.length} ${current.length===1?'processo exportado':'processos exportados'} em CSV`);
 }
 document.addEventListener('click',event=>{
  const seiLink=event.target.closest('[data-sei]');if(seiLink){navigator.clipboard?.writeText(seiLink.dataset.sei).then(()=>toast('Número copiado para pesquisar no SEI')).catch(()=>toast('Use o número do processo na pesquisa do SEI'));return;}
  const link=event.target.closest('[data-detail]');if(link){detail(link.dataset.detail);return;}
  const row=event.target.closest('tr[data-id]');if(row){detail(row.dataset.id);return;}
  const filter=event.target.closest('[data-group]');if(filter){$('statusFilter').value=$('statusFilter').value===filter.dataset.group?'all':filter.dataset.group;render();}
  const tab=event.target.closest('[data-year]');if(tab){year=tab.dataset.year;render();}
  const nav=event.target.closest('[data-nav]');if(nav){document.querySelectorAll('[data-nav]').forEach(n=>n.classList.toggle('active',n===nav));}
 });
 $('searchInput').addEventListener('input',render);
 $('statusFilter').addEventListener('change',render);
 $('sortSelect').addEventListener('change',render);
 $('clearFilters').addEventListener('click',clear);$('emptyClear').addEventListener('click',clear);
 $('closeDialog').addEventListener('click',()=>$('detailDialog').close());
 $('detailDialog').addEventListener('click',e=>{const rect=$('detailDialog').getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)$('detailDialog').close();});
 $('copyProcess').addEventListener('click',async()=>{if(!active)return;try{await navigator.clipboard.writeText(active.id);toast('Número do processo copiado');}catch{toast('Não foi possível copiar. Selecione o número do processo.');}});
 $('exportButton').addEventListener('click',exportCsv);$('printButton').addEventListener('click',()=>window.print());
 fetch('data.json').then(r=>{if(!r.ok)throw new Error('data');return r.json();}).then(data=>{records=data;render();}).catch(()=>{$('processRows').innerHTML='<tr><td colspan="5">Não foi possível carregar os dados. Atualize a página para tentar novamente.</td></tr>';$('resultText').textContent='Falha ao carregar os processos';toast('Não foi possível carregar a base do painel');});
})();
