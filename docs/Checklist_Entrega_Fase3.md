# Checklist de Entrega — Fase 3

Marque cada item antes do envio (prazo: **03/12/2026**). Responsável e data ajudam na revisão cruzada.

## 1. Código e repositório

| OK | Item | Critério de pronto | Resp. | Data |
|---|---|---|---|---|
| [x] | Correções dos riscos R01–R05, R07, R09, R10 | Commits `fix`/`feat` na `main`; defeitos DEF-01 a DEF-11 em `docs/Defeitos.md` | | 22/11 |
| [x] | Migrações versionadas | V1–V4 aplicadas sobre banco existente sem perda (V3, V4 validadas) | | 22/11 |
| [x] | Segredos fora do repositório | `.env` só local; `JWT_SECRET` obrigatório; `.env.example` atualizado | | 22/11 |
| [x] | Pipeline de CI verde | Aba *Actions*: Backend (59, `Skipped: 0`), Frontend e Smoke test verdes; conferir de novo no último commit | | 22/11 |
| [ ] | Teste de clone limpo | Pasta nova: `git clone` → `cp .env.example .env` (com `JWT_SECRET`) → `docker compose up --build` → login `admin` | | |
| [x] | Tag da versão | `v6.0.0` no commit `12ebb35` validado pelo CI; se houver commits depois, mover a tag ou criar `v6.0.1`; release no GitHub (opcional) | | 22/11 |

## 2. Testes

| OK | Item | Critério de pronto | Resp. | Data |
|---|---|---|---|---|
| [x] | Testes automatizados do backend | `mvn test`: 59/59 (31 unitários, 28 com MySQL real) | | 22/11 |
| [x] | Testes automatizados do frontend | `npm test`: 19/19 | | 22/11 |
| [x] | Plano de casos de teste | `TestCasePlan.md` com cenários, resultado esperado, critério, evidências e defeitos | | 22/11 |
| [x] | Roteiro manual CT-MAN-01 a 05 | Executados e marcados no `TestCasePlan.md` | | 22/11 |
| [ ] | Roteiro manual CT-MAN-06 a 14 | Executados; ⬜ trocado por ✅ (ou DEF-NN aberto) | | |
| [ ] | Evidências | `docs/evidencias/`: saída final de `mvn test` e `npm test`, capturas dos fluxos (operador, admin, padeiro), 375 px e 1280 px | | |

## 3. Documentação

| OK | Item | Critério de pronto | Resp. | Data |
|---|---|---|---|---|
| [x] | Artefatos das Fases 1 e 2 | `docs/fase1`, `docs/fase2` com os nomes do enunciado | | 22/11 |
| [x] | Registro de Utilização da IA | `docs/fase3/Registro_de_Utilização_da_IA.pdf` | | 22/11 |
| [ ] | Revisão do Registro de IA | Nome da fase conforme o enunciado; participação de cada integrante, se exigida | | |
| [ ] | README final | Como executar, testar, credenciais de demonstração e link do CI conferidos por quem não escreveu | | |

## 4. Itens em aberto (decidir antes da entrega)

| OK | Item | Opções |
|---|---|---|
| [x] | Dashboard com “+12%” e “+5%” fixos (RF11) | Decidido: variação real contra ontem (DEF-13) |
| [x] | Categorias do PDV apenas visuais | Decidido: botões removidos; categoria fica como evolução futura |
| [ ] | Autor dos commits | Mantido como “Claude” com `Co-Authored-By` e declarado no Registro de IA (reescrever o histórico exigiria `push --force`) |

## 5. Envio

| OK | Item | Critério de pronto |
|---|---|---|
| [ ] | Link do repositório | Aberto com uma conta que não é dos autores (público ou professor convidado) |
| [ ] | Arquivos conferidos | Nomes iguais aos do enunciado; PDFs abrem e imprimem legíveis |
| [ ] | Envio | Até 03/12, de preferência com um dia de reserva |
