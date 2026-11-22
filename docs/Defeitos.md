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
| DEF-10 | — | RF01, RF02, RF04 | Alta | Corrigido |
| DEF-11 | — | RF09, RN06 | Baixa | Corrigido |
| DEF-12 | R09 | RNF06, RNF07 | Média | Corrigido |
| DEF-13 | — | RF11 | Média | Corrigido |
| DEF-14 | — | RNF04 | Baixa | Corrigido |
| DEF-15 | — | RNF05 | Média | Corrigido |
| DEF-16 | — | RNF10, RF07, RF08 | Média | Corrigido |
| DEF-17 | — | RF20 | Baixa | Corrigido |
| DEF-18 | — | RNF04, RF14 | Média | Corrigido |
| DEF-19 | — | RNF04, RF07, RF08, RF17 | Alta | Corrigido |
| DEF-20 | — | RNF10, RF18 | Baixa | Corrigido |
| DEF-21 | — | RF11, RF19, RNF04 | Média | Corrigido |

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

## DEF-10 — Parte dos logins perdia perfil e loja no frontend

- **Sintoma:** depois de logar, o usuário podia aparecer sem perfil (menus de administrador ocultos) ou sem loja vinculada; ao recarregar a página, a sessão sumia. Dependia do token: nomes com acento ou certos horários de expiração disparavam o problema.
- **Causa:** `useAuth.parsePayload` usava `atob()` direto no payload do JWT. O JWT usa base64url (`-` e `_`), que o `atob` rejeita (`InvalidCharacterError`), e o texto decodificado não era tratado como UTF-8.
- **Correção:** `decodeBase64Url` converte base64url → base64, completa o padding e decodifica os bytes como UTF-8 (`TextDecoder`).
- **Commit:** `fix(frontend): decodifica JWT base64url e valida estoque no carrinho`
- **Teste:** CT-FE-14 (falha com o código anterior: `InvalidCharacterError`).

## DEF-11 — Carrinho aceitava produto sem estoque

- **Sintoma:** no PDV, um produto com estoque 0 (ou quantidade maior que o saldo, na primeira inclusão) entrava no carrinho; o erro só aparecia ao finalizar a venda.
- **Causa:** o limite de estoque só era conferido ao somar a um item que já estava no carrinho.
- **Correção:** regras do carrinho extraídas para `utils/cart.js` (funções puras) com o limite conferido também na primeira inclusão; total arredondado a centavos.
- **Testes:** CT-FE-01 a CT-FE-06.

## DEF-12 — CI verde com os testes de integração ignorados

- **Sintoma:** na primeira execução do GitHub Actions, os três jobs ficaram verdes, mas o backend reportou `Tests run: 59, Skipped: 28`: todos os testes com MySQL real foram pulados.
- **Causa:** o Docker Engine 29 dos runners exige API ≥ 1.44; o Testcontainers 1.19.x (versão gerenciada pelo Spring Boot 3.2.5) pede a API 1.32 e é recusado (`client version 1.32 is too old`). Com `disabledWithoutDocker = true`, os testes viraram *skip* em vez de falha. Na máquina da equipe passava porque o Docker Desktop ainda aceitava a API antiga.
- **Correção:** `testcontainers.version` fixado em 1.21.4 no `pom.xml`; o CI passa a falhar se qualquer teste for ignorado; actions atualizadas para v5.
- **Commit:** `fix(ci): testes de integração rodam no Docker 29`
- **Verificação:** execução do CI com `Tests run: 59, Skipped: 0`.

## DEF-13 — Dashboard exibia variações inventadas

- **Sintoma:** os cartões “Receita Total” e “Vendas Concluídas” mostravam sempre “+12%” e “+5%” com seta para cima, qualquer que fosse o movimento da loja.
- **Causa:** valores escritos à mão no `Dashboard.jsx`, herdados do protótipo visual.
- **Correção:** `GET /stores/{id}/dashboard` passa a trazer `totalYesterday` e `salesCountYesterday`; a tela calcula a variação real (`utils/trend.js`), mostra seta e cor de queda quando cai, e não mostra percentual quando ontem não teve movimento.
- **Commit:** `fix(dashboard): variação real contra ontem; remove categorias falsas do PDV`
- **Testes:** CT-VEN-07, CT-VEN-08 (backend), CT-FE-18, CT-FE-19 (frontend).

**Na mesma entrega:** os botões de categoria do PDV (Tudo, Bolos, Doces, Salgados) foram removidos: os produtos não têm categoria e o filtro não fazia nada. Categoria de produto fica registrada como evolução futura.

## DEF-14 a DEF-20 — encontrados no roteiro manual (CT-MAN-06 a 14)

Todos achados na execução manual de 22/11/2026, no clone limpo, com capturas em `docs/evidencias/`. Corrigidos no commit `fix(frontend): defeitos do roteiro manual (DEF-14 a DEF-20)`.

| ID | Sintoma | Causa | Correção | Teste |
|---|---|---|---|---|
| DEF-14 | Para o administrador, o menu do topo cortava “Equipe” (“…CADASTROS EC”); entre 768 e 1280 px a tela ficava espremida | Links do topo num contêiner de largura fixa (`max-w-md`) e exibidos junto com o menu lateral | Links do topo só em telas ≥ 1536 px; abaixo disso o menu lateral navega | Manual (CT-MAN-09) |
| DEF-15 | Console com `GET /stores/undefined/inventory` → 500 ao abrir PDV, Estoque, Dashboard e Fornada | `useFetch` disparava antes de a loja carregar; id não numérico caía no handler genérico (500) | `useFetch(..., { enabled })` nas telas de loja e descarte de resposta antiga; `MethodArgumentTypeMismatchException` → 400 “Parâmetro inválido: storeId.” | CT-FE-22, CT-FE-23, CT-SEG-15 |
| DEF-16 | “24.000 disponível” (24 latas lidas como 24 mil); saldo 1,05 exibido “1.1”, 7,55 como “7.5”, 2,25 como “2.3”; abrir o ajuste e salvar sem mexer gravava o valor arredondado | `toFixed(3)`/`toFixed(1)` com ponto; formulário de ajuste preenchido com `toFixed(1)` | `fmtQty` (vírgula, até 3 casas) em Fornada, Estoque, Dashboard e Cadastros; formulário com o valor exato; alertas com unidade; rótulo “Qtd. real usada” | CT-FE-20 |
| DEF-17 | Histórico de fornadas mostrava só o consumo real, sem o sugerido (RF20) | Tela só destacava a cor do desvio | Exibe “0,35 kg (sugerido 0,3)” quando há desvio | Manual (CT-MAN-08) |
| DEF-18 | Fornada a 375 px: campo de quantidade sumia e o sabor ficava cortado | Grade de 12 colunas fixa (7/3/2) em qualquer largura | Sabor em linha inteira e quantidade abaixo em telas pequenas | Manual (CT-MAN-09) |
| DEF-19 | No celular não havia como chegar a Estoque, Relatórios e Equipe: ☰ sem ação, barra inferior com 4 itens, itens da tela Menu sem ação | Ícone ☰ decorativo; menu lateral oculto abaixo de 768 px | ☰ abre o menu lateral como gaveta (fecha ao escolher); tela Menu com atalhos reais (Estoque, Relatórios e, para admin, Cadastros e Equipe) | Manual (CT-MAN-09) |
| DEF-20 | CSV com data “22/11” sem ano (o Excel assume o ano atual); números da busca anterior permaneciam sob a mensagem de intervalo inválido | `fmtDate` sem ano no CSV; resultado não era limpo | CSV com dd/mm/aaaa (`fmtDateFull`); intervalo inválido limpa o resultado | CT-FE-21, manual (CT-MAN-12, 14) |

## DEF-21 — Elementos sem ação e dados fictícios herdados do protótipo

Achado no reteste do CT-MAN-09 (captura do Estoque a 1280 px) e confirmado por varredura do código. Mesmo tipo do DEF-13: a tela mostrava algo que o sistema não faz.

| Tela | Problema | Correção |
|---|---|---|
| Estoque | “Cronograma de Produção” com lotes inventados (Red Velvet, Lote #204…) fixos no código | Substituído por **Últimas Fornadas** reais da loja (histórico da API) |
| Estoque | Botão “+” flutuante no celular sem ação | Removido |
| Dashboard | “Nova Venda”, “Ver todas” e “Repor” sem ação | Levam ao PDV, aos Relatórios e ao Estoque |
| PDV | Card “Novo Item” sem ação; linha “Taxa de entrega R$ 0,00” sem função no sistema | Card só para admin, leva aos Cadastros; linha removida |
| Menu | Lápis sobre o avatar sem ação | Removido |
| Equipe | Ícone “⋮” (sugere menu) desativava o usuário; admin podia desativar a si mesmo | Ícone “desativar usuário” com rótulo; sem o botão na própria linha; API responde 422 “Você não pode desativar o próprio usuário.” |

- **Commit:** `fix(frontend): remove ações sem efeito e dados fictícios (DEF-21)`
- **Teste:** CT-SEG-16 (API); reteste manual das telas.

**Limitação aceita pela equipe:** a tela de login mostra sempre as credenciais de demonstração (`admin / admin123 · operador.centro / operador123`), para facilitar a avaliação. Em uso real, desligar o seed (`APP_SEED_ENABLED=false`) e trocar as senhas.

## Melhorias sem defeito funcional (Step 10)

- **R10 — motivo do ajuste:** a tela Estoque pedia o motivo, mas ele era descartado. Migração `V4__stock_movements_and_indexes.sql` cria `stock_movements` (saldo anterior e novo, motivo, autor, data); os ajustes manuais de produto e insumo gravam uma linha quando a quantidade muda. Consulta paginada em `GET /stores/{id}/stock-movements` (isolada por loja). Testes CT-EST-04 e CT-EST-05.
- **R06 — paginação:** `GET /stores/{id}/sales` passa a ser paginado no banco (`page`, `size` ≤ 100; resposta `{content, page, size, totalElements, totalPages}`), em duas etapas para não paginar em memória com `JOIN FETCH`. O PDV usa `/sales/by-date` com a data de hoje em vez de baixar todas as vendas. Testes CT-VEN-15 e CT-VEN-16.
- **Índices:** `sales (store_id, sold_at)` e `production_batches (store_id, produced_at)`, recomendados no Modelo de Dados para relatórios e histórico.

