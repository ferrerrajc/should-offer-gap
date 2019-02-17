import { range } from "lodash";
import { cars } from "./data/cars";
import { shouldOfferGap } from "./lib/calc";

cars.forEach(car => {
  console.log(car);
  console.log(
    shouldOfferGap(
      car.carValue,
      car.modelYear,
      car.amountFinanced,
      car.apr,
      car.loanTermMonths
    )
      ? "Should offer GAP insurance"
      : "Should not offer GAP insurance"
  );
  console.log();
});
