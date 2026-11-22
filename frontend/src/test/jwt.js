/** Gera um JWT de teste (assinatura falsa; o frontend só lê o payload). */
export function fakeJwt(payload) {
  const enc = obj => Buffer.from(JSON.stringify(obj), 'utf-8').toString('base64url')
  return `${enc({ alg: 'HS256' })}.${enc(payload)}.assinatura`
}

/** JWT cujo payload, em base64url, contém '-' ou '_' (caso que quebrava o atob puro). */
export function fakeJwtComCaracteresUrl(payload) {
  for (let pad = 0; pad < 200; pad++) {
    const p = { ...payload, x: '~'.repeat(pad) + '?>' }
    const seg = Buffer.from(JSON.stringify(p), 'utf-8').toString('base64url')
    if (/[-_]/.test(seg)) return fakeJwt(p)
  }
  throw new Error('não foi possível gerar payload com - ou _')
}
