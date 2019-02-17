import { maxBy, range } from "lodash";
import { calcDecay, min, max } from "./utils";

const FIRST_YEAR_DEPR_RATE = 0.25 / 12;
const OTHER_DEPR_RATE = 0.125 / 12;

const SHORTEST_TIME_SHOULD_OFFER = 12;
const MINIMUM_AMOUNT_SHOULD_OFFER = 1000;

/**
 * b(n) = b(n-1) * (1+r) - payment
 * this is the easy balance calculation I used to double check my closed formula
 */
const nextBalance = (balance: number, rate: number, payment: number) =>
  balance * (1 + rate) - payment;

const nextBalanceN = (
  balance: number,
  rate: number,
  payment: number,
  months: number
): number => {
  if (months > 0) {
    return nextBalanceN(
      nextBalance(balance, rate, payment),
      rate,
      payment,
      months - 1
    );
  }
  return balance;
};

/**
 * b(n) = b(0) * (1 + r) ** n - payment * ((1 + r) ** n - 1) / r
 * closed form of the recursive formula in `nextBalance`
 */
const calcBalance = (
  principal: number,
  monthlyRate: number,
  payment: number,
  months: number
) => {
  const multiplier = (1 + monthlyRate) ** months;
  return principal * multiplier - (payment * (multiplier - 1)) / monthlyRate;
};

/**
 * payment = b(0) * r * (1 + r) ** n / ((1 + r) ** n - 1)
 * the monthly payment required  to pay the loan off after n months.
 * comes directly from the formula in `calcBalance`
 */
export const calcPayment = (
  princpal: number,
  monthlyRate: number,
  months: number
) => {
  const multiplier = (1 + monthlyRate) ** months;
  return (princpal * monthlyRate * multiplier) / (multiplier - 1);
};

/**
 * decay the vehicle value over time
 * Simplifying Assumption:
 * - the vehicle always loses its value at an exponential rate,
 *   with a smaller decay rate after the first year
 */
const calcVehicleValue = (
  initialValue: number,
  months: number,
  isNew: boolean
) => {
  if (isNew) {
    const valueAfterYear = calcDecay(
      initialValue,
      FIRST_YEAR_DEPR_RATE,
      min(months, 12)
    );
    return calcDecay(valueAfterYear, OTHER_DEPR_RATE, months - 12);
  }
  return calcDecay(initialValue, OTHER_DEPR_RATE, months);
};

export const calcGap = (
  initialCarValue: number,
  initialLoanPrincipal: number,
  loanMonthlyRate: number,
  monthlyPayment: number,
  isNewVehicle: boolean,
  months: number
) => {
  return (
    calcBalance(initialLoanPrincipal, loanMonthlyRate, monthlyPayment, months) -
    calcVehicleValue(initialCarValue, months, isNewVehicle)
  );
};

interface GapStats {
  maxGap: number;
  months: number;
}
/**
 * returns `{ maxGap: number, months: number }`
 * `maxGap` is the largest difference between the amount owed and the vehicle's value
 * `months` is the number of months that the amount owed is greater than the vehicle's value
 */
const findGapStats = (
  carValue: number,
  modelYear: number,
  amountFinanced: number,
  apr: number,
  loanTermMonths: number
): GapStats => {
  const monthlyPayment = calcPayment(amountFinanced, apr / 12, loanTermMonths);
  const gapValues = range(loanTermMonths)
    .map(month => ({
      gap: calcGap(
        carValue,
        amountFinanced,
        apr / 12,
        monthlyPayment,
        modelYear == 2019,
        month
      ),
      month
    }))
    .filter(value => value.gap > 0);
  return gapValues.reduce(
    (acc: GapStats, value) => ({
      maxGap: max(acc.maxGap, value.gap),
      months: max(acc.months, value.month)
    }),
    { maxGap: 0, months: 0 }
  );
};

export const shouldOfferGap = (
  carValue: number,
  modelYear: number,
  amountFinanced: number,
  apr: number,
  loanTermMonths: number
) => {
  const gapStats = findGapStats(
    carValue,
    modelYear,
    amountFinanced,
    apr,
    loanTermMonths
  );
  return (
    gapStats.months > SHORTEST_TIME_SHOULD_OFFER &&
    gapStats.maxGap > MINIMUM_AMOUNT_SHOULD_OFFER
  );
};
