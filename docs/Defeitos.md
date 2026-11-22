# Registro de Defeitos — Fase 3

Defeitos encontrados e corrigidos na Fase 3. Os IDs de risco (R01–R10) seguem o Documento de Arquitetura (`docs/fase2/01-Documento_de_Arquitetura_de_Software.pdf`). Este registro alimenta o `TestCasePlan.md`.

| ID | Risco | Requisito | Severidade | Status |
|---|---|---|---|---|
| DEF-01 | R01 | RF07, RF08, RN01 | Alta | Corrigido |
| DEF-02 | R02 | RF01, RNF01 | Média | Corrigido |
| DEF-03 | — | RF11, RF17, RNF10 | Média | Corrigido |

## DEF-01 — Operador não consegue ajustar estoque da própria loja

- **Sintoma:** o operador recebe HTTP 403 ao salvar ajuste de estoque de produto ou de insumo na tela Estoque.
- **Reprodução:** login como `operador.centro` → Estoque → ajustar quantidade → salvar. Equivale a `PUT /api/stores/1/inventory/{productId}` ou `PUT /api/stores/1/ingredient-stock/{ingredientId}` com token de operador.
- **Esperado:** 200 para a loja do operador (RF07, RF08); acesso negado para outra loja (RN01).
- **Causa:** em `SecurityConfig`, `requestMatchers(PUT, "/stores/**").hasRole("ADMIN")` — o padrão `/**` casa também as sub-rotas de estoque da loja, restringindo-as ao administrador.
- **Correção:** padrão trocado para `/stores/*` (PUT e DELETE), que casa só `/stores/{id}`. Editar e desativar lojas continua exclusivo do ADMIN (RN02); o isolamento por loja nas sub-rotas segue a cargo do `StoreAccessGuard`.
- **Commit:** `fix(security): operador ajusta estoque da própria loja`
- **Teste de regressão:** previsto no Step 8 (MockMvc): operador → `PUT /stores/{sua loja}/inventory/{id}` = 200; `PUT /stores/{outra loja}/inventory/{id}` = negado; `PUT /stores/{id}` = 403.

## DEF-02 — Sessão expirada não volta ao login (403 no lugar de 401)

- **Sintoma:** com o token expirado, as telas mostram "Access Denied" ou erros genéricos em vez de redirecionar ao login. Usuário desativado com token ainda válido recebia HTTP 500.
- **Reprodução:** login → aguardar a expiração do token (ou alterar o token no `localStorage`) → navegar. Equivale a `GET /api/stores/1/inventory` sem token ou com token inválido.
- **Esperado:** HTTP 401 com mensagem em português; o frontend limpa a sessão e volta ao login (RF01, RNF01).
- **Causa:** sem `AuthenticationEntryPoint`, o Spring Security usa o `Http403ForbiddenEntryPoint` e responde 403 sem corpo; o interceptor do Axios só redireciona em 401. No `JwtAuthFilter`, a `UsernameNotFoundException` de usuário desativado não era tratada.
- **Correção:**
  - `JsonSecurityHandlers`: entry point 401 e access-denied 403, ambos em JSON no contrato do `GlobalExceptionHandler`.
  - `JwtAuthFilter`: marca token rejeitado (malformado, expirado, de usuário desativado) para a mensagem "Sessão expirada"; usuário desativado passa a gerar 401.
  - `client.js`: o redirecionamento em 401 ignora as rotas `/auth/*`, evitando recarregar a tela de login em loop.
- **Commit:** `fix(security): 401 para token ausente ou expirado`
- **Teste de regressão:** previsto no Step 8 (MockMvc): sem token = 401; token inválido = 401 com "Sessão expirada"; operador em rota ADMIN = 403; e no Step 11 (Vitest): 401 limpa o token e redireciona, exceto em `/auth/login`.

## DEF-03 — Vendas após 21h contadas no dia seguinte

- **Sintoma:** venda registrada às 22h de 20/11 aparece no painel e no relatório de 21/11.
- **Causa:** o contêiner roda em UTC; `LocalDate.now()` e `LocalDateTime.now()` (data da venda, "hoje" do painel) usam o fuso da JVM, três horas à frente de Brasília.
- **Correção:** `docker-compose.yml` define `JAVA_TOOL_OPTIONS=-Duser.timezone=America/Sao_Paulo` e `TZ` no backend.
- **Commit:** `chore(config): endurece configuração`
- **Verificação:** no contêiner, `docker compose exec backend date` e o log de inicialização da JVM mostram `America/Sao_Paulo`; venda às 22h aparece no painel do mesmo dia.

## Endurecimento sem defeito funcional (Step 5)

- **R05:** `JWT_SECRET` sem valor padrão no código e no compose; a API falha na inicialização se o segredo faltar ou tiver menos de 32 bytes. Senhas do banco lidas do `.env`. Seed (`admin123`, `operador123`) só com `APP_SEED_ENABLED=true`.
- **R07:** `ddl-auto=validate`; o Flyway é a única fonte do esquema.
- MySQL publicado só em `127.0.0.1:3306`.

