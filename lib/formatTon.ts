export function formatTonBalance(value: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0.00';

  const roundedDown = Math.floor(amount * 100) / 100;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(roundedDown);
}
