-- ============================================================
--  V1 — Schema inicial do Doce Gestão
--  Flyway executa este arquivo uma única vez.
--  Nunca edite um arquivo já executado — crie V2, V3...
-- ============================================================

CREATE TABLE IF NOT EXISTS stores (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    address    VARCHAR(255),
    phone      VARCHAR(20),
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS products (
    id          BIGINT         NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100)   NOT NULL,
    description VARCHAR(255),
    price       DECIMAL(10, 2) NOT NULL,
    active      BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS ingredients (
    id           BIGINT         NOT NULL AUTO_INCREMENT,
    name         VARCHAR(100)   NOT NULL,
    unit         VARCHAR(20)    NOT NULL,
    min_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
    active       BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS inventory (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    store_id     BIGINT NOT NULL,
    product_id   BIGINT NOT NULL,
    quantity     INT    NOT NULL DEFAULT 0,
    max_quantity INT    NOT NULL DEFAULT 0,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_store_product (store_id, product_id),
    CONSTRAINT fk_inv_store   FOREIGN KEY (store_id)   REFERENCES stores(id),
    CONSTRAINT fk_inv_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS ingredient_stock (
    id            BIGINT         NOT NULL AUTO_INCREMENT,
    store_id      BIGINT         NOT NULL,
    ingredient_id BIGINT         NOT NULL,
    quantity      DECIMAL(10, 3) NOT NULL DEFAULT 0,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_store_ingredient (store_id, ingredient_id),
    CONSTRAINT fk_istock_store      FOREIGN KEY (store_id)      REFERENCES stores(id),
    CONSTRAINT fk_istock_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE TABLE IF NOT EXISTS sales (
    id       BIGINT         NOT NULL AUTO_INCREMENT,
    store_id BIGINT         NOT NULL,
    total    DECIMAL(10, 2) NOT NULL,
    sold_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes    VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT fk_sale_store FOREIGN KEY (store_id) REFERENCES stores(id)
);

CREATE TABLE IF NOT EXISTS sale_items (
    id         BIGINT         NOT NULL AUTO_INCREMENT,
    sale_id    BIGINT         NOT NULL,
    product_id BIGINT         NOT NULL,
    quantity   INT            NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_item_sale    FOREIGN KEY (sale_id)    REFERENCES sales(id),
    CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS users (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    username   VARCHAR(80)  NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('ADMIN','OPERATOR') NOT NULL DEFAULT 'OPERATOR',
    store_id   BIGINT,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_user_store FOREIGN KEY (store_id) REFERENCES stores(id)
);
