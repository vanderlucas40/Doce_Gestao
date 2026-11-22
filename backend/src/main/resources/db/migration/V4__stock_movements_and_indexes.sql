-- ============================================================
--  V4 — Movimentações de estoque e índices de consulta
--  * stock_movements: trilha dos ajustes manuais (quem, quando,
--    de quanto para quanto e por quê) — antes o motivo escolhido
--    na tela Estoque era descartado (R10).
--  * Índices compostos recomendados no Modelo de Dados para as
--    consultas por loja e período.
-- ============================================================

CREATE TABLE stock_movements (
    id            BIGINT         NOT NULL AUTO_INCREMENT,
    store_id      BIGINT         NOT NULL,
    item_type     ENUM('PRODUCT','INGREDIENT') NOT NULL,
    product_id    BIGINT         NULL,
    ingredient_id BIGINT         NULL,
    previous_qty  DECIMAL(10, 3) NOT NULL,
    new_qty       DECIMAL(10, 3) NOT NULL,
    reason        VARCHAR(255)   NULL,
    user_id       BIGINT         NULL,
    created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_movements_store_created (store_id, created_at),
    CONSTRAINT fk_mov_store      FOREIGN KEY (store_id)      REFERENCES stores(id),
    CONSTRAINT fk_mov_product    FOREIGN KEY (product_id)    REFERENCES products(id),
    CONSTRAINT fk_mov_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
    CONSTRAINT fk_mov_user       FOREIGN KEY (user_id)       REFERENCES users(id)
);

CREATE INDEX idx_sales_store_sold_at         ON sales (store_id, sold_at);
CREATE INDEX idx_batches_store_produced_at   ON production_batches (store_id, produced_at);
