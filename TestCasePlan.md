# Plano de Casos de Teste — Doce Gestão

| Item | Informação |
|---|---|
| Projeto | Doce Gestão — sistema de gestão multi-loja para confeitarias |
| Fase | Fase 3 — Implementação, Testes e Validação |
| Versão / data | 1.0 — 22/11/2026 |
| Equipe | Vandemberg Lucas Lima Melo (2112090004) · Ítalo de Farias Costa (2515050012) |
| Professor | Jeremias Araújo |
| Repositório | https://github.com/vanderlucas40/Doce_Gestao |

Os identificadores de requisito (RF, RNF, RN) seguem a Especificação de Requisitos (`docs/fase1/02`); os de risco (R01–R10), o Documento de Arquitetura (`docs/fase2/01`). Os defeitos estão descritos em detalhe em [`docs/Defeitos.md`](docs/Defeitos.md).

## 1. Objetivo e escopo

Verificar que o sistema cumpre os requisitos **Must** e **Should** da Fase 1, com prioridade para o que causa mais dano se quebrar: **estoque e dinheiro** (venda, fornada, concorrência) e **acesso** (perfis e isolamento por loja). Fora de escopo: requisitos *Won't* (RF22–RF26).

## 2. Estratégia

| Nível | Ferramenta | Alvo |
|---|---|---|
| Unitário (backend) | JUnit 5, Mockito, AssertJ | Regras de negócio dos serviços (venda, fornada, ficha técnica, baixa de estoque) |
| Integração (backend) | Spring Boot Test + Testcontainers (MySQL 8 real, migrações Flyway, `ddl-auto=validate`) | Atomicidade, persistência, histórico, concorrência |
| API (backend) | MockMvc + Spring Security + Testcontainers | Autenticação, perfis, isolamento por loja, contratos HTTP |
| Unitário (frontend) | Vitest + jsdom + Testing Library | Cliente HTTP, sessão (`useAuth`), carrinho do PDV |
| Aceitação (manual) | Navegador + Docker Compose | Fluxos de ponta a ponta, responsividade, portabilidade |

**Ambiente de execução:** Java 21.0.7, Maven 3.9.14, Docker Desktop (Testcontainers com `mysql:8.0`), Node 20 / Vitest 2.1.9.

**Como executar:**
```bash
cd backend  && mvn test    # 59 casos; os de integração exigem Docker ativo
cd frontend && npm test    # 17 casos
```

## 3. Critérios de aceitação

- **Entrada:** código compila (`mvn package`, `npm run build`); Docker ativo para os testes de integração.
- **Saída (aprovação):** 100% dos casos automatizados passando; nenhum defeito de severidade Alta aberto; roteiro manual da seção 5 executado nos fluxos principais.
- **Critério de cada caso:** o resultado observado é idêntico ao esperado descrito no cenário (código HTTP, mensagem, saldos e registros gravados). Qualquer divergência é registrada como defeito (DEF-NN) com teste de regressão.

## 4. Casos automatizados


### 4.1 Vendas e PDV (16 casos)

| ID | Cenário e resultado esperado | Tipo | Requisitos | Defeito | Implementação | Resultado |
|---|---|---|---|---|---|---|
| CT-VEN-01 | Venda com vários itens grava preço vigente, total e baixa o estoque de cada item | Unitário (Mockito) | RF09, RF10 | — | `SaleServiceTest#registraVendaComPrecoVigenteETotal` | ✅ Passou |
| CT-VEN-02 | Preço unitário vem do produto no servidor, não do cliente | Unitário (Mockito) | RN07 | — | `SaleServiceTest#precoUnitarioVemDoProduto` | ✅ Passou |
| CT-VEN-03 | Estoque insuficiente em um item interrompe a venda e nada é gravado | Unitário (Mockito) | RN06, RF10 | — | `SaleServiceTest#estoqueInsuficienteNaoGravaVenda` | ✅ Passou |
| CT-VEN-04 | Produto inexistente não baixa estoque nem grava venda | Unitário (Mockito) | RF09 | — | `SaleServiceTest#produtoInexistente` | ✅ Passou |
| CT-VEN-05 | Loja inexistente é rejeitada antes de qualquer item | Unitário (Mockito) | RF09 | — | `SaleServiceTest#lojaInexistente` | ✅ Passou |
| CT-VEN-06 | Register é transacional, condição da atomicidade da venda | Unitário (Mockito) | RNF06 | — | `SaleServiceTest#registerEhTransacional` | ✅ Passou |
| CT-VEN-07 | Painel do dia soma faturamento, conta vendas e limita a 10 os últimos pedidos | Unitário (Mockito) | RF11 | — | `SaleServiceTest#dashboardDoDia` | ✅ Passou |
| CT-VEN-08 | Painel sem vendas mostra faturamento zero | Unitário (Mockito) | RF11 | — | `SaleServiceTest#dashboardSemVendas` | ✅ Passou |
| CT-VEN-09 | Baixa subtrai a quantidade vendida | Unitário (Mockito) | RF10 | — | `InventoryServiceTest#baixaSubtrai` | ✅ Passou |
| CT-VEN-10 | Vender exatamente o saldo zera o estoque | Unitário (Mockito) | RF10 | — | `InventoryServiceTest#baixaDoSaldoExato` | ✅ Passou |
| CT-VEN-11 | Quantidade maior que o estoque é recusada com mensagem em português | Unitário (Mockito) | RN06, RNF05 | — | `InventoryServiceTest#estoqueInsuficiente` | ✅ Passou |
| CT-VEN-12 | Produto sem registro de estoque na loja é recusado | Unitário (Mockito) | RF10 | — | `InventoryServiceTest#produtoSemEstoqueNaLoja` | ✅ Passou |
| CT-VEN-13 | Item sem estoque desfaz a venda inteira; o estoque dos demais não muda | Integração (MySQL real) | RNF06, RN06 | — | `SaleServiceIntegrationTest#vendaAtomica` | ✅ Passou |
| CT-VEN-14 | Venda válida baixa o estoque e mantém o preço da época após reajuste | Integração (MySQL real) | RF10, RN07 | — | `SaleServiceIntegrationTest#vendaValidaEPrecoHistorico` | ✅ Passou |
| CT-VEN-15 | Vendas paginadas no banco, mais recentes primeiro (R06) | API (MockMvc + MySQL real) | RNF03 | — | `MovementsAndPagingApiIntegrationTest#vendasPaginadas` | ✅ Passou |
| CT-VEN-16 | Tamanho de página acima de 100 é limitado a 100 | API (MockMvc + MySQL real) | RNF03 | — | `MovementsAndPagingApiIntegrationTest#tamanhoMaximo` | ✅ Passou |

### 4.2 Produção (fornada) (16 casos)

| ID | Cenário e resultado esperado | Tipo | Requisitos | Defeito | Implementação | Resultado |
|---|---|---|---|---|---|---|
| CT-PRO-01 | Preview consolida insumo comum a vários sabores em uma linha | Unitário (Mockito) | RF15, RN09 | — | `ProductionServiceTest#previewConsolida` | ✅ Passou |
| CT-PRO-02 | Preview marca insumo insuficiente sem gravar nada | Unitário (Mockito) | RF15 | — | `ProductionServiceTest#previewInsuficiente` | ✅ Passou |
| CT-PRO-03 | Preview com sabor sem ficha técnica avisa e lista o sabor | Unitário (Mockito) | RF15, RN13 | DEF-05 | `ProductionServiceTest#previewSaborSemFicha` | ✅ Passou |
| CT-PRO-04 | Fornada abate o consolidado dos insumos e soma as unidades ao estoque | Unitário (Mockito) | RF14, RN09, RN11 | — | `ProductionServiceTest#registraFornada` | ✅ Passou |
| CT-PRO-05 | Com um insumo em falta nada é abatido e a mensagem diz o que falta | Unitário (Mockito) | RN10, RNF05 | — | `ProductionServiceTest#failFast` | ✅ Passou |
| CT-PRO-06 | Desvio informado prevalece no abatimento e os dois valores ficam registrados | Unitário (Mockito) | RF16, RN12 | — | `ProductionServiceTest#desvio` | ✅ Passou |
| CT-PRO-07 | Desvio acima do estoque também bloqueia a fornada | Unitário (Mockito) | RN10, RN12 | — | `ProductionServiceTest#desvioAcimaDoEstoque` | ✅ Passou |
| CT-PRO-08 | Desvio negativo é recusado e não aumenta o estoque | Unitário (Mockito) | RN12 | DEF-04 | `ProductionServiceTest#desvioNegativo` | ✅ Passou |
| CT-PRO-09 | Desvio sem quantidade é recusado com 422, não 500 | Unitário (Mockito) | RN12 | DEF-04 | `ProductionServiceTest#desvioNulo` | ✅ Passou |
| CT-PRO-10 | Desvio de insumo fora da ficha técnica é recusado | Unitário (Mockito) | RN12 | DEF-04 | `ProductionServiceTest#desvioForaDaFicha` | ✅ Passou |
| CT-PRO-11 | Fornada mista com sabor sem ficha técnica é recusada e cita o sabor | Unitário (Mockito) | RN13 | DEF-05 | `ProductionServiceTest#saborSemFichaNaFornadaMista` | ✅ Passou |
| CT-PRO-12 | Fornada sem nenhuma ficha técnica é recusada | Unitário (Mockito) | RN13 | — | `ProductionServiceTest#nenhumSaborComFicha` | ✅ Passou |
| CT-PRO-13 | Produto sem registro de estoque na loja ganha o registro com as unidades produzidas | Unitário (Mockito) | RN11 | DEF-06 | `ProductionServiceTest#criaEstoqueDoProduto` | ✅ Passou |
| CT-PRO-14 | Register é transacional, condição da atomicidade da fornada | Unitário (Mockito) | RNF06 | — | `ProductionServiceTest#registerEhTransacional` | ✅ Passou |
| CT-PRO-15 | Fornada persiste insumos abatidos, estoque de produtos e histórico com sugerido x real | Integração (MySQL real) | RF14, RF16, RF20 | DEF-06, DEF-07 | `ProductionServiceIntegrationTest#fornadaPersistida` | ✅ Passou |
| CT-PRO-16 | Fornada recusada não altera nenhum estoque nem grava histórico | Integração (MySQL real) | RN10, RNF06 | — | `ProductionServiceIntegrationTest#fornadaRecusadaNaoGrava` | ✅ Passou |

### 4.3 Ficha técnica (5 casos)

| ID | Cenário e resultado esperado | Tipo | Requisitos | Defeito | Implementação | Resultado |
|---|---|---|---|---|---|---|
| CT-FIC-01 | Insumo novo na ficha cria o item com quantidade e unidade | Unitário (Mockito) | RF13 | — | `RecipeServiceTest#criaItem` | ✅ Passou |
| CT-FIC-02 | Insumo já presente atualiza o mesmo item, sem duplicar (UNIQUE produto + insumo) | Unitário (Mockito) | RF13 | — | `RecipeServiceTest#atualizaItemExistente` | ✅ Passou |
| CT-FIC-03 | Insumo inexistente é recusado e nada é gravado | Unitário (Mockito) | RF13 | — | `RecipeServiceTest#insumoInexistente` | ✅ Passou |
| CT-FIC-04 | Item de ficha de outro produto não pode ser removido por este produto | Unitário (Mockito) | RF13 | — | `RecipeServiceTest#removeItemDeOutroProduto` | ✅ Passou |
| CT-FIC-05 | Remove item da ficha do próprio produto | Unitário (Mockito) | RF13 | — | `RecipeServiceTest#removeItem` | ✅ Passou |

### 4.4 Estoque e concorrência (5 casos)

| ID | Cenário e resultado esperado | Tipo | Requisitos | Defeito | Implementação | Resultado |
|---|---|---|---|---|---|---|
| CT-EST-01 | Gravação com saldo desatualizado de produto é recusada, sem sobrescrever a anterior | Integração (MySQL real) | RF07, RN06 | DEF-09 | `StockConcurrencyIntegrationTest#versaoDesatualizadaProduto` | ✅ Passou |
| CT-EST-02 | Gravação com saldo desatualizado de insumo é recusada | Integração (MySQL real) | RF08, RNF06 | DEF-09 | `StockConcurrencyIntegrationTest#versaoDesatualizadaInsumo` | ✅ Passou |
| CT-EST-03 | 8 vendas simultâneas com 3 unidades em estoque nunca vendem além do saldo | Integração (MySQL real) | RN06, RNF06 | DEF-09 | `StockConcurrencyIntegrationTest#vendasSimultaneas` | ✅ Passou |
| CT-EST-04 | Ajustes manuais gravam motivo, autor e saldo anterior/novo (R10) | API (MockMvc + MySQL real) | RF07, RF08 | — | `MovementsAndPagingApiIntegrationTest#ajusteGravaMovimentacao` | ✅ Passou |
| CT-EST-05 | Operador não vê movimentações de outra loja (403) | API (MockMvc + MySQL real) | RN01, RNF02 | DEF-08 | `MovementsAndPagingApiIntegrationTest#movimentacoesOutraLoja` | ✅ Passou |

### 4.5 Acesso e segurança (14 casos)

| ID | Cenário e resultado esperado | Tipo | Requisitos | Defeito | Implementação | Resultado |
|---|---|---|---|---|---|---|
| CT-SEG-01 | Sem token responde 401 em JSON | API (MockMvc + MySQL real) | RF01, RNF01 | DEF-02 | `SecurityApiIntegrationTest#semToken` | ✅ Passou |
| CT-SEG-02 | Token inválido responde 401 com 'Sessão expirada' | API (MockMvc + MySQL real) | RF01, RNF01 | DEF-02 | `SecurityApiIntegrationTest#tokenInvalido` | ✅ Passou |
| CT-SEG-03 | Senha errada é recusada com mensagem em português | API (MockMvc + MySQL real) | RF01, RNF05 | — | `SecurityApiIntegrationTest#senhaErrada` | ✅ Passou |
| CT-SEG-04 | Usuário desativado depois do login perde o acesso (401, não 500) | API (MockMvc + MySQL real) | RF01, RNF01, RN05 | DEF-02 | `SecurityApiIntegrationTest#usuarioDesativado` | ✅ Passou |
| CT-SEG-05 | Operador ajusta estoque de produto da própria loja | API (MockMvc + MySQL real) | RF07, RN01 | DEF-01 | `SecurityApiIntegrationTest#operadorAjustaEstoqueProduto` | ✅ Passou |
| CT-SEG-06 | Operador ajusta estoque de insumo da própria loja | API (MockMvc + MySQL real) | RF08, RN01 | DEF-01 | `SecurityApiIntegrationTest#operadorAjustaEstoqueInsumo` | ✅ Passou |
| CT-SEG-07 | Operador não lê estoque de outra loja, mesmo conhecendo a URL | API (MockMvc + MySQL real) | RN01, RNF02 | DEF-08 | `SecurityApiIntegrationTest#operadorOutraLojaLeitura` | ✅ Passou |
| CT-SEG-08 | Operador não ajusta estoque nem vende em outra loja (403) | API (MockMvc + MySQL real) | RN01, RNF02 | DEF-08 | `SecurityApiIntegrationTest#operadorOutraLojaEscrita` | ✅ Passou |
| CT-SEG-09 | Administrador acessa qualquer loja | API (MockMvc + MySQL real) | RF02, RF04, RN01 | — | `SecurityApiIntegrationTest#adminQualquerLoja` | ✅ Passou |
| CT-SEG-10 | Operador não edita loja; administrador edita | API (MockMvc + MySQL real) | RF03, RN02 | DEF-01 | `SecurityApiIntegrationTest#editarLoja` | ✅ Passou |
| CT-SEG-11 | Só o administrador cria produto | API (MockMvc + MySQL real) | RF05, RN02 | — | `SecurityApiIntegrationTest#criarProduto` | ✅ Passou |
| CT-SEG-12 | Só o administrador cria insumo | API (MockMvc + MySQL real) | RF06, RN02 | — | `SecurityApiIntegrationTest#criarInsumo` | ✅ Passou |
| CT-SEG-13 | Ficha técnica: operador consulta, só o administrador altera | API (MockMvc + MySQL real) | RF13, RN02 | — | `SecurityApiIntegrationTest#fichaTecnica` | ✅ Passou |
| CT-SEG-14 | Gestão de usuários é exclusiva do administrador | API (MockMvc + MySQL real) | RF19, RN02 | — | `SecurityApiIntegrationTest#usuarios` | ✅ Passou |

### 4.6 Cadastros (3 casos)

| ID | Cenário e resultado esperado | Tipo | Requisitos | Defeito | Implementação | Resultado |
|---|---|---|---|---|---|---|
| CT-CAD-01 | Nome de loja repetido, mesmo com outra caixa, é recusado | API (MockMvc + MySQL real) | RF03, RN03 | — | `SecurityApiIntegrationTest#lojaDuplicada` | ✅ Passou |
| CT-CAD-02 | Preço zero é recusado com o campo indicado | API (MockMvc + MySQL real) | RF05, RN04, RNF05 | — | `SecurityApiIntegrationTest#precoZero` | ✅ Passou |
| CT-CAD-03 | Excluir produto apenas o desativa e o tira da listagem | API (MockMvc + MySQL real) | RF05, RN05 | — | `SecurityApiIntegrationTest#desativarProduto` | ✅ Passou |

### 4.7 Frontend (17 casos)

| ID | Cenário e resultado esperado | Tipo | Requisitos | Defeito | Implementação | Resultado |
|---|---|---|---|---|---|---|
| CT-FE-01 | Adiciona item novo com preço numérico e limite do estoque | Unitário (Vitest/jsdom) | RF09 | — | `cart.test.js` | ✅ Passou |
| CT-FE-02 | Adicionar o mesmo produto soma a quantidade, sem passar do estoque | Unitário (Vitest/jsdom) | RF09, RN06 | DEF-11 | `cart.test.js` | ✅ Passou |
| CT-FE-03 | Produto sem estoque ou quantidade acima do saldo não entra no carrinho | Unitário (Vitest/jsdom) | RF09, RN06 | DEF-11 | `cart.test.js` | ✅ Passou |
| CT-FE-04 | Alterar quantidade respeita o estoque e remove ao chegar a zero | Unitário (Vitest/jsdom) | RF09 | — | `cart.test.js` | ✅ Passou |
| CT-FE-05 | Total arredondado a centavos, contagem de itens e remoção | Unitário (Vitest/jsdom) | RF09 | — | `cart.test.js` | ✅ Passou |
| CT-FE-06 | Pedido enviado só com id e quantidade; o preço é do servidor | Unitário (Vitest/jsdom) | RN07 | — | `cart.test.js` | ✅ Passou |
| CT-FE-07 | Usa a data local, não a UTC | Unitário (Vitest/jsdom) | RNF10 | DEF-03 | `date.test.js` | ✅ Passou |
| CT-FE-08 | Envia o token salvo no cabeçalho Authorization | Unitário (Vitest/jsdom) | RF01, RNF01 | — | `client.test.js` | ✅ Passou |
| CT-FE-09 | 401 em rota protegida limpa a sessão e volta ao login | Unitário (Vitest/jsdom) | RF01 | DEF-02 | `client.test.js` | ✅ Passou |
| CT-FE-10 | 401 no próprio login não recarrega a página | Unitário (Vitest/jsdom) | RF01 | DEF-02 | `client.test.js` | ✅ Passou |
| CT-FE-11 | Erro de negócio vira Error com a mensagem do backend, o status e os campos | Unitário (Vitest/jsdom) | RNF05 | — | `client.test.js` | ✅ Passou |
| CT-FE-12 | 403 não derruba a sessão | Unitário (Vitest/jsdom) | RF02 | — | `client.test.js` | ✅ Passou |
| CT-FE-13 | Lê perfil e loja do token | Unitário (Vitest/jsdom) | RF01, RF02 | — | `useAuth.test.jsx` | ✅ Passou |
| CT-FE-14 | Token base64url com - ou _ e nome acentuado é lido corretamente | Unitário (Vitest/jsdom) | RF01, RF02 | DEF-10 | `useAuth.test.jsx` | ✅ Passou |
| CT-FE-15 | Token expirado ou malformado não abre sessão | Unitário (Vitest/jsdom) | RF01, RNF01 | — | `useAuth.test.jsx` | ✅ Passou |
| CT-FE-16 | Login guarda o token e expõe o perfil; logout limpa | Unitário (Vitest/jsdom) | RF01 | — | `useAuth.test.jsx` | ✅ Passou |
| CT-FE-17 | Sessão é restaurada ao recarregar a página; expirada é descartada | Unitário (Vitest/jsdom) | RF01 | — | `useAuth.test.jsx` | ✅ Passou |

## 5. Roteiro de aceitação manual

Executado com `docker compose up --build` em `http://localhost:3000`, dados de demonstração (`APP_SEED_ENABLED=true`).

| ID | Cenário | Passos | Resultado esperado | Requisitos | Resultado |
|---|---|---|---|---|---|
| CT-MAN-01 | Subida completa com um comando | `cp .env.example .env` (com `JWT_SECRET`), `docker compose up --build` | 3 contêineres; backend `Healthy`; Flyway aplica V1–V4; `validate` sem erro | RNF07, RNF08 | ✅ 22/11/2026 |
| CT-MAN-02 | Migração sobre banco existente | `docker compose up --build` sem `-v` após V3 e V4 | Dados preservados; backend `Healthy` | RNF08 | ✅ 22/11/2026 |
| CT-MAN-03 | Login do administrador | Entrar com `admin` | Menus completos (Cadastros, Equipe, Relatórios) | RF01, RF02 | ✅ 22/11/2026 |
| CT-MAN-04 | Sessão após recarregar | Logado, pressionar F5 | Continua logado, com perfil e loja | RF01 | ✅ 22/11/2026 |
| CT-MAN-05 | Produto sem estoque no PDV | Tentar incluir produto com estoque 0 | Item não entra no carrinho | RF09, RN06 | ✅ 22/11/2026 |
| CT-MAN-06 | Fluxo do operador | `operador.centro` → PDV → 2 produtos → finalizar | Venda registrada, estoque baixado, venda nas "últimas do dia" | RF09, RF10, RF04 | ⬜ Pendente |
| CT-MAN-07 | Ajuste de estoque pelo operador | Estoque → ajustar com motivo "Avaria / Perda" | Salvo; movimentação em `/api/stores/1/stock-movements` | RF07, RF08 | ⬜ Pendente |
| CT-MAN-08 | Fluxo do padeiro | Fornada → 2 sabores → conferir resumo → informar desvio → registrar | Resumo consolidado; insumos abatidos; fornada no histórico | RF14, RF15, RF16, RF20 | ⬜ Pendente |
| CT-MAN-09 | Responsividade | Telas PDV, Estoque, Fornada em 375 px e 1280 px | Barra inferior no celular; menu lateral no desktop | RNF04 | ⬜ Pendente |
| CT-MAN-10 | Navegadores | Login + venda no Chrome, Firefox e Edge atuais | Mesmo comportamento | RNF09 | ⬜ Pendente |
| CT-MAN-11 | Desempenho | Aba Rede: PDV, Estoque, Dashboard com dados de exemplo | Respostas da API em até 2 s | RNF03 | ⬜ Pendente |
| CT-MAN-12 | Relatório e CSV | Relatórios → 7 dias → exportar CSV | Valores em R$, datas dd/mm/aaaa, CSV abre em planilha | RF17, RF18, RNF10 | ⬜ Pendente |
| CT-MAN-13 | Alertas de estoque baixo | Ajustar um produto para menos de 30% da capacidade e um insumo abaixo do mínimo; abrir o Dashboard | Os dois aparecem nos alertas | RF12, RN08 | ⬜ Pendente |
| CT-MAN-14 | Intervalo do relatório | Relatórios com data inicial após a final; depois intervalo de 400 dias | Mensagens: data inicial posterior à final; máximo de 366 dias | RN14 | ⬜ Pendente |

> Para os casos pendentes, registrar data, navegador e captura de tela em `docs/evidencias/` e trocar ⬜ por ✅ (ou abrir DEF-NN).

## 6. Matriz de rastreabilidade (requisito → casos automatizados)

| Requisito | Casos | Qtde |
|---|---|---|
| RF01 | CT-FE-08, CT-FE-09, CT-FE-10, CT-FE-13, CT-FE-14, CT-FE-15, CT-FE-16, CT-FE-17, CT-SEG-01, CT-SEG-02, CT-SEG-03, CT-SEG-04 | 12 |
| RF02 | CT-FE-12, CT-FE-13, CT-FE-14, CT-SEG-09 | 4 |
| RF03 | CT-CAD-01, CT-SEG-10 | 2 |
| RF04 | CT-SEG-09 | 1 |
| RF05 | CT-CAD-02, CT-CAD-03, CT-SEG-11 | 3 |
| RF06 | CT-SEG-12 | 1 |
| RF07 | CT-EST-01, CT-EST-04, CT-SEG-05 | 3 |
| RF08 | CT-EST-02, CT-EST-04, CT-SEG-06 | 3 |
| RF09 | CT-FE-01, CT-FE-02, CT-FE-03, CT-FE-04, CT-FE-05, CT-VEN-01, CT-VEN-04, CT-VEN-05 | 8 |
| RF10 | CT-VEN-01, CT-VEN-03, CT-VEN-09, CT-VEN-10, CT-VEN-12, CT-VEN-14 | 6 |
| RF11 | CT-VEN-07, CT-VEN-08 | 2 |
| RF13 | CT-FIC-01, CT-FIC-02, CT-FIC-03, CT-FIC-04, CT-FIC-05, CT-SEG-13 | 6 |
| RF14 | CT-PRO-04, CT-PRO-15 | 2 |
| RF15 | CT-PRO-01, CT-PRO-02, CT-PRO-03 | 3 |
| RF16 | CT-PRO-06, CT-PRO-15 | 2 |
| RF19 | CT-SEG-14 | 1 |
| RF20 | CT-PRO-15 | 1 |
| RN01 | CT-EST-05, CT-SEG-05, CT-SEG-06, CT-SEG-07, CT-SEG-08, CT-SEG-09 | 6 |
| RN02 | CT-SEG-10, CT-SEG-11, CT-SEG-12, CT-SEG-13, CT-SEG-14 | 5 |
| RN03 | CT-CAD-01 | 1 |
| RN04 | CT-CAD-02 | 1 |
| RN05 | CT-CAD-03, CT-SEG-04 | 2 |
| RN06 | CT-EST-01, CT-EST-03, CT-FE-02, CT-FE-03, CT-VEN-03, CT-VEN-11, CT-VEN-13 | 7 |
| RN07 | CT-FE-06, CT-VEN-02, CT-VEN-14 | 3 |
| RN09 | CT-PRO-01, CT-PRO-04 | 2 |
| RN10 | CT-PRO-05, CT-PRO-07, CT-PRO-16 | 3 |
| RN11 | CT-PRO-04, CT-PRO-13 | 2 |
| RN12 | CT-PRO-06, CT-PRO-07, CT-PRO-08, CT-PRO-09, CT-PRO-10 | 5 |
| RN13 | CT-PRO-03, CT-PRO-11, CT-PRO-12 | 3 |
| RNF01 | CT-FE-08, CT-FE-15, CT-SEG-01, CT-SEG-02, CT-SEG-04 | 5 |
| RNF02 | CT-EST-05, CT-SEG-07, CT-SEG-08 | 3 |
| RNF03 | CT-VEN-15, CT-VEN-16 | 2 |
| RNF05 | CT-CAD-02, CT-FE-11, CT-PRO-05, CT-SEG-03, CT-VEN-11 | 5 |
| RNF06 | CT-EST-02, CT-EST-03, CT-PRO-14, CT-PRO-16, CT-VEN-06, CT-VEN-13 | 6 |
| RNF10 | CT-FE-07 | 1 |

**Requisitos Must/Should sem caso automatizado:** RF12, RF17, RF18, RNF04, RNF07, RNF08, RNF09, RN08, RN14 — cobertos pelo roteiro manual da seção 5 (CT-MAN-06 a CT-MAN-14). RNF07 e RNF08: CT-MAN-01 e CT-MAN-02.

## 7. Defeitos encontrados e corrigidos

| ID | Defeito | Risco | Requisitos | Severidade | Status | Teste de regressão |
|---|---|---|---|---|---|---|
| DEF-01 | Operador não consegue ajustar estoque da própria loja | R01 | RF07, RF08, RN01 | Alta | Corrigido | CT-SEG-05, CT-SEG-06, CT-SEG-10 |
| DEF-02 | Sessão expirada não volta ao login (403 no lugar de 401) | R02 | RF01, RNF01 | Média | Corrigido | CT-SEG-01, CT-SEG-02, CT-SEG-04, CT-FE-09, CT-FE-10 |
| DEF-03 | Vendas após 21h contadas no dia seguinte | — | RF11, RF17, RNF10 | Média | Corrigido | CT-FE-07 (data local no PDV); fuso do contêiner verificado no CT-MAN-01 |
| DEF-04 | Desvio negativo aumentava o estoque de insumo | — | RF16, RN12 | Alta | Corrigido | CT-PRO-08, CT-PRO-09, CT-PRO-10 |
| DEF-05 | Fornada mista registrava sabor sem ficha técnica com consumo zero | — | RF14, RN13 | Média | Corrigido | CT-PRO-03, CT-PRO-11 |
| DEF-06 | Unidades produzidas descartadas quando o produto não tinha estoque na loja | — | RF14, RN11 | Média | Corrigido | CT-PRO-13, CT-PRO-15 |
| DEF-07 | Histórico de fornadas falhava ao carregar | — | RF20 | Alta | Corrigido | CT-PRO-15 |
| DEF-08 | Acesso a outra loja respondia 422 em vez de 403 | R05 | RN01, RNF02 | Baixa | Corrigido | CT-SEG-07, CT-SEG-08, CT-EST-05 |
| DEF-09 | Vendas simultâneas podiam vender além do estoque | R04 | RN06, RNF06 | Alta | Corrigido | CT-EST-01, CT-EST-02, CT-EST-03 |
| DEF-10 | Parte dos logins perdia perfil e loja no frontend | — | RF01, RF02, RF04 | Alta | Corrigido | CT-FE-14 |
| DEF-11 | Carrinho aceitava produto sem estoque | — | RF09, RN06 | Baixa | Corrigido | CT-FE-02, CT-FE-03 |

Total: 11 defeitos, todos corrigidos; nenhum defeito Alta aberto.

## 8. Evidências de execução

| Data | Escopo | Comando | Resultado |
|---|---|---|---|
| 22/11/2026 | Backend: venda (Step 6) | `mvn test` | 14/14 ✅ |
| 22/11/2026 | Backend: + fornada (Step 7) | `mvn test` | 30/30 ✅ |
| 22/11/2026 | Backend: + segurança e cadastros (Step 8) | `mvn test` | 52/52 ✅ |
| 22/11/2026 | Backend: + concorrência (Step 9) | `mvn test` | 55/55 ✅ |
| 22/11/2026 | Backend: + movimentações e paginação (Step 10) | `mvn test` | 59/59 ✅ |
| 22/11/2026 | Frontend (Step 11) | `npm test` | 17/17 ✅ |
| 22/11/2026 | Aceitação: CT-MAN-01 a 05 | `docker compose up --build` + navegador | ✅ |

**Total automatizado: 76 casos (59 backend + 17 frontend), 100% aprovados.** Os relatórios detalhados ficam em `backend/target/surefire-reports/` após cada execução; recomenda-se anexar a saída final de `mvn test` e `npm test` em `docs/evidencias/`.

Durante a execução, os testes revelaram defeitos que a revisão de código não havia apontado: `PotentialStubbingProblem` no próprio teste (ajustado), `LazyInitializationException` no histórico de fornadas (DEF-07, segunda causa) e a decodificação do JWT no frontend (DEF-10).

## 9. Limitações conhecidas e itens em aberto

| Item | Situação | Encaminhamento |
|---|---|---|
| Variação "+12%" e "+5%" no Dashboard | Valores fixos na tela (RF11) | Calcular contra o dia anterior ou remover |
| Categorias do PDV | Apenas visuais; não filtram produtos | Documentar como limitação ou implementar categoria no produto |
| Token JWT em `localStorage` (R07) | Exposto a XSS | CSP no Nginx; cookie httpOnly em versão futura |
| CORS fixo em localhost (R09) | Quebra em outro domínio | Tornar configurável por variável de ambiente |
| Instância única de API e banco (R10) | Sem alta disponibilidade | Aceito para o escopo acadêmico |

