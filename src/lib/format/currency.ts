export function formatAed(amount: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);
}

export function formatAedCompact(amount: number) {
  return formatAed(amount, { notation: "compact", maximumFractionDigits: 1 });
}
