export function showcasePrice(price: number) {
  return price === 0 ? 0 : Math.ceil((price - 900) / 1000) * 1000 + 900;
}
