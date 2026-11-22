package com.docegestao.service;

import com.docegestao.dto.BatchItemRequest;
import com.docegestao.dto.FornadaRequest;
import com.docegestao.dto.IngredientAdjustment;
import com.docegestao.entity.*;
import com.docegestao.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

/**
 * Fornada multissabor (RF14, RF15, RF16; RN09 a RN13).
 *
 * Cenário: Bolo de Cenoura x2 e Bolo de Chocolate x3.
 *   Cenoura   = Farinha 0,300 kg + Ovos 0,250 dz (por unidade)
 *   Chocolate = Farinha 0,250 kg + Cacau 0,100 kg
 *   Consolidado: Farinha 1,350 kg (uma linha só) · Ovos 0,500 dz · Cacau 0,300 kg
 */
@ExtendWith(MockitoExtension.class)
class ProductionServiceTest {

    @Mock ProductionBatchRepository batchRepository;
    @Mock RecipeItemRepository      recipeItemRepository;
    @Mock IngredientStockRepository ingredientStockRepository;
    @Mock InventoryRepository       inventoryRepository;
    @Mock StoreService              storeService;
    @Mock ProductService            productService;
    @Mock UserRepository            userRepository;

    @InjectMocks ProductionService productionService;

    Store loja;
    Product cenoura, chocolate, brigadeiro;
    Ingredient farinha, ovos, cacau;
    IngredientStock estFarinha, estOvos, estCacau;
    Inventory invCenoura, invChocolate;
    List<RecipeItem> fichas;

    @BeforeEach
    void setUp() {
        loja       = SaleServiceTest.store(1L, "Loja Centro");
        cenoura    = SaleServiceTest.product(10L, "Bolo de Cenoura", "45.00");
        chocolate  = SaleServiceTest.product(20L, "Bolo de Chocolate", "55.00");
        brigadeiro = SaleServiceTest.product(30L, "Brigadeiro (6un)", "18.00");

        farinha = ingredient(100L, "Farinha de Trigo", "kg");
        ovos    = ingredient(200L, "Ovos", "dúzia");
        cacau   = ingredient(300L, "Chocolate em Pó", "kg");

        fichas = new ArrayList<>(List.of(
                recipe(cenoura,   farinha, "0.300"),
                recipe(cenoura,   ovos,    "0.250"),
                recipe(chocolate, farinha, "0.250"),
                recipe(chocolate, cacau,   "0.100")));

        estFarinha = stock(farinha, "5.000");
        estOvos    = stock(ovos,    "3.000");
        estCacau   = stock(cacau,   "1.000");
        invCenoura   = inventory(cenoura, 3);
        invChocolate = inventory(chocolate, 1);

        // Fixture compartilhada: nem todo teste chega a consultar todos os repositórios
        lenient().when(storeService.getOrThrow(1L)).thenReturn(loja);
        lenient().when(productService.getOrThrow(10L)).thenReturn(cenoura);
        lenient().when(productService.getOrThrow(20L)).thenReturn(chocolate);
        lenient().when(productService.getOrThrow(30L)).thenReturn(brigadeiro);
        lenient().when(recipeItemRepository.findByProductIds(anyList())).thenAnswer(inv -> {
            List<Long> ids = inv.getArgument(0);
            return fichas.stream().filter(r -> ids.contains(r.getProduct().getId())).toList();
        });
        lenient().when(ingredientStockRepository.findByStoreId(1L)).thenReturn(List.of(estFarinha, estOvos, estCacau));
        lenient().when(inventoryRepository.findByStoreId(1L)).thenReturn(new ArrayList<>(List.of(invCenoura, invChocolate)));
        lenient().when(batchRepository.save(any(ProductionBatch.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    // ─── Preview (RF15) ──────────────────────────────────────

    @Test
    @DisplayName("CT-PRO-01: preview consolida insumo comum a vários sabores em uma linha (RN09, RF15)")
    void previewConsolida() {
        var p = productionService.preview(1L, List.of(item(10L, 2), item(20L, 3)));

        assertThat(p.missingRecipe).isFalse();
        assertThat(p.totalItems).isEqualTo(5);
        assertThat(p.flavors).isEqualTo(2);
        assertThat(p.ingredients).hasSize(3);
        var linhaFarinha = p.ingredients.stream().filter(i -> i.ingredientId.equals(100L)).findFirst().orElseThrow();
        assertThat(linhaFarinha.suggestedQty).isEqualByComparingTo("1.350");
        assertThat(linhaFarinha.stockAvailable).isEqualByComparingTo("5.000");
        assertThat(p.ingredients).noneMatch(i -> i.insufficient);
    }

    @Test
    @DisplayName("CT-PRO-02: preview marca insumo insuficiente sem gravar nada")
    void previewInsuficiente() {
        estCacau.setQuantity(new BigDecimal("0.200"));

        var p = productionService.preview(1L, List.of(item(10L, 2), item(20L, 3)));

        var linhaCacau = p.ingredients.stream().filter(i -> i.ingredientId.equals(300L)).findFirst().orElseThrow();
        assertThat(linhaCacau.insufficient).isTrue();
        verify(ingredientStockRepository, never()).save(any());
        verify(batchRepository, never()).save(any());
    }

    @Test
    @DisplayName("CT-PRO-03: preview com sabor sem ficha técnica avisa e lista o sabor (RN13)")
    void previewSaborSemFicha() {
        var p = productionService.preview(1L, List.of(item(10L, 2), item(30L, 4)));

        assertThat(p.missingRecipe).isTrue();
        assertThat(p.productsWithoutRecipe).containsExactly("Brigadeiro (6un)");
    }

    // ─── Registro (RF14) ─────────────────────────────────────

    @Test
    @DisplayName("CT-PRO-04: fornada abate o consolidado dos insumos e soma as unidades ao estoque (RN09, RN11)")
    void registraFornada() {
        var resp = productionService.register(1L, fornada(List.of(item(10L, 2), item(20L, 3)), null));

        assertThat(estFarinha.getQuantity()).isEqualByComparingTo("3.650");
        assertThat(estOvos.getQuantity()).isEqualByComparingTo("2.500");
        assertThat(estCacau.getQuantity()).isEqualByComparingTo("0.700");
        assertThat(invCenoura.getQuantity()).isEqualTo(5);
        assertThat(invChocolate.getQuantity()).isEqualTo(4);

        assertThat(resp.totalItems).isEqualTo(5);
        assertThat(resp.items).hasSize(2);
        assertThat(resp.ingredientUsages).hasSize(3)
                .allSatisfy(u -> assertThat(u.actualQty).isEqualByComparingTo(u.suggestedQty));
    }

    @Test
    @DisplayName("CT-PRO-05: com um insumo em falta nada é abatido e a mensagem diz o que falta (RN10, RNF05)")
    void failFast() {
        estCacau.setQuantity(new BigDecimal("0.200"));

        assertThatThrownBy(() -> productionService.register(1L, fornada(List.of(item(10L, 2), item(20L, 3)), null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Chocolate em Pó")
                .hasMessageContaining("0,300").hasMessageContaining("0,200");

        assertThat(estFarinha.getQuantity()).isEqualByComparingTo("5.000");
        assertThat(estOvos.getQuantity()).isEqualByComparingTo("3.000");
        assertThat(invCenoura.getQuantity()).isEqualTo(3);
        verifyNoWrites();
    }

    @Test
    @DisplayName("CT-PRO-06: desvio informado prevalece no abatimento e os dois valores ficam registrados (RN12, RF16)")
    void desvio() {
        var resp = productionService.register(1L,
                fornada(List.of(item(10L, 2), item(20L, 3)), List.of(ajuste(100L, "1.500"))));

        assertThat(estFarinha.getQuantity()).isEqualByComparingTo("3.500");
        var usoFarinha = resp.ingredientUsages.stream().filter(u -> u.ingredientId.equals(100L)).findFirst().orElseThrow();
        assertThat(usoFarinha.suggestedQty).isEqualByComparingTo("1.350");
        assertThat(usoFarinha.actualQty).isEqualByComparingTo("1.500");
        assertThat(usoFarinha.deviation).isEqualByComparingTo("0.150");
    }

    @Test
    @DisplayName("CT-PRO-07: desvio acima do estoque também bloqueia a fornada (RN10)")
    void desvioAcimaDoEstoque() {
        assertThatThrownBy(() -> productionService.register(1L,
                fornada(List.of(item(10L, 2)), List.of(ajuste(200L, "3.500")))))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Ovos");
        verifyNoWrites();
    }

    @Test
    @DisplayName("CT-PRO-08: desvio negativo é recusado e não aumenta o estoque (DEF-04)")
    void desvioNegativo() {
        assertThatThrownBy(() -> productionService.register(1L,
                fornada(List.of(item(10L, 2)), List.of(ajuste(100L, "-2.000")))))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("não pode ser negativa");

        assertThat(estFarinha.getQuantity()).isEqualByComparingTo("5.000");
        verifyNoWrites();
    }

    @Test
    @DisplayName("CT-PRO-09: desvio sem quantidade é recusado com 422, não 500 (DEF-04)")
    void desvioNulo() {
        assertThatThrownBy(() -> productionService.register(1L,
                fornada(List.of(item(10L, 2)), List.of(ajuste(100L, null)))))
                .isInstanceOf(BusinessException.class);
        verifyNoWrites();
    }

    @Test
    @DisplayName("CT-PRO-10: desvio de insumo fora da ficha técnica é recusado")
    void desvioForaDaFicha() {
        assertThatThrownBy(() -> productionService.register(1L,
                fornada(List.of(item(10L, 2)), List.of(ajuste(300L, "0.100")))))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ficha técnica");
        verifyNoWrites();
    }

    @Test
    @DisplayName("CT-PRO-11: fornada mista com sabor sem ficha técnica é recusada e cita o sabor (RN13, DEF-05)")
    void saborSemFichaNaFornadaMista() {
        assertThatThrownBy(() -> productionService.register(1L, fornada(List.of(item(10L, 2), item(30L, 4)), null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Brigadeiro (6un)");

        assertThat(estFarinha.getQuantity()).isEqualByComparingTo("5.000");
        verifyNoWrites();
    }

    @Test
    @DisplayName("CT-PRO-12: fornada sem nenhuma ficha técnica é recusada (RN13)")
    void nenhumSaborComFicha() {
        assertThatThrownBy(() -> productionService.register(1L, fornada(List.of(item(30L, 4)), null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Sem Ficha Técnica");
        verifyNoWrites();
    }

    @Test
    @DisplayName("CT-PRO-13: produto sem registro de estoque na loja ganha o registro com as unidades produzidas (RN11, DEF-06)")
    void criaEstoqueDoProduto() {
        when(inventoryRepository.findByStoreId(1L)).thenReturn(new ArrayList<>(List.of(invCenoura)));

        productionService.register(1L, fornada(List.of(item(20L, 3)), null));

        var captor = ArgumentCaptor.forClass(Inventory.class);
        verify(inventoryRepository).save(captor.capture());
        var criado = captor.getValue();
        assertThat(criado.getProduct()).isSameAs(chocolate);
        assertThat(criado.getStore()).isSameAs(loja);
        assertThat(criado.getQuantity()).isEqualTo(3);
    }

    @Test
    @DisplayName("CT-PRO-14: register é transacional, condição da atomicidade da fornada (RNF06)")
    void registerEhTransacional() throws NoSuchMethodException {
        var m = ProductionService.class.getMethod("register", Long.class, FornadaRequest.class);
        assertThat(m.isAnnotationPresent(Transactional.class)).isTrue();
    }

    // ─── helpers ─────────────────────────────────────────────

    private void verifyNoWrites() {
        verify(ingredientStockRepository, never()).save(any());
        verify(inventoryRepository, never()).save(any());
        verify(batchRepository, never()).save(any());
    }

    static Ingredient ingredient(Long id, String name, String unit) {
        var i = new Ingredient();
        i.setId(id); i.setName(name); i.setUnit(unit);
        return i;
    }

    static RecipeItem recipe(Product p, Ingredient i, String qty) {
        var r = new RecipeItem();
        r.setProduct(p); r.setIngredient(i);
        r.setQuantity(new BigDecimal(qty)); r.setUnit(i.getUnit());
        return r;
    }

    private IngredientStock stock(Ingredient i, String qty) {
        var s = new IngredientStock();
        s.setStore(loja); s.setIngredient(i); s.setQuantity(new BigDecimal(qty));
        return s;
    }

    private Inventory inventory(Product p, int qty) {
        var i = new Inventory();
        i.setStore(loja); i.setProduct(p); i.setQuantity(qty); i.setMaxQuantity(10);
        return i;
    }

    static BatchItemRequest item(Long productId, int qty) {
        var b = new BatchItemRequest();
        b.setProductId(productId); b.setQuantity(qty);
        return b;
    }

    static IngredientAdjustment ajuste(Long ingredientId, String qty) {
        var a = new IngredientAdjustment();
        a.setIngredientId(ingredientId);
        a.setActualQty(qty == null ? null : new BigDecimal(qty));
        return a;
    }

    static FornadaRequest fornada(List<BatchItemRequest> items, List<IngredientAdjustment> ajustes) {
        var f = new FornadaRequest();
        f.setItems(items); f.setAdjustments(ajustes);
        return f;
    }
}
