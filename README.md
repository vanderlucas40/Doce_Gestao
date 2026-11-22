# Doce Gestão

Sistema web de gestão multi-loja para confeitarias: PDV, estoque, ficha técnica e produção em lote (fornada multissabor).

Repositório: https://github.com/vanderlucas40/Doce_Gestao

## Stack
| Camada | Tecnologia |
|---|---|
| Backend | Java 21, Spring Boot 3.2, Spring Security + JWT, JPA, Flyway |
| Banco | MySQL 8 |
| Frontend | React 18, Vite, Tailwind CSS, Axios |
| Infra | Docker, Docker Compose, Nginx |

## Como executar
```bash
cp .env.example .env              # ajuste os valores; gere o JWT_SECRET:
#   openssl rand -base64 64        (cole o resultado em JWT_SECRET, numa linha só)
docker compose up --build         # http://localhost:3000
docker compose down -v            # para e apaga o banco
```
Desenvolvimento local (MySQL em localhost:3306):
```bash
cd backend  && JWT_SECRET=... APP_SEED_ENABLED=true mvn spring-boot:run   # API em http://localhost:8080/api
cd frontend && npm install && npm run dev   # http://localhost:3000 (proxy /api -> :8080)
```

| Serviço | Porta |
|---|---|
| Frontend (Nginx) | 3000 |
| API (contexto /api) | 8080 |
| MySQL | 3306 |

## Testes
```bash
cd backend && mvn test     # unitários sempre; integração (MySQL via Testcontainers) só com Docker ativo
cd frontend && npm test    # Vitest (jsdom): cliente HTTP, sessão, carrinho do PDV
```
Sem Docker, os testes de integração são ignorados e os unitários continuam rodando.

## Variáveis de ambiente
`MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MS`, `APP_SEED_ENABLED` (ver `.env.example`).

- O `docker-compose.yml` não guarda segredos: lê tudo do `.env` e para com mensagem clara se faltar senha ou `JWT_SECRET`.
- `JWT_SECRET` é obrigatório (mínimo 32 bytes); a API não sobe sem ele.
- O esquema do banco vem só das migrações Flyway (`ddl-auto=validate`).

## Dados iniciais (somente desenvolvimento)
Com `APP_SEED_ENABLED=true` (padrão no `.env.example`; desligado fora do Docker), na primeira execução o `DataInitializer` cria lojas, produtos, insumos e dois usuários de exemplo (`admin` e `operador.centro`). Troque as senhas antes de qualquer uso real.

## Estrutura
```
backend/    API Spring Boot (controller, service, repository, entity, dto, security, config)
frontend/   SPA React (api, components, hooks, pages)
docs/       Artefatos das macro entregas (PDFs): fase1/, fase2/
```

## Padrões
- Código e API em inglês; textos de interface em português.
- Mudança de banco apenas por nova migração Flyway (`V3__...`, `V4__...`).
- Frontend: somente componentes de `ui.jsx`; chamadas HTTP via `src/api/`.
- Commits semânticos (`feat`, `fix`, `docs`, `test`, `chore`, `refactor`); `main` só recebe código revisado.

## Documentação
| Fase | Artefatos |
|---|---|
| 1 — Concepção e Requisitos ([docs/fase1](docs/fase1)) | 01 Documento de Visão · 02 Especificação de Requisitos · 03 Histórias de Usuário · 04 Product Backlog · 05 Plano de Utilização de IA |
| 2 — Arquitetura e Modelagem ([docs/fase2](docs/fase2)) | 01 Documento de Arquitetura · 02 Diagramas de Modelagem · 03 Modelo de Dados · 04 Protótipos de Interface · 05 Estrutura Técnica · Planejamento e Checklist (interno) |
| 3 — Implementação e Testes | `TestCasePlan.md` e Registro de Utilização da IA (em produção) |

Os identificadores de risco (R01–R10) seguem o Documento de Arquitetura (fase 2, artefato 01).

## Equipe
Vandemberg Lucas Lima Melo (2112090004) · Ítalo de Farias Costa (2515050012) — Professor: Jeremias Araújo.
