# Regras de trabalho (valem para todo chat)

1. **Edição direta:** criar/editar arquivos no disco; não imprimir arquivos inteiros no chat.
2. **Sem prolixidade:** ir direto à execução. Sem introduções, saudações ou resumos longos.
3. **Commits locais:** ao fim de cada etapa, rodar `git status`, `git add` só dos arquivos da etapa e `git commit` com a mensagem semântica do plano. Nunca `git push` sem autorização.
4. **Registro de IA:** após cada commit, exibir 1 bloco (máx. 3 linhas): `Problema/Prompt -> Solução -> Validação`.

## Contexto mínimo
- Stack: Spring Boot 3 (Java 21) + MySQL 8 + React 18/Vite/Tailwind + Docker Compose.
- Portas: frontend 3000, API 8080 (contexto /api), MySQL 3306.
- Banco: só por migração Flyway nova (V3, V4...); nunca editar migração aplicada.
- Frontend: usar apenas componentes de `src/components/ui.jsx`; chamadas só via `src/api/`.
- Prazo da Fase 3: 03/12. Ler só os arquivos necessários à tarefa atual.
