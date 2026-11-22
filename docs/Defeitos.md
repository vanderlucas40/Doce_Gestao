# Registro de Defeitos — Fase 3

Defeitos encontrados e corrigidos na Fase 3. Os IDs de risco (R01–R10) seguem o Documento de Arquitetura (`docs/fase2/01-Documento_de_Arquitetura_de_Software.pdf`). Este registro alimenta o `TestCasePlan.md`.

| ID | Risco | Requisito | Severidade | Status |
|---|---|---|---|---|
| DEF-01 | R01 | RF07, RF08, RN01 | Alta | Corrigido |
| DEF-02 | R02 | RF01, RNF01 | Média | Corrigido |
| DEF-03 | — | RF11, RF17, RNF10 | Média | Corrigido |
| DEF-04 | — | RF16, RN12 | Alta | Corrigido |
| DEF-05 | — | RF14, RN13 | Média | Corrigido |
| DEF-06 | — | RF14, RN11 | Média | Corrigido |
| DEF-07 | — | RF20 | Alta | Corrigido |
| DEF-08 | R05 | RN01, RNF02 | Baixa | Corrigido |
| DEF-09 | R04 | RN06, RNF06 | Alta | Corrigido |

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

## DEF-04 — Desvio negativo aumentava o estoque de insumo

- **Sintoma:** fornada com quantidade real negativa (ex.: `-2`) somava 2 kg ao estoque de farinha; quantidade real vazia gerava HTTP 500.
- **Causa:** `FornadaRequest.adjustments` sem `@Valid` (o `@DecimalMin("0")` de `IngredientAdjustment` era ignorado) e nenhuma validação no serviço.
- **Correção:** `@Valid` em `adjustments`; `ProductionService` recusa desvio nulo, negativo ou de insumo fora da ficha técnica (422, mensagem em português).
- **Testes:** CT-PRO-08, CT-PRO-09, CT-PRO-10.

## DEF-05 — Fornada mista registrava sabor sem ficha técnica com consumo zero

- **Sintoma:** fornada com Bolo de Cenoura (com ficha) e Brigadeiro (sem ficha) era registrada; o brigadeiro entrava no estoque sem abater insumo.
- **Causa:** o serviço só recusava a fornada quando **nenhum** sabor tinha ficha técnica; RN13 exige o aviso para qualquer sabor sem ficha.
- **Correção:** `register` recusa e `preview` sinaliza (`missingRecipe`, `productsWithoutRecipe`) quando algum sabor não tem ficha; a tela Fornada lista os sabores.
- **Testes:** CT-PRO-03, CT-PRO-11, CT-PRO-12.

## DEF-06 — Unidades produzidas descartadas quando o produto não tinha estoque na loja

- **Sintoma:** fornada de um produto ainda sem registro de estoque naquela loja abatia os insumos, mas as unidades produzidas não apareciam no estoque.
- **Causa:** o incremento só ocorria se o registro de `inventory` já existisse (RN11).
- **Correção:** a fornada cria o registro de estoque do produto na loja quando ele falta.
- **Testes:** CT-PRO-13, CT-PRO-15.

## DEF-07 — Histórico de fornadas falhava ao carregar

- **Sintoma:** `GET /stores/{id}/production` (histórico, RF20) com fornadas gravadas respondia erro.
- **Causa:** a consulta faz `JOIN FETCH` de `items` e `ingredientUsages`, duas coleções `List` ("bags"); o Hibernate recusa (`MultipleBagFetchException`) e, com List, o produto cartesiano duplicaria os itens.
- **Correção:** as duas coleções de `ProductionBatch` passam a `Set` (`LinkedHashSet`, ordem de inserção preservada); sem mudança de esquema.
- **Segunda causa (achada pelo CT-PRO-15):** a consulta não buscava `b.store`, e `FornadaResponse.from()` lia o nome da loja fora da sessão (`LazyInitializationException`). Na API isso ficava mascarado pelo open-in-view do Spring; fora de uma requisição web (teste, tarefa agendada) falhava.
- **Correção complementar:** `JOIN FETCH b.store` nas três consultas de fornada e `@Transactional(readOnly = true)` em `findByStore` e `findById`.
- **Teste:** CT-PRO-15 (histórico lido do MySQL real).

## DEF-08 — Acesso a outra loja respondia 422 em vez de 403

- **Sintoma:** operador que chamava `/stores/{outra loja}/...` recebia HTTP 422 (regra de negócio), não 403 (sem permissão); o cliente não distinguia os dois casos.
- **Causa:** `StoreAccessGuard` lançava `BusinessException`; o comentário do próprio código dizia 403.
- **Correção:** o guard lança `AccessDeniedException`, já tratada como 403 em JSON pelo `GlobalExceptionHandler`. O acesso continua negado; só o código HTTP muda.
- **Commit:** `fix(security): acesso a outra loja responde 403`
- **Testes:** CT-SEG-07, CT-SEG-08.

## DEF-09 — Vendas simultâneas podiam vender além do estoque

- **Sintoma:** dois caixas vendendo o último item ao mesmo tempo: as duas vendas eram gravadas e o estoque registrava só uma baixa (atualização perdida).
- **Causa:** sem controle de concorrência; cada transação lia o mesmo saldo e gravava por cima da outra (R04). O mesmo valia para o estoque de insumos na fornada.
- **Correção:**
  - Migração `V3__optimistic_lock.sql`: coluna `version` em `inventory` e `ingredient_stock`.
  - `@Version` em `Inventory` e `IngredientStock`: a gravação com saldo desatualizado é recusada e a venda ou fornada é desfeita inteira.
  - `GlobalExceptionHandler`: o conflito responde HTTP 409 com mensagem em português para o operador tentar de novo.
- **Commit:** `fix(estoque): bloqueio otimista`
- **Testes:** CT-EST-01 e CT-EST-02 (versão desatualizada recusada); CT-EST-03 (8 vendas simultâneas, 3 em estoque: saldo final = 3 − vendas gravadas, nunca negativo).

