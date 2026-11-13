export const YEAR = 2027;
export const PHASES = ['Fase I', 'Fase II', 'Fase III'];
export const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Monthly amounts supplied in the worksheet, stored in whole BRL cents.
// DP is the quantity planned at each phase, not a sum over the year.
export const UNITS = [
  { name: 'P. Formosa', current: 240134513, ploa: 190833333, costs: [205878940, 216972400, 229534784], dp: [16, 26, 30] },
  { name: 'P. Goianésia', current: 228086207, ploa: 187500000, costs: [195826782, 206920242, 226138702], dp: [16, 26, 36] },
  { name: 'P. Goiás', current: 267763367, ploa: 198333333, costs: [209318693, 220412153, 239630613], dp: [10, 20, 30] },
  { name: 'P. Posse', current: 306930180, ploa: 234166667, costs: [262787489, 273880949, 286443333], dp: [16, 26, 30] },
  { name: 'P. Quirinópolis', current: 232704125, ploa: 193333333, costs: [208838767, 219932227, 232494611], dp: [16, 26, 30] },
  { name: 'P. SLMB', current: 196684475, ploa: 179166667, costs: [186085834, 197179294, 216397754], dp: [10, 20, 30] }
];

export const HEAL = { ploa: 815833333, current: 930885876 };
export const SCENARIOS = { first: [12, 0, 0], phased: [3, 3, 6], simulation: [6, 6, 0] };
export const DP_TOTALS = PHASES.map((_, phase) => UNITS.reduce((sum, unit) => sum + unit.dp[phase], 0));
export const PHASE_MONTHLY_TOTALS = PHASES.map((_, phase) => UNITS.reduce((sum, unit) => sum + unit.costs[phase], 0));

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const money = cents => currency.format(cents / 100);
export const percentage = fraction => percent.format(fraction);

export function validMonths(months) {
  return Array.isArray(months) && months.length === 3 && months.every(value => Number.isInteger(value) && value >= 0 && value <= 12) && months.reduce((sum, value) => sum + value, 0) === 12;
}

export function calculateScenario(months) {
  if (!validMonths(months)) throw new RangeError('Distribua exatamente 12 meses entre as três fases.');
  const rows = UNITS.map(unit => {
    const ploa = unit.ploa * 12;
    const needed = unit.costs.reduce((sum, cost, phase) => sum + cost * months[phase], 0);
    return { name: unit.name, ploa, needed, difference: needed - ploa };
  });
  const ploa = rows.reduce((sum, row) => sum + row.ploa, 0);
  const needed = rows.reduce((sum, row) => sum + row.needed, 0);
  return { months: [...months], rows, ploa, needed, difference: needed - ploa, increase: (needed - ploa) / ploa };
}

export function schedule(months) {
  if (!validMonths(months)) throw new RangeError('O cronograma deve abranger os 12 meses de 2027.');
  let nextMonth = 0;
  return months.flatMap((duration, phase) => {
    if (duration === 0) return [];
    const start = nextMonth;
    nextMonth += duration;
    return [{ phase, months: duration, start, end: nextMonth - 1, label: `${MONTH_NAMES[start]}/27${duration > 1 ? ` – ${MONTH_NAMES[nextMonth - 1]}/27` : ''}` }];
  });
}
