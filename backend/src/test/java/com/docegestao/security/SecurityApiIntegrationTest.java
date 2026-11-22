package com.docegestao.security;

import com.docegestao.entity.*;
import com.docegestao.enums.Role;
import com.docegestao.repository.*;
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

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * API de ponta a ponta (MockMvc + MySQL real): autenticação, perfis (RN02),
 * isolamento por loja (RN01, RNF02) e CRUDs de cadastro.
 * Obs.: no MockMvc as rotas não levam o prefixo /api (context-path).
 */
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SecurityApiIntegrationTest extends MySqlIntegrationTest {

    static final String SENHA = "senha123";

    @Autowired MockMvc                   mvc;
    @Autowired ObjectMapper              json;
    @Autowired PasswordEncoder           encoder;
    @Autowired UserRepository            userRepository;
    @Autowired StoreRepository           storeRepository;
    @Autowired ProductRepository         productRepository;
    @Autowired IngredientRepository      ingredientRepository;
    @Autowired InventoryRepository       inventoryRepository;
    @Autowired IngredientStockRepository ingredientStockRepository;

    String tag;
    Store lojaA, lojaB;
    Product produto;
    Ingredient insumo;
    String admin, operador;   // tokens

    @BeforeAll
    void setUp() throws Exception {
        tag = UUID.randomUUID().toString().substring(0, 8);
        lojaA = store("Loja A " + tag);
        lojaB = store("Loja B " + tag);

        var p = new Product();
        p.setName("Bolo " + tag); p.setPrice(new BigDecimal("45.00"));
        produto = productRepository.save(p);

        var i = new Ingredient();
        i.setName("Farinha " + tag); i.setUnit("kg");
        insumo = ingredientRepository.save(i);

        for (var loja : new Store[]{lojaA, lojaB}) {
            var inv = new Inventory();
            inv.setStore(loja); inv.setProduct(produto); inv.setQuantity(5); inv.setMaxQuantity(10);
            inventoryRepository.save(inv);
            var st = new IngredientStock();
            st.setStore(loja); st.setIngredient(insumo); st.setQuantity(new BigDecimal("2.000"));
            ingredientStockRepository.save(st);
        }

        admin    = token(user("admin-" + tag, Role.ADMIN, null));
        operador = token(user("op-" + tag, Role.OPERATOR, lojaA));
    }

    // ─── Autenticação (RF01, RNF01, DEF-02) ──────────────────

    @Test
    @DisplayName("CT-SEG-01: sem token responde 401 em JSON")
    void semToken() throws Exception {
        mvc.perform(get("/stores/{id}/inventory", lojaA.getId()))
           .andExpect(status().isUnauthorized())
           .andExpect(jsonPath("$.status").value(401))
           .andExpect(jsonPath("$.message", containsString("Faça login")));
    }

    @Test
    @DisplayName("CT-SEG-02: token inválido responde 401 com 'Sessão expirada'")
    void tokenInvalido() throws Exception {
        mvc.perform(get("/stores/{id}/inventory", lojaA.getId()).header("Authorization", "Bearer abc.def.ghi"))
           .andExpect(status().isUnauthorized())
           .andExpect(jsonPath("$.message", containsString("Sessão expirada")));
    }

    @Test
    @DisplayName("CT-SEG-03: senha errada é recusada com mensagem em português")
    void senhaErrada() throws Exception {
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("username", "admin-" + tag, "password", "errada"))))
           .andExpect(status().isUnprocessableEntity())
           .andExpect(jsonPath("$.message").value("Usuário ou senha inválidos"));
    }

    @Test
    @DisplayName("CT-SEG-04: usuário desativado depois do login perde o acesso (401, não 500)")
    void usuarioDesativado() throws Exception {
        var u = user("inativo-" + tag, Role.OPERATOR, lojaA);
        var t = token(u);
        u.setActive(false);
        userRepository.save(u);

        as(t, get("/stores/{id}/inventory", lojaA.getId())).andExpect(status().isUnauthorized());
    }

    // ─── Isolamento por loja (RN01, RNF02) ───────────────────

    @Test
    @DisplayName("CT-SEG-05: operador ajusta estoque de produto da própria loja (RF07, DEF-01)")
    void operadorAjustaEstoqueProduto() throws Exception {
        as(operador, put("/stores/{s}/inventory/{p}", lojaA.getId(), produto.getId()), Map.of("quantity", 7))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.quantity").value(7));
    }

    @Test
    @DisplayName("CT-SEG-06: operador ajusta estoque de insumo da própria loja (RF08, DEF-01)")
    void operadorAjustaEstoqueInsumo() throws Exception {
        as(operador, put("/stores/{s}/ingredient-stock/{i}", lojaA.getId(), insumo.getId()), Map.of("quantity", 3.5))
           .andExpect(status().isOk());
    }

    @Test
    @DisplayName("CT-SEG-07: operador não lê estoque de outra loja, mesmo conhecendo a URL (403, DEF-08)")
    void operadorOutraLojaLeitura() throws Exception {
        as(operador, get("/stores/{id}/inventory", lojaB.getId()))
           .andExpect(status().isForbidden())
           .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("CT-SEG-08: operador não ajusta estoque nem vende em outra loja (403)")
    void operadorOutraLojaEscrita() throws Exception {
        as(operador, put("/stores/{s}/inventory/{p}", lojaB.getId(), produto.getId()), Map.of("quantity", 0))
           .andExpect(status().isForbidden());
        as(operador, post("/stores/{s}/sales", lojaB.getId()),
                Map.of("items", new Object[]{Map.of("productId", produto.getId(), "quantity", 1)}))
           .andExpect(status().isForbidden());
        assertQuantidade(lojaB, 5);
    }

    @Test
    @DisplayName("CT-SEG-09: administrador acessa qualquer loja")
    void adminQualquerLoja() throws Exception {
        as(admin, get("/stores/{id}/inventory", lojaB.getId())).andExpect(status().isOk());
    }

    @Test
    @DisplayName("CT-SEG-15: id de loja não numérico na URL responde 400 em português, não 500 (DEF-15)")
    void idDeLojaInvalido() throws Exception {
        as(admin, get("/stores/undefined/inventory"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.message").value("Parâmetro inválido: storeId."));
    }

    @Test
    @DisplayName("CT-SEG-16: administrador não consegue desativar o próprio usuário (DEF-21)")
    void adminNaoSeDesativa() throws Exception {
        var self = userRepository.findByUsernameAndActiveTrue("admin-" + tag).orElseThrow();
        as(admin, delete("/users/{id}", self.getId()))
           .andExpect(status().isUnprocessableEntity())
           .andExpect(jsonPath("$.message").value("Você não pode desativar o próprio usuário."));
        org.assertj.core.api.Assertions.assertThat(userRepository.findById(self.getId()).orElseThrow().getActive()).isTrue();
    }

    // ─── Perfis nos cadastros (RN02) ─────────────────────────

    @Test
    @DisplayName("CT-SEG-10: operador não edita loja; administrador edita (RF03, DEF-01 sem regressão)")
    void editarLoja() throws Exception {
        var body = Map.of("name", "Loja A " + tag, "address", "Rua Nova, 1");
        as(operador, put("/stores/{id}", lojaA.getId()), body).andExpect(status().isForbidden());
        as(admin,    put("/stores/{id}", lojaA.getId()), body)
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.address").value("Rua Nova, 1"));
    }

    @Test
    @DisplayName("CT-SEG-11: só o administrador cria produto (RF05)")
    void criarProduto() throws Exception {
        var body = Map.of("name", "Torta " + tag, "price", 30.0);
        as(operador, post("/products"), body).andExpect(status().isForbidden());
        as(admin,    post("/products"), body)
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.name").value("Torta " + tag));
    }

    @Test
    @DisplayName("CT-SEG-12: só o administrador cria insumo (RF06)")
    void criarInsumo() throws Exception {
        var body = Map.of("name", "Açúcar " + tag, "unit", "kg", "minQuantity", 1.0);
        as(operador, post("/ingredients"), body).andExpect(status().isForbidden());
        as(admin,    post("/ingredients"), body).andExpect(status().isCreated());
    }

    @Test
    @DisplayName("CT-SEG-13: ficha técnica: operador consulta, só o administrador altera (RF13, RN02)")
    void fichaTecnica() throws Exception {
        var body = Map.of("ingredientId", insumo.getId(), "quantity", 0.3, "unit", "kg");
        as(operador, put("/products/{p}/recipe/{i}", produto.getId(), insumo.getId()), body)
           .andExpect(status().isForbidden());
        as(admin, put("/products/{p}/recipe/{i}", produto.getId(), insumo.getId()), body)
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.quantity").value(0.3));
        as(operador, get("/products/{p}/recipe", produto.getId()))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$[0].ingredientId").value(insumo.getId()));
    }

    @Test
    @DisplayName("CT-SEG-14: gestão de usuários é exclusiva do administrador (RF19)")
    void usuarios() throws Exception {
        as(operador, get("/users")).andExpect(status().isForbidden());
        as(admin,    get("/users")).andExpect(status().isOk());
    }

    // ─── Regras de cadastro ──────────────────────────────────

    @Test
    @DisplayName("CT-CAD-01: nome de loja repetido, mesmo com outra caixa, é recusado (RN03)")
    void lojaDuplicada() throws Exception {
        as(admin, post("/stores"), Map.of("name", "Loja Dup " + tag)).andExpect(status().isCreated());
        as(admin, post("/stores"), Map.of("name", "LOJA DUP " + tag.toUpperCase()))
           .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("CT-CAD-02: preço zero é recusado com o campo indicado (RN04)")
    void precoZero() throws Exception {
        as(admin, post("/products"), Map.of("name", "Grátis " + tag, "price", 0))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.fields.price").exists());
    }

    @Test
    @DisplayName("CT-CAD-03: excluir produto apenas o desativa e o tira da listagem (RN05)")
    void desativarProduto() throws Exception {
        var p = new Product();
        p.setName("Descontinuado " + tag); p.setPrice(new BigDecimal("10.00"));
        p = productRepository.save(p);

        as(admin, delete("/products/{id}", p.getId())).andExpect(status().isNoContent());

        org.assertj.core.api.Assertions.assertThat(productRepository.findById(p.getId()))
                .get().extracting(Product::getActive).isEqualTo(false);
        as(admin, get("/products"))
           .andExpect(jsonPath("$[?(@.id == " + p.getId() + ")]").isEmpty());
    }

    // ─── helpers ─────────────────────────────────────────────

    private ResultActions as(String token, MockHttpServletRequestBuilder req) throws Exception {
        return mvc.perform(req.header("Authorization", "Bearer " + token));
    }

    private ResultActions as(String token, MockHttpServletRequestBuilder req, Object body) throws Exception {
        return as(token, req.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)));
    }

    private String token(User u) throws Exception {
        var res = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("username", u.getUsername(), "password", SENHA))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(res).get("token").asText();
    }

    private User user(String username, Role role, Store store) {
        var u = new User();
        u.setUsername(username);
        u.setPassword(encoder.encode(SENHA));
        u.setRole(role);
        u.setStore(store);
        u.setActive(true);
        return userRepository.save(u);
    }

    private Store store(String name) {
        var s = new Store();
        s.setName(name);
        return storeRepository.save(s);
    }

    private void assertQuantidade(Store loja, int esperado) {
        org.assertj.core.api.Assertions.assertThat(
                inventoryRepository.findByStoreIdAndProductId(loja.getId(), produto.getId()).orElseThrow().getQuantity())
                .isEqualTo(esperado);
    }
}
