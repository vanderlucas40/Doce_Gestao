# Doce Gestão

Sistema web de gestão multi-loja para confeitarias: PDV, estoque, ficha técnica e produção em lote (fornada multissabor).

## Stack
| Camada | Tecnologia |
|---|---|
| Backend | Java 21, Spring Boot 3.2, Spring Security + JWT, JPA, Flyway |
| Banco | MySQL 8 |
| Frontend | React 18, Vite, Tailwind CSS, Axios |
| Infra | Docker, Docker Compose, Nginx |

## Como executar
```bash
cp .env.example .env              # ajuste os valores
docker compose up --build         # http://localhost:3000
docker compose down -v            # para e apaga o banco
```
Desenvolvimento local (MySQL em localhost:3306):
```bash
cd backend  && mvn spring-boot:run          # API em http://localhost:8080/api
cd frontend && npm install && npm run dev   # http://localhost:3000 (proxy /api -> :8080)
```

| Serviço | Porta |
|---|---|
| Frontend (Nginx) | 3000 |
| API (contexto /api) | 8080 |
| MySQL | 3306 |

## Variáveis de ambiente
`MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MS` (ver `.env.example`).

## Dados iniciais (somente desenvolvimento)
Na primeira execução o `DataInitializer` cria lojas, produtos, insumos e dois usuários de exemplo (`admin` e `operador.centro`). Troque as senhas antes de qualquer uso real.

## Estrutura
```
backend/    API Spring Boot (controller, service, repository, entity, dto, security, config)
frontend/   SPA React (api, components, hooks, pages)
docs/       Artefatos das macro entregas (PDFs)
```

## Padrões
- Código e API em inglês; textos de interface em português.
- Mudança de banco apenas por nova migração Flyway (`V3__...`, `V4__...`).
- Frontend: somente componentes de `ui.jsx`; chamadas HTTP via `src/api/`.
- Commits semânticos (`feat`, `fix`, `docs`, `test`, `chore`, `refactor`); `main` só recebe código revisado.

## Documentação
Artefatos das Fases 1 e 2 em `docs/`. Plano de testes: `TestCasePlan.md` (Fase 3).

## Equipe
Vandemberg Lucas Lima Melo (2112090004) · Ítalo de Farias Costa (2515050012) — Professor: Jeremias Araújo.
