/**
 * Current value of the vehicle
 * Vehicle model year
 * Amount financed
 * APR
 * Loan term in months
 * 
 * using numbers to keep things simple
 */
export interface CarLoan {
  label: string;
  carValue: number;
  modelYear: number;
  amountFinanced: number;
  apr: number;
  loanTermMonths: number;
}

const defaultNewCarLoan: CarLoan = {
  label: 'default',
  carValue: 30000,
  modelYear: 2019,
  amountFinanced: 27000,
  apr: 0.05,
  loanTermMonths: 48
}

type ModifyCarFn = (car: CarLoan) => Partial<CarLoan>
const modifyCar = (label: string, func: ModifyCarFn) => (car: CarLoan) => ({
  ...car,
  label: `${car.label} + ${label}`,
  ...func(car)
})

const noDownPayment = modifyCar('no down payment', car => ({ amountFinanced: car.carValue }));
const longTermLoan = modifyCar('long term loan', _ => ({ loanTermMonths: 72 }));
const highInterestLoan = modifyCar('high interest loan', _ => ({ apr: 0.10 }));

export const cars: CarLoan[] = [
  defaultNewCarLoan,
  longTermLoan(defaultNewCarLoan),
  noDownPayment(defaultNewCarLoan),
  highInterestLoan(defaultNewCarLoan),
  longTermLoan(noDownPayment(defaultNewCarLoan))
]