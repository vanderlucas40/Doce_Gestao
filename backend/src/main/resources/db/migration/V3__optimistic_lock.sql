-- ============================================================
--  V3 — Bloqueio otimista no estoque (R04)
--  Coluna de versão para o @Version do JPA: duas operações que
--  leem o mesmo saldo não conseguem gravar ambas por cima.
-- ============================================================

ALTER TABLE inventory        ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE ingredient_stock ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
