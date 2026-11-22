package com.docegestao.service;

import com.docegestao.entity.Inventory;
import com.docegestao.entity.Product;
import com.docegestao.entity.Store;
import com.docegestao.repository.InventoryRepository;
import com.docegestao.repository.ProductRepository;
import com.docegestao.repository.SaleRepository;
import com.docegestao.repository.StoreRepository;
import com.docegestao.support.MySqlIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.util.UUID;

import static com.docegestao.service.SaleServiceTest.item;
import static com.docegestao.service.SaleServiceTest.request;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Venda contra MySQL real (Testcontainers). Sem @Transactional na classe de propósito:
 * a transação precisa ser a do próprio SaleService, senão o rollback do teste
 * esconderia uma venda parcialmente gravada.
 */
class SaleServiceIntegrationTest extends MySqlIntegrationTest {

    @Autowired SaleService         saleService;
    @Autowired StoreRepository     storeRepository;
    @Autowired ProductRepository   productRepository;
    @Autowired InventoryRepository inventoryRepository;
    @Autowired SaleRepository      saleRepository;

    Store   loja;
    Product bolo;
    Product brigadeiro;

    @BeforeEach
    void setUp() {
        // Loja nova por teste: isola os dados sem precisar limpar tabelas
        var s = new Store();
        s.setName("Loja Teste " + UUID.randomUUID());
        loja = storeRepository.save(s);

        bolo       = productRepository.save(product("Bolo de Cenoura", "45.00"));
        brigadeiro = productRepository.save(product("Brigadeiro (6un)", "18.00"));
        inventory(bolo, 5);
        inventory(brigadeiro, 1);
    }

    @Test
    @DisplayName("CT-VEN-13: item sem estoque desfaz a venda inteira; o estoque dos demais não muda (RNF06)")
    void vendaAtomica() {
        assertThatThrownBy(() -> saleService.register(loja.getId(),
                request(item(bolo.getId(), 2), item(brigadeiro.getId(), 3))))
                .isInstanceOf(BusinessException.class);

        assertThat(qtd(bolo)).as("baixa do bolo deve ser desfeita").isEqualTo(5);
        assertThat(qtd(brigadeiro)).isEqualTo(1);
        assertThat(saleRepository.findByStoreIdOrderBySoldAtDesc(loja.getId())).isEmpty();
    }

    @Test
    @DisplayName("CT-VEN-14: venda válida baixa o estoque e mantém o preço da época após reajuste (RF10, RN07)")
    void vendaValidaEPrecoHistorico() {
        saleService.register(loja.getId(), request(item(bolo.getId(), 2), item(brigadeiro.getId(), 1)));

        bolo.setPrice(new BigDecimal("60.00"));
        productRepository.save(bolo);

        assertThat(qtd(bolo)).isEqualTo(3);
        assertThat(qtd(brigadeiro)).isZero();

        var vendas = saleRepository.findByStoreIdOrderBySoldAtDesc(loja.getId());
        assertThat(vendas).hasSize(1);
        assertThat(vendas.get(0).getTotal()).isEqualByComparingTo("108.00");
        var itemBolo = vendas.get(0).getItems().stream()
                .filter(i -> i.getProduct().getId().equals(bolo.getId())).findFirst().orElseThrow();
        assertThat(itemBolo.getUnitPrice()).isEqualByComparingTo("45.00");
    }

    private int qtd(Product p) {
        return inventoryRepository.findByStoreIdAndProductId(loja.getId(), p.getId()).orElseThrow().getQuantity();
    }

    private static Product product(String name, String price) {
        var p = new Product();
        p.setName(name);
        p.setPrice(new BigDecimal(price));
        return p;
    }

    private void inventory(Product p, int qty) {
        var i = new Inventory();
        i.setStore(loja);
        i.setProduct(p);
        i.setQuantity(qty);
        i.setMaxQuantity(10);
        inventoryRepository.save(i);
    }
}
