# Evidências da Fase 3

Execução de 22/11/2026. Roteiro e resultados em [`TestCasePlan.md`](../../TestCasePlan.md) (seções 5 e 8); defeitos em [`Defeitos.md`](../Defeitos.md).

| Arquivo | O que mostra |
|---|---|
| `mvn-test.txt`, `npm-test.txt` | Saída completa das suítes automatizadas (backend e frontend) |
| `ci-actions.png` | Runs do GitHub Actions verdes (o #3 é o commit da tag `v6.0.0`) |
| `ct-man-01-login-clone-limpo.png` | Clone limpo: tela de login após `docker compose up --build` em pasta nova |
| `ct-man-06-*` | Venda pelo operador: PDV antes (Pão de Mel esgotado), estoque baixado, Dashboard sem percentual inventado, relatório |
| `ct-man-07-movimentacao-console.png` | Ajuste de Açúcar 9 → 8 com motivo “Avaria / Perda” gravado em `stock_movements` |
| `ct-man-08-*` | Fornada: aviso de sabor sem ficha, resumo consolidado, confirmação, desvio da farinha, histórico e estoques |
| `ct-man-09-*` | Telas a 375 px e 1280 px (evidência dos DEF-14, 16, 18 e 19, corrigidos depois) |
| `ct-man-09-reteste-*` | Reteste após as correções: ☰ abre o menu a 375 px, Estoque acessível, Fornada com a quantidade visível, topo a 1280 px sem links cortados |
| `ct-man-10-edge.png` | Venda e estoque no Microsoft Edge |
| `ct-man-11-rede-*` | Aba Rede: maior tempo de API 542 ms (meta: 2 s) |
| `ct-man-12-csv-excel.png` | CSV exportado aberto no Excel (acentos e colunas corretos; data sem ano → DEF-20) |
| `ct-man-14-intervalo-maximo.png` | Mensagem de intervalo máximo de 366 dias |
| `tela-cadastros.png`, `tela-equipe.png` | Telas do administrador |

As capturas `ct-man-09-375px-*` e `ct-man-09-1280px-*` são anteriores às correções e documentam os defeitos; as `ct-man-09-reteste-*` mostram o resultado corrigido. A de 1280 px do reteste revelou o DEF-21 (cronograma fictício no Estoque).
