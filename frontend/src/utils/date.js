/** Data local (não UTC) no formato aaaa-mm-dd, como o backend espera em /sales/by-date. */
export function todayISO(now = new Date()) {
  const d = now
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
