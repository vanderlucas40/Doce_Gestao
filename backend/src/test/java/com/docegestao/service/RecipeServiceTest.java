package com.docegestao.service;

import com.docegestao.dto.RecipeItemRequest;
import com.docegestao.entity.RecipeItem;
import com.docegestao.repository.RecipeItemRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static com.docegestao.service.ProductionServiceTest.ingredient;
import static com.docegestao.service.ProductionServiceTest.recipe;
import static com.docegestao.service.SaleServiceTest.product;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Ficha técnica (RF13): um item por par produto + insumo. */
@ExtendWith(MockitoExtension.class)
class RecipeServiceTest {

    @Mock RecipeItemRepository recipeItemRepository;
    @Mock ProductService       productService;
    @Mock IngredientService    ingredientService;

    @InjectMocks RecipeService recipeService;

    @Test
    @DisplayName("CT-FIC-01: insumo novo na ficha cria o item com quantidade e unidade")
    void criaItem() {
        var p = product(10L, "Bolo de Cenoura", "45.00");
        var i = ingredient(100L, "Farinha de Trigo", "kg");
        when(productService.getOrThrow(10L)).thenReturn(p);
        when(ingredientService.getOrThrow(100L)).thenReturn(i);
        when(recipeItemRepository.findByProductIdAndIngredientId(10L, 100L)).thenReturn(Optional.empty());
        when(recipeItemRepository.save(any(RecipeItem.class))).thenAnswer(inv -> inv.getArgument(0));

        var resp = recipeService.upsert(10L, req(100L, "0.300", "kg"));

        assertThat(resp.ingredientId).isEqualTo(100L);
        assertThat(resp.quantity).isEqualByComparingTo("0.300");
        assertThat(resp.unit).isEqualTo("kg");
    }

    @Test
    @DisplayName("CT-FIC-02: insumo já presente atualiza o mesmo item, sem duplicar (UNIQUE produto + insumo)")
    void atualizaItemExistente() {
        var p = product(10L, "Bolo de Cenoura", "45.00");
        var i = ingredient(100L, "Farinha de Trigo", "kg");
        var existente = recipe(p, i, "0.300");
        when(productService.getOrThrow(10L)).thenReturn(p);
        when(ingredientService.getOrThrow(100L)).thenReturn(i);
        when(recipeItemRepository.findByProductIdAndIngredientId(10L, 100L)).thenReturn(Optional.of(existente));
        when(recipeItemRepository.save(existente)).thenReturn(existente);

        recipeService.upsert(10L, req(100L, "0.350", "kg"));

        assertThat(existente.getQuantity()).isEqualByComparingTo("0.350");
        verify(recipeItemRepository).save(existente);
    }

    @Test
    @DisplayName("CT-FIC-03: insumo inexistente é recusado e nada é gravado")
    void insumoInexistente() {
        when(productService.getOrThrow(10L)).thenReturn(product(10L, "Bolo de Cenoura", "45.00"));
        when(ingredientService.getOrThrow(999L)).thenThrow(new ResourceNotFoundException("Insumo não encontrado: 999"));

        assertThatThrownBy(() -> recipeService.upsert(10L, req(999L, "0.100", "kg")))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(recipeItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("CT-FIC-04: item de ficha de outro produto não pode ser removido por este produto")
    void removeItemDeOutroProduto() {
        var outro = recipe(product(20L, "Bolo de Chocolate", "55.00"), ingredient(100L, "Farinha", "kg"), "0.250");
        when(recipeItemRepository.findById(7L)).thenReturn(Optional.of(outro));

        assertThatThrownBy(() -> recipeService.delete(10L, 7L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("não pertence");
        verify(recipeItemRepository, never()).delete(any());
    }

    @Test
    @DisplayName("CT-FIC-05: remove item da ficha do próprio produto")
    void removeItem() {
        var item = recipe(product(10L, "Bolo de Cenoura", "45.00"), ingredient(100L, "Farinha", "kg"), "0.300");
        when(recipeItemRepository.findById(7L)).thenReturn(Optional.of(item));

        recipeService.delete(10L, 7L);

        verify(recipeItemRepository).delete(item);
    }

    private static RecipeItemRequest req(Long ingredientId, String qty, String unit) {
        var r = new RecipeItemRequest();
        r.setIngredientId(ingredientId);
        r.setQuantity(new BigDecimal(qty));
        r.setUnit(unit);
        return r;
    }
}
