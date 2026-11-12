/** The fee in whole taka after a percentage discount, rounded to the nearest taka. */
export function discounted(price: number, percentOff: number) {
	return Math.round((price * (100 - percentOff)) / 100);
}
