package com.docegestao.service;

import com.docegestao.entity.*;
import com.docegestao.repository.*;
import com.docegestao.support.MySqlIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static com.docegestao.service.ProductionServiceTest.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Fornada contra MySQL real: persistência, histórico (RF20) e rollback (RNF06). */
class ProductionServiceIntegrationTest extends MySqlIntegrationTest {

    @Autowired ProductionService         productionService;
    @Autowired StoreRepository           storeRepository;
    @Autowired ProductRepository         productRepository;
    @Autowired IngredientRepository      ingredientRepository;
    @Autowired IngredientStockRepository ingredientStockRepository;
    @Autowired RecipeItemRepository      recipeItemRepository;
    @Autowired InventoryRepository       inventoryRepository;

    Store loja;
    Product cenoura, chocolate;
    Ingredient farinha, cacau;

    @BeforeEach
    void setUp() {
        var tag = UUID.randomUUID().toString().substring(0, 8);
        var s = new Store();
        s.setName("Loja Fornada " + tag);
        loja = storeRepository.save(s);

        cenoura   = productRepository.save(SaleServiceTest.product(null, "Cenoura " + tag, "45.00"));
        chocolate = productRepository.save(SaleServiceTest.product(null, "Chocolate " + tag, "55.00"));
        farinha   = ingredientRepository.save(ingredient(null, "Farinha " + tag, "kg"));
        cacau     = ingredientRepository.save(ingredient(null, "Cacau " + tag, "kg"));

        recipeItemRepository.saveAll(List.of(
                recipe(cenoura, farinha, "0.300"),
                recipe(chocolate, farinha, "0.250"),
                recipe(chocolate, cacau, "0.100")));

        stock(farinha, "5.000");
        stock(cacau, "1.000");
        var inv = new Inventory();
        inv.setStore(loja); inv.setProduct(cenoura); inv.setQuantity(2); inv.setMaxQuantity(10);
        inventoryRepository.save(inv);
        // chocolate sem registro de estoque na loja: deve ser criado pela fornada (RN11)
    }

    @Test
    @DisplayName("CT-PRO-15: fornada persiste insumos abatidos, estoque de produtos e histórico com sugerido x real (RF14, RF20)")
    void fornadaPersistida() {
        productionService.register(loja.getId(),
                fornada(List.of(item(cenoura.getId(), 2), item(chocolate.getId(), 3)),
                        List.of(ajuste(cacau.getId(), "0.350"))));

        assertThat(qtdInsumo(farinha)).isEqualByComparingTo("3.650");   // 0,6 + 0,75
        assertThat(qtdInsumo(cacau)).isEqualByComparingTo("0.650");     // desvio: 0,35 no lugar de 0,30
        assertThat(qtdProduto(cenoura)).isEqualTo(4);
        assertThat(qtdProduto(chocolate)).isEqualTo(3);

        var historico = productionService.findByStore(loja.getId());
        assertThat(historico).hasSize(1);
        var usoCacau = historico.get(0).ingredientUsages.stream()
                .filter(u -> u.ingredientId.equals(cacau.getId())).findFirst().orElseThrow();
        assertThat(usoCacau.suggestedQty).isEqualByComparingTo("0.300");
        assertThat(usoCacau.actualQty).isEqualByComparingTo("0.350");
    }

    @Test
    @DisplayName("CT-PRO-16: fornada recusada não altera nenhum estoque nem grava histórico (RN10, RNF06)")
    void fornadaRecusadaNaoGrava() {
        assertThatThrownBy(() -> productionService.register(loja.getId(),
                fornada(List.of(item(cenoura.getId(), 2), item(chocolate.getId(), 20)), null)))
                .isInstanceOf(BusinessException.class);

        assertThat(qtdInsumo(farinha)).isEqualByComparingTo("5.000");
        assertThat(qtdInsumo(cacau)).isEqualByComparingTo("1.000");
        assertThat(qtdProduto(cenoura)).isEqualTo(2);
        assertThat(productionService.findByStore(loja.getId())).isEmpty();
    }

    private BigDecimal qtdInsumo(Ingredient i) {
        return ingredientStockRepository.findByStoreId(loja.getId()).stream()
                .filter(s -> s.getIngredient().getId().equals(i.getId()))
                .findFirst().orElseThrow().getQuantity();
    }

    private int qtdProduto(Product p) {
        return inventoryRepository.findByStoreIdAndProductId(loja.getId(), p.getId()).orElseThrow().getQuantity();
    }

    private void stock(Ingredient i, String qty) {
        var s = new IngredientStock();
        s.setStore(loja); s.setIngredient(i); s.setQuantity(new BigDecimal(qty));
        ingredientStockRepository.save(s);
    }
}
