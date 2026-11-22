/**
 * Variação percentual de hoje em relação a ontem para os cartões do Dashboard (RF11).
 * Retorna null quando não há base de comparação (ontem sem movimento), para a tela
 * não mostrar um percentual inventado.
 */
export function variation(today, yesterday) {
  const t = Number(today) || 0
  const y = Number(yesterday) || 0
  if (y <= 0) return null
  const pct = Math.round(((t - y) / y) * 100)
  return { label: `${pct > 0 ? '+' : ''}${pct}%`, up: pct >= 0 }
}
