import { maxBy, range } from "lodash";
import { calcDecay, min, max } from "./utils";

/**
 * Major assumptions made for simplification:
 * - the vehicle always loses its value at an exponential rate,
 *   with a smaller decay rate after the first year
 * - monthly interest rate can be estimated by apr / 12
 */
const FIRST_YEAR_DEPR_RATE = 0.25 / 12;
const OTHER_DEPR_RATE = 0.125 / 12;
const MINIMUM_AMOUNT_SHOULD_OFFER = 1000;

/**
 * b(n) = b(n-1) * (1+r) - payment
 * this is the easy balance calculation I used to double check my closed formula
 */
export const nextBalance = (balance: number, rate: number, payment: number) =>
  balance * (1 + rate) - payment;

export const nextBalanceN = (
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
export const calcBalance = (
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
 */
export const calcVehicleValue = (
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

/**
 * An oversimplified way to determine the monthly interest rate from APR.
 */
export const aprToMonthlyRate = (apr: number) => apr / 12;

/**
 * loan balance - vehicle value
 */
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

/**
 * returns `maxGap`, the largest difference between the amount owed and the vehicle's value
 */
export const findMaxGap = (
  carValue: number,
  modelYear: number,
  amountFinanced: number,
  apr: number,
  loanTermMonths: number
): number => {
  const monthlyPayment = calcPayment(
    amountFinanced,
    aprToMonthlyRate(apr),
    loanTermMonths
  );
  const gapValues = range(loanTermMonths)
    .map(month =>
      calcGap(
        carValue,
        amountFinanced,
        aprToMonthlyRate(apr),
        monthlyPayment,
        modelYear == 2019,
        month
      )
    )
    .filter(value => value > 0);
  return gapValues.reduce((maxGap: number, value) => max(maxGap, value), 0);
};

/**
 * returns boolean indicating whether or not GAP insurance should be offered
 * for the vehicle loan in question
 *
 * if false is returned, it means that the loan is not upside down by a significant amount
 */
export const shouldOfferGap = (
  carValue: number,
  modelYear: number,
  amountFinanced: number,
  apr: number,
  loanTermMonths: number
) => {
  const maxGap = findMaxGap(
    carValue,
    modelYear,
    amountFinanced,
    apr,
    loanTermMonths
  );
  return maxGap > MINIMUM_AMOUNT_SHOULD_OFFER;
};
