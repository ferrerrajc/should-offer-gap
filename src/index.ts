import { range } from "lodash";
import { cars } from './data/cars'
import { calcGap, calcPayment } from "./lib/calc";

cars.forEach(car => {
  console.log(car.label)
  const computedPayment = calcPayment(car.amountFinanced, car.apr / 12, car.loanTermMonths);
  range(car.loanTermMonths).map(month => ({
    balance: calcGap(car.carValue, car.amountFinanced, car.apr / 12, computedPayment, car.modelYear == 2019, month),
    month
  }))
  .filter(x => x.balance > 0)
  .forEach(month => {
    console.log(`After ${month.month} months, the gap is ${month.balance}`);
  });
})