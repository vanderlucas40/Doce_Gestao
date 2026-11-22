-- ============================================================
--  V2 — Módulo de Fornada (Produção em Lote)
--  Cria: recipe_items, production_batches, batch_items
-- ============================================================

-- ------------------------------------------------------------
-- Ficha Técnica: ingredientes necessários por unidade de produto
-- Ex: Bolo de Cenoura (1 un) → 500g farinha, 200g açúcar, 3 ovos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_items (
    id            BIGINT         NOT NULL AUTO_INCREMENT,
    product_id    BIGINT         NOT NULL COMMENT 'produto (sabor de bolo)',
    ingredient_id BIGINT         NOT NULL COMMENT 'insumo necessário',
    quantity      DECIMAL(10, 4) NOT NULL COMMENT 'quantidade do insumo por 1 unidade do produto',
    unit          VARCHAR(20)    NOT NULL COMMENT 'unidade da quantidade (kg, litro, unidade...)',
    created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_recipe_product_ingredient (product_id, ingredient_id),
    CONSTRAINT fk_recipe_product    FOREIGN KEY (product_id)    REFERENCES products(id),
    CONSTRAINT fk_recipe_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

-- ------------------------------------------------------------
-- Fornada (cabeçalho do lote de produção)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production_batches (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    store_id      BIGINT       NOT NULL,
    status        ENUM('PLANNED','IN_PROGRESS','COMPLETED','CANCELLED')
                               NOT NULL DEFAULT 'COMPLETED',
    notes         VARCHAR(500),
    produced_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by    BIGINT       COMMENT 'user_id do padeiro',
    total_items   INT          NOT NULL DEFAULT 0 COMMENT 'total de unidades produzidas',
    PRIMARY KEY (id),
    CONSTRAINT fk_batch_store FOREIGN KEY (store_id)    REFERENCES stores(id),
    CONSTRAINT fk_batch_user  FOREIGN KEY (created_by)  REFERENCES users(id)
);

-- ------------------------------------------------------------
-- Itens da Fornada: qual sabor, quantas unidades
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS batch_items (
    id            BIGINT NOT NULL AUTO_INCREMENT,
    batch_id      BIGINT NOT NULL,
    product_id    BIGINT NOT NULL,
    quantity      INT    NOT NULL DEFAULT 1 COMMENT 'unidades produzidas deste sabor',
    PRIMARY KEY (id),
    CONSTRAINT fk_bitem_batch   FOREIGN KEY (batch_id)   REFERENCES production_batches(id),
    CONSTRAINT fk_bitem_product FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ------------------------------------------------------------
-- Consumo Real de Insumos por Fornada
-- Registra o que foi realmente consumido (com ajuste de desvio)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS batch_ingredient_usage (
    id            BIGINT         NOT NULL AUTO_INCREMENT,
    batch_id      BIGINT         NOT NULL,
    ingredient_id BIGINT         NOT NULL,
    suggested_qty DECIMAL(10, 4) NOT NULL COMMENT 'quantidade calculada pela ficha técnica',
    actual_qty    DECIMAL(10, 4) NOT NULL COMMENT 'quantidade real usada (com desvio)',
    unit          VARCHAR(20)    NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_usage_batch      FOREIGN KEY (batch_id)      REFERENCES production_batches(id),
    CONSTRAINT fk_usage_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);
