export function formatTonBalance(value: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0.000';

  const roundedDown = Math.floor(amount * 1000) / 1000;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
    useGrouping: false,
  }).format(roundedDown);
}
