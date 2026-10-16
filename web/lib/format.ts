const nf0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fInt = (n: number | null | undefined) => (n == null ? "—" : nf0.format(Math.round(n)));
export const fPct = (n: number | null | undefined, digits: 1 | 2 = 2) =>
  n == null ? "—" : `${(digits === 1 ? nf1 : nf2).format(n)}%`;
export const fPp = (n: number | null | undefined) =>
  n == null ? "—" : `${n > 0 ? "+" : n < 0 ? "−" : ""}${nf2.format(Math.abs(n))} p.p.`;
export const fSigned = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${nf0.format(Math.abs(Math.round(n)))}`;
