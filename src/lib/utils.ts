export const min = (x: number, y: number) => (x < y ? x : y);

export const calcDecay = (initialValue: number, rate: number, time: number) =>
  time > 0 ? initialValue * (1 - rate) ** time : initialValue;

