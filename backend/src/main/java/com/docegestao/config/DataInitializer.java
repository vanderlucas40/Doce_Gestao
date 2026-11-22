package com.docegestao.config;

import com.docegestao.entity.*;
import com.docegestao.enums.Role;
import com.docegestao.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Popula o banco com dados iniciais se estiver vazio.
 * Executado uma única vez na inicialização da aplicação.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository         userRepository;
    private final StoreRepository        storeRepository;
    private final ProductRepository      productRepository;
    private final IngredientRepository   ingredientRepository;
    private final InventoryRepository    inventoryRepository;
    private final IngredientStockRepository ingredientStockRepository;
    private final PasswordEncoder        passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0 && storeRepository.count() > 0) {
            log.info("Banco já populado — DataInitializer ignorado.");
            return;
        }

        log.info("Banco vazio detectado. Inserindo dados iniciais...");

        // ── Lojas ───────────────────────────────────────────
        var centro = store("Loja Centro", "Rua das Flores, 120", "(83) 99999-0001");
        var norte  = store("Loja Norte",  "Av. Presidente, 55",  "(83) 99999-0002");
        var sul    = store("Loja Sul",    "Rua Caruaru, 8",      "(83) 99999-0003");

        // ── Produtos ─────────────────────────────────────────
        var cenoura   = product("Bolo de Cenoura",   "Com cobertura de chocolate",   new BigDecimal("45.00"));
        var chocolate = product("Bolo de Chocolate", "Massa fofinha com ganache",     new BigDecimal("55.00"));
        var brigadeiro= product("Brigadeiro (6un)",  "Bandeja com 6 brigadeiros",    new BigDecimal("18.00"));
        var paoDeMel  = product("Pão de Mel (4un)",  "Recheado com doce de leite",   new BigDecimal("24.00"));

        // ── Insumos ──────────────────────────────────────────
        var farinha   = ingredient("Farinha de Trigo",  "kg",    new BigDecimal("5.0"));
        var cacau     = ingredient("Chocolate em Pó",   "kg",    new BigDecimal("2.0"));
        var leite     = ingredient("Leite Condensado",  "lata",  new BigDecimal("10.0"));
        var ovos      = ingredient("Ovos",              "dúzia", new BigDecimal("4.0"));
        var acucar    = ingredient("Açúcar",            "kg",    new BigDecimal("5.0"));

        // ── Estoque de produtos por loja ─────────────────────
        inventory(centro, cenoura,    3, 8);
        inventory(centro, chocolate,  1, 8);
        inventory(centro, brigadeiro, 12, 20);
        inventory(centro, paoDeMel,   0, 10);

        inventory(norte,  cenoura,    4, 8);
        inventory(norte,  chocolate,  2, 8);
        inventory(norte,  brigadeiro, 8, 20);
        inventory(norte,  paoDeMel,   5, 10);

        inventory(sul,    cenoura,    5, 8);
        inventory(sul,    chocolate,  0, 8);
        inventory(sul,    brigadeiro, 3, 20);
        inventory(sul,    paoDeMel,   2, 10);

        // ── Estoque de insumos por loja ──────────────────────
        istock(centro, farinha,  "8.5");  istock(centro, cacau,  "1.2");
        istock(centro, leite,   "24.0");  istock(centro, ovos,   "3.0");
        istock(centro, acucar,   "9.0");

        istock(norte,  farinha,  "3.0");  istock(norte,  cacau,  "5.0");
        istock(norte,  leite,   "12.0");  istock(norte,  ovos,   "6.0");
        istock(norte,  acucar,   "4.0");

        istock(sul,    farinha, "10.0");  istock(sul,    cacau,  "2.5");
        istock(sul,    leite,   "8.0");   istock(sul,    ovos,   "5.0");
        istock(sul,    acucar,  "3.5");

        // ── Usuários ─────────────────────────────────────────
        var admin = new User();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole(Role.ADMIN);
        admin.setActive(true);
        userRepository.save(admin);

        var op = new User();
        op.setUsername("operador.centro");
        op.setPassword(passwordEncoder.encode("operador123"));
        op.setRole(Role.OPERATOR);
        op.setStore(centro);
        op.setActive(true);
        userRepository.save(op);

        log.info("✅ Dados iniciais inseridos com sucesso!");
        log.info("   admin         / admin123");
        log.info("   operador.centro / operador123");
    }

    // ─── helpers privados ────────────────────────────────────

    private Store store(String name, String address, String phone) {
        var s = new Store();
        s.setName(name); s.setAddress(address); s.setPhone(phone);
        return storeRepository.save(s);
    }

    private Product product(String name, String desc, BigDecimal price) {
        var p = new Product();
        p.setName(name); p.setDescription(desc); p.setPrice(price);
        return productRepository.save(p);
    }

    private Ingredient ingredient(String name, String unit, BigDecimal min) {
        var i = new Ingredient();
        i.setName(name); i.setUnit(unit); i.setMinQuantity(min);
        return ingredientRepository.save(i);
    }

    private void inventory(Store store, Product product, int qty, int max) {
        var inv = new Inventory();
        inv.setStore(store); inv.setProduct(product);
        inv.setQuantity(qty); inv.setMaxQuantity(max);
        inventoryRepository.save(inv);
    }

    private void istock(Store store, Ingredient ingredient, String qty) {
        var s = new IngredientStock();
        s.setStore(store); s.setIngredient(ingredient);
        s.setQuantity(new BigDecimal(qty));
        ingredientStockRepository.save(s);
    }
}
