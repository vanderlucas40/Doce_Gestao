package com.docegestao.service;

import com.docegestao.entity.Inventory;
import com.docegestao.entity.Product;
import com.docegestao.entity.Store;
import com.docegestao.repository.InventoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Baixa de estoque usada pela venda (RF10, RN06). */
@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock InventoryRepository inventoryRepository;
    @Mock StoreService        storeService;
    @Mock ProductService      productService;

    @InjectMocks InventoryService inventoryService;

    @Test
    @DisplayName("CT-VEN-09: baixa subtrai a quantidade vendida")
    void baixaSubtrai() {
        var loja = SaleServiceTest.store(1L, "Loja Centro");
        var inv  = inventory(loja, SaleServiceTest.product(10L, "Bolo de Cenoura", "45.00"), 5);
        when(inventoryRepository.findByStoreIdAndProductId(1L, 10L)).thenReturn(Optional.of(inv));

        inventoryService.deduct(loja, 10L, 3);

        assertThat(inv.getQuantity()).isEqualTo(2);
        verify(inventoryRepository).save(inv);
    }

    @Test
    @DisplayName("CT-VEN-10: vender exatamente o saldo zera o estoque")
    void baixaDoSaldoExato() {
        var loja = SaleServiceTest.store(1L, "Loja Centro");
        var inv  = inventory(loja, SaleServiceTest.product(10L, "Bolo de Cenoura", "45.00"), 4);
        when(inventoryRepository.findByStoreIdAndProductId(1L, 10L)).thenReturn(Optional.of(inv));

        inventoryService.deduct(loja, 10L, 4);

        assertThat(inv.getQuantity()).isZero();
    }

    @Test
    @DisplayName("CT-VEN-11: quantidade maior que o estoque é recusada com mensagem em português (RN06, RNF05)")
    void estoqueInsuficiente() {
        var loja = SaleServiceTest.store(1L, "Loja Centro");
        var inv  = inventory(loja, SaleServiceTest.product(20L, "Brigadeiro (6un)", "18.00"), 2);
        when(inventoryRepository.findByStoreIdAndProductId(1L, 20L)).thenReturn(Optional.of(inv));

        assertThatThrownBy(() -> inventoryService.deduct(loja, 20L, 3))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Estoque insuficiente para 'Brigadeiro (6un)'. Disponível: 2");

        assertThat(inv.getQuantity()).isEqualTo(2);
        verify(inventoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("CT-VEN-12: produto sem registro de estoque na loja é recusado")
    void produtoSemEstoqueNaLoja() {
        var loja = SaleServiceTest.store(1L, "Loja Centro");
        when(inventoryRepository.findByStoreIdAndProductId(1L, 30L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.deduct(loja, 30L, 1))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(inventoryRepository, never()).save(any());
    }

    private static Inventory inventory(Store store, Product product, int qty) {
        var i = new Inventory();
        i.setStore(store);
        i.setProduct(product);
        i.setQuantity(qty);
        i.setMaxQuantity(10);
        return i;
    }
}
