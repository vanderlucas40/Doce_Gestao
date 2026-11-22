package com.docegestao.controller;

import com.docegestao.dto.SaleItemRequest;
import com.docegestao.dto.SaleRequest;
import com.docegestao.entity.*;
import com.docegestao.enums.Role;
import com.docegestao.repository.*;
import com.docegestao.service.SaleService;
import com.docegestao.support.MySqlIntegrationTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Movimentações de estoque (motivo do ajuste) e paginação de vendas (R06, R10). */
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class MovementsAndPagingApiIntegrationTest extends MySqlIntegrationTest {

    @Autowired MockMvc                   mvc;
    @Autowired ObjectMapper              json;
    @Autowired PasswordEncoder           encoder;
    @Autowired SaleService               saleService;
    @Autowired UserRepository            userRepository;
    @Autowired StoreRepository           storeRepository;
    @Autowired ProductRepository         productRepository;
    @Autowired IngredientRepository      ingredientRepository;
    @Autowired InventoryRepository       inventoryRepository;
    @Autowired IngredientStockRepository ingredientStockRepository;

    String tag, operador;
    Store loja, lojaVendas;
    Product produto;
    Ingredient insumo;

    @BeforeAll
    void setUp() throws Exception {
        tag = UUID.randomUUID().toString().substring(0, 8);
        loja       = store("Loja Mov " + tag);
        lojaVendas = store("Loja Vendas " + tag);

        var p = new Product();
        p.setName("Bolo " + tag); p.setPrice(new BigDecimal("10.00"));
        produto = productRepository.save(p);
        var i = new Ingredient();
        i.setName("Farinha " + tag); i.setUnit("kg");
        insumo = ingredientRepository.save(i);

        inventory(loja, 5);
        inventory(lojaVendas, 50);
        var st = new IngredientStock();
        st.setStore(loja); st.setIngredient(insumo); st.setQuantity(new BigDecimal("2.000"));
        ingredientStockRepository.save(st);

        var u = new User();
        u.setUsername("op-mov-" + tag); u.setPassword(encoder.encode("senha123"));
        u.setRole(Role.OPERATOR); u.setStore(loja); u.setActive(true);
        userRepository.save(u);
        operador = token(u.getUsername());

        // 5 vendas na loja de vendas: totais 10, 20, 30, 40, 50 (a última é a mais recente)
        for (int q = 1; q <= 5; q++) saleService.register(lojaVendas.getId(), request(item(produto.getId(), q)));
    }

    @Test
    @DisplayName("CT-EST-04: ajustes manuais gravam motivo, autor e saldo anterior/novo (R10)")
    void ajusteGravaMovimentacao() throws Exception {
        as(operador, put("/stores/{s}/inventory/{p}", loja.getId(), produto.getId()),
                Map.of("quantity", 3, "reason", "Avaria / Perda")).andExpect(status().isOk());
        as(operador, put("/stores/{s}/ingredient-stock/{i}", loja.getId(), insumo.getId()),
                Map.of("quantity", 4.5, "reason", "Inventário Periódico")).andExpect(status().isOk());

        as(operador, get("/stores/{s}/stock-movements", loja.getId()))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.totalElements").value(2))
           // mais recente primeiro: o ajuste do insumo
           .andExpect(jsonPath("$.content[0].itemType").value("INGREDIENT"))
           .andExpect(jsonPath("$.content[0].reason").value("Inventário Periódico"))
           .andExpect(jsonPath("$.content[0].previousQty").value(2.0))
           .andExpect(jsonPath("$.content[0].newQty").value(4.5))
           .andExpect(jsonPath("$.content[1].itemType").value("PRODUCT"))
           .andExpect(jsonPath("$.content[1].itemName").value("Bolo " + tag))
           .andExpect(jsonPath("$.content[1].difference").value(-2.0))
           .andExpect(jsonPath("$.content[1].reason").value("Avaria / Perda"))
           .andExpect(jsonPath("$.content[1].username").value("op-mov-" + tag));
    }

    @Test
    @DisplayName("CT-EST-05: operador não vê movimentações de outra loja (403)")
    void movimentacoesOutraLoja() throws Exception {
        as(operador, get("/stores/{s}/stock-movements", lojaVendas.getId())).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("CT-VEN-15: vendas paginadas no banco, mais recentes primeiro (R06)")
    void vendasPaginadas() throws Exception {
        var admin = adminToken();
        as(admin, get("/stores/{s}/sales", lojaVendas.getId()).param("page", "0").param("size", "2"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.content", hasSize(2)))
           .andExpect(jsonPath("$.totalElements").value(5))
           .andExpect(jsonPath("$.totalPages").value(3))
           .andExpect(jsonPath("$.content[0].total").value(50.0))
           .andExpect(jsonPath("$.content[1].total").value(40.0));

        as(admin, get("/stores/{s}/sales", lojaVendas.getId()).param("page", "2").param("size", "2"))
           .andExpect(jsonPath("$.content", hasSize(1)))
           .andExpect(jsonPath("$.content[0].total").value(10.0))
           .andExpect(jsonPath("$.content[0].items", hasSize(1)));
    }

    @Test
    @DisplayName("CT-VEN-16: tamanho de página acima de 100 é limitado a 100")
    void tamanhoMaximo() throws Exception {
        as(adminToken(), get("/stores/{s}/sales", lojaVendas.getId()).param("size", "5000"))
           .andExpect(jsonPath("$.size").value(100));
    }

    // ─── helpers ─────────────────────────────────────────────

    private String adminToken() throws Exception {
        var username = "admin-mov-" + tag;
        if (userRepository.findByUsernameAndActiveTrue(username).isEmpty()) {
            var u = new User();
            u.setUsername(username); u.setPassword(encoder.encode("senha123"));
            u.setRole(Role.ADMIN); u.setActive(true);
            userRepository.save(u);
        }
        return token(username);
    }

    private ResultActions as(String token, MockHttpServletRequestBuilder req) throws Exception {
        return mvc.perform(req.header("Authorization", "Bearer " + token));
    }

    private ResultActions as(String token, MockHttpServletRequestBuilder req, Object body) throws Exception {
        return as(token, req.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)));
    }

    private String token(String username) throws Exception {
        var res = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("username", username, "password", "senha123"))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(res).get("token").asText();
    }

    private static SaleRequest request(SaleItemRequest... items) {
        var r = new SaleRequest();
        r.setItems(java.util.List.of(items));
        return r;
    }

    private static SaleItemRequest item(Long productId, int qty) {
        var i = new SaleItemRequest();
        i.setProductId(productId);
        i.setQuantity(qty);
        return i;
    }

    private Store store(String name) {
        var s = new Store();
        s.setName(name);
        return storeRepository.save(s);
    }

    private void inventory(Store s, int qty) {
        var inv = new Inventory();
        inv.setStore(s); inv.setProduct(produto); inv.setQuantity(qty); inv.setMaxQuantity(50);
        inventoryRepository.save(inv);
    }
}
