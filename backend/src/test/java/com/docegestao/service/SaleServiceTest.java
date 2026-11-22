package com.docegestao.service;

import com.docegestao.dto.SaleItemRequest;
import com.docegestao.dto.SaleRequest;
import com.docegestao.entity.Product;
import com.docegestao.entity.Sale;
import com.docegestao.entity.Store;
import com.docegestao.repository.SaleRepository;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Testes unitários do SaleService: RF09, RF10, RF11, RN06, RN07. */
@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    @Mock SaleRepository         saleRepository;
    @Mock StoreService           storeService;
    @Mock ProductService         productService;
    @Mock InventoryService       inventoryService;
    @Mock IngredientStockService ingredientStockService;

    @InjectMocks SaleService saleService;

    Store   loja;
    Product bolo;
    Product brigadeiro;

    @BeforeEach
    void setUp() {
        loja       = store(1L, "Loja Centro");
        bolo       = product(10L, "Bolo de Cenoura", "45.00");
        brigadeiro = product(20L, "Brigadeiro (6un)", "18.00");
    }

    @Test
    @DisplayName("CT-VEN-01: venda com vários itens grava preço vigente, total e baixa o estoque de cada item")
    void registraVendaComPrecoVigenteETotal() {
        when(storeService.getOrThrow(1L)).thenReturn(loja);
        when(productService.getOrThrow(10L)).thenReturn(bolo);
        when(productService.getOrThrow(20L)).thenReturn(brigadeiro);
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));

        var resp = saleService.register(1L, request(item(10L, 2), item(20L, 3)));

        // 2 x 45,00 + 3 x 18,00 = 144,00
        assertThat(resp.getTotal()).isEqualByComparingTo("144.00");

        var captor = ArgumentCaptor.forClass(Sale.class);
        verify(saleRepository).save(captor.capture());
        var sale = captor.getValue();
        assertThat(sale.getStore()).isSameAs(loja);
        assertThat(sale.getItems()).hasSize(2);
        assertThat(sale.getItems().get(0).getUnitPrice()).isEqualByComparingTo("45.00");
        assertThat(sale.getItems().get(1).getUnitPrice()).isEqualByComparingTo("18.00");

        verify(inventoryService).deduct(loja, 10L, 2);
        verify(inventoryService).deduct(loja, 20L, 3);
    }

    @Test
    @DisplayName("CT-VEN-02: preço unitário vem do produto no servidor, não do cliente (RN07)")
    void precoUnitarioVemDoProduto() {
        when(storeService.getOrThrow(1L)).thenReturn(loja);
        when(productService.getOrThrow(10L)).thenReturn(bolo);
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));

        saleService.register(1L, request(item(10L, 1)));
        bolo.setPrice(new BigDecimal("99.00")); // reajuste depois da venda

        var captor = ArgumentCaptor.forClass(Sale.class);
        verify(saleRepository).save(captor.capture());
        assertThat(captor.getValue().getItems().get(0).getUnitPrice()).isEqualByComparingTo("45.00");
        assertThat(captor.getValue().getTotal()).isEqualByComparingTo("45.00");
    }

    @Test
    @DisplayName("CT-VEN-03: estoque insuficiente em um item interrompe a venda e nada é gravado (RN06)")
    void estoqueInsuficienteNaoGravaVenda() {
        when(storeService.getOrThrow(1L)).thenReturn(loja);
        when(productService.getOrThrow(10L)).thenReturn(bolo);
        when(productService.getOrThrow(20L)).thenReturn(brigadeiro);
        // 1º item baixa normalmente; o 2º falha (strict stubs exige os dois explícitos)
        doNothing().when(inventoryService).deduct(loja, 10L, 1);
        doThrow(new BusinessException("Estoque insuficiente para 'Brigadeiro (6un)'. Disponível: 0"))
                .when(inventoryService).deduct(loja, 20L, 5);

        assertThatThrownBy(() -> saleService.register(1L, request(item(10L, 1), item(20L, 5))))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Brigadeiro");

        verify(saleRepository, never()).save(any());
    }

    @Test
    @DisplayName("CT-VEN-04: produto inexistente não baixa estoque nem grava venda")
    void produtoInexistente() {
        when(storeService.getOrThrow(1L)).thenReturn(loja);
        when(productService.getOrThrow(99L)).thenThrow(new ResourceNotFoundException("Produto não encontrado: 99"));

        assertThatThrownBy(() -> saleService.register(1L, request(item(99L, 1))))
                .isInstanceOf(ResourceNotFoundException.class);

        verifyNoInteractions(inventoryService);
        verify(saleRepository, never()).save(any());
    }

    @Test
    @DisplayName("CT-VEN-05: loja inexistente é rejeitada antes de qualquer item")
    void lojaInexistente() {
        when(storeService.getOrThrow(7L)).thenThrow(new ResourceNotFoundException("Loja não encontrada: 7"));

        assertThatThrownBy(() -> saleService.register(7L, request(item(10L, 1))))
                .isInstanceOf(ResourceNotFoundException.class);

        verifyNoInteractions(productService, inventoryService, saleRepository);
    }

    @Test
    @DisplayName("CT-VEN-06: register é transacional, condição da atomicidade da venda (RNF06)")
    void registerEhTransacional() throws NoSuchMethodException {
        var method = SaleService.class.getMethod("register", Long.class, SaleRequest.class);
        assertThat(method.isAnnotationPresent(Transactional.class)).isTrue();
    }

    @Test
    @DisplayName("CT-VEN-07: painel do dia soma faturamento, conta vendas, traz o dia anterior e limita a 10 os últimos pedidos (RF11)")
    void dashboardDoDia() {
        var hoje  = java.time.LocalDate.now().atStartOfDay();
        var ontem = hoje.minusDays(1);
        when(storeService.getOrThrow(1L)).thenReturn(loja);
        when(saleRepository.sumTotalByStoreAndDateRange(eq(1L), eq(hoje), any())).thenReturn(new BigDecimal("540.00"));
        when(saleRepository.sumTotalByStoreAndDateRange(eq(1L), eq(ontem), any())).thenReturn(new BigDecimal("450.00"));
        when(saleRepository.countByStoreAndDateRange(eq(1L), eq(ontem), any())).thenReturn(9L);
        var vendas = new ArrayList<Sale>();
        for (int i = 0; i < 12; i++) vendas.add(sale(loja, "45.00"));
        when(saleRepository.findByStoreAndDateRange(eq(1L), any(), any())).thenReturn(vendas);
        when(inventoryService.findLowStock(1L)).thenReturn(List.of());
        when(ingredientStockService.findLowStock(1L)).thenReturn(List.of());

        var d = saleService.getDashboard(1L);

        assertThat(d.getTotalToday()).isEqualByComparingTo("540.00");
        assertThat(d.getSalesCountToday()).isEqualTo(12L);
        assertThat(d.getRecentSales()).hasSize(10);
        assertThat(d.getStoreName()).isEqualTo("Loja Centro");
        assertThat(d.getTotalYesterday()).isEqualByComparingTo("450.00");
        assertThat(d.getSalesCountYesterday()).isEqualTo(9L);
    }

    @Test
    @DisplayName("CT-VEN-08: painel sem vendas hoje nem ontem mostra zero nos dois dias")
    void dashboardSemVendas() {
        when(storeService.getOrThrow(1L)).thenReturn(loja);
        when(saleRepository.sumTotalByStoreAndDateRange(eq(1L), any(), any())).thenReturn(null);
        when(saleRepository.findByStoreAndDateRange(eq(1L), any(), any())).thenReturn(List.of());
        when(inventoryService.findLowStock(1L)).thenReturn(List.of());
        when(ingredientStockService.findLowStock(1L)).thenReturn(List.of());

        var d = saleService.getDashboard(1L);

        assertThat(d.getTotalToday()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(d.getSalesCountToday()).isZero();
        assertThat(d.getRecentSales()).isEmpty();
        assertThat(d.getTotalYesterday()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(d.getSalesCountYesterday()).isZero();
    }

    // ─── helpers ─────────────────────────────────────────────

    static Store store(Long id, String name) {
        var s = new Store();
        s.setId(id);
        s.setName(name);
        return s;
    }

    static Product product(Long id, String name, String price) {
        var p = new Product();
        p.setId(id);
        p.setName(name);
        p.setPrice(new BigDecimal(price));
        return p;
    }

    static SaleItemRequest item(Long productId, int qty) {
        var i = new SaleItemRequest();
        i.setProductId(productId);
        i.setQuantity(qty);
        return i;
    }

    static SaleRequest request(SaleItemRequest... items) {
        var r = new SaleRequest();
        r.setItems(List.of(items));
        return r;
    }

    static Sale sale(Store store, String total) {
        var s = new Sale();
        s.setStore(store);
        s.setTotal(new BigDecimal(total));
        s.setSoldAt(LocalDateTime.now());
        return s;
    }
}
