import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateScenario, validMonths, schedule, DP_TOTALS, HEMODIALYSIS_TOTAL, UNITS, HEAL, calculateHealCoverage } from '../budget.js';

test('Cenário II mantém a Fase I por 12 meses e preserva os centavos da PLOA', () => {
  const result = calculateScenario([12, 0, 0]);
  assert.equal(result.ploa, 14199999996);
  assert.equal(result.needed, 15224838060);
  assert.equal(result.difference, 1024838064);
  assert.deepEqual(result.rows.map(row => row.difference), [180547284, 99921384, 131824320, 343449864, 186065208, 83030004]);
});

test('Cenário I pondera os custos das três fases por 3, 3 e 6 meses', () => {
  const result = calculateScenario([3, 3, 6]);
  assert.equal(result.needed, 16395940092);
  assert.equal(result.difference, 2195940096);
  assert.deepEqual(result.rows.map(row => row.needed), [2645762724, 2565073284, 2726976216, 3328665312, 2681280648, 2448181908]);
});

test('A simulação de seis meses em cada uma das primeiras fases não cobra a Fase III', () => {
  const result = calculateScenario([6, 6, 0]);
  assert.equal(result.needed, 15624202620);
  assert.equal(result.difference, 1424202624);
});

test('DP é a capacidade prevista em cada fase, sem multiplicação pelos meses', () => {
  assert.deepEqual(DP_TOTALS, [84, 144, 186]);
});

test('O ano deve ter exatamente 12 meses inteiros, sem valores negativos ou vazios', () => {
  for (const months of [[6, 5, 0], [13, 0, -1], [3.5, 2.5, 6], [NaN, 6, 6], [0, 0, 0], [12, 0, 0, 0], [], null]) {
    assert.equal(validMonths(months), false);
    assert.throws(() => calculateScenario(months), RangeError);
  }
  for (const months of [[12, 0, 0], [0, 12, 0], [0, 0, 12], [1, 1, 10]]) assert.equal(validMonths(months), true);
});

test('As datas seguem as fases em ordem e cobrem janeiro a dezembro sem lacunas', () => {
  assert.deepEqual(schedule([3, 3, 6]).map(item => [item.phase, item.start, item.end, item.label]), [
    [0, 0, 2, 'Jan/27 – Mar/27'], [1, 3, 5, 'Abr/27 – Jun/27'], [2, 6, 11, 'Jul/27 – Dez/27']
  ]);
  assert.deepEqual(schedule([0, 3, 9]).map(item => [item.phase, item.start, item.end]), [[1, 0, 2], [2, 3, 11]]);
});

test('HEAL compara o custeio atual com a PLOA na mesma base mensal', () => {
  assert.equal(HEAL.current - HEAL.ploa, 115052543);
});

test('Hemodiálise reproduz as seis quantidades da planilha e o total', () => {
  assert.deepEqual(UNITS.map(unit => unit.hemodialysis), [624, 364, 636, 884, 546, 480]);
  assert.equal(HEMODIALYSIS_TOTAL, 3534);
});

test('HEAL cobre quatro meses sem desconto e aplica a redução de maio a dezembro de 2027', () => {
  const result = calculateHealCoverage();
  assert.equal(result.year, 2027);
  assert.equal(result.monthlyReduction, 115052543);
  assert.equal(result.monthsBeforeReduction, 4);
  assert.equal(result.monthsAfterReduction, 8);
  assert.deepEqual(result.periods.map(period => [period.ploa, period.needed, period.difference]), [
    [3263333332, 3723543504, 460210172], [6526666664, 6526666664, 0]
  ]);
  assert.equal(result.additional, 460210172);
  assert.equal(result.ploa, 9789999996);
  assert.equal(result.needed, 10250210168);
});
