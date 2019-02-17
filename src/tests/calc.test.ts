import { range } from 'lodash';
import { calcBalance, nextBalanceN } from '../lib/calc';

const isZeroWithinError = (e: number) => (x: number) => Math.abs(x) < e;
const isZero = isZeroWithinError(10**(-5));

test('calcBalance matches recursive definition', () => {
  range(12)
    .map(val => calcBalance(100, 0.01, 10, val) - nextBalanceN(100, 0.01, 10, val))
    .forEach(val => expect(isZero(val)).toBe(true))
})