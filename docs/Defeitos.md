# Registro de Defeitos — Fase 3

Defeitos encontrados e corrigidos na Fase 3. Os IDs de risco (R01–R10) seguem o Documento de Arquitetura (`docs/fase2/01-Documento_de_Arquitetura_de_Software.pdf`). Este registro alimenta o `TestCasePlan.md`.

| ID | Risco | Requisito | Severidade | Status |
|---|---|---|---|---|
| DEF-01 | R01 | RF07, RF08, RN01 | Alta | Corrigido |

## DEF-01 — Operador não consegue ajustar estoque da própria loja

- **Sintoma:** o operador recebe HTTP 403 ao salvar ajuste de estoque de produto ou de insumo na tela Estoque.
- **Reprodução:** login como `operador.centro` → Estoque → ajustar quantidade → salvar. Equivale a `PUT /api/stores/1/inventory/{productId}` ou `PUT /api/stores/1/ingredient-stock/{ingredientId}` com token de operador.
- **Esperado:** 200 para a loja do operador (RF07, RF08); acesso negado para outra loja (RN01).
- **Causa:** em `SecurityConfig`, `requestMatchers(PUT, "/stores/**").hasRole("ADMIN")` — o padrão `/**` casa também as sub-rotas de estoque da loja, restringindo-as ao administrador.
- **Correção:** padrão trocado para `/stores/*` (PUT e DELETE), que casa só `/stores/{id}`. Editar e desativar lojas continua exclusivo do ADMIN (RN02); o isolamento por loja nas sub-rotas segue a cargo do `StoreAccessGuard`.
- **Commit:** `fix(security): operador ajusta estoque da própria loja`
- **Teste de regressão:** previsto no Step 8 (MockMvc): operador → `PUT /stores/{sua loja}/inventory/{id}` = 200; `PUT /stores/{outra loja}/inventory/{id}` = negado; `PUT /stores/{id}` = 403.
