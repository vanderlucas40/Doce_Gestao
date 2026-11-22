package com.docegestao.service;

import com.docegestao.entity.*;
import com.docegestao.repository.*;
import com.docegestao.support.MySqlIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static com.docegestao.service.SaleServiceTest.item;
import static com.docegestao.service.SaleServiceTest.request;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Bloqueio otimista no estoque (R04): nenhuma gravação concorrente se perde ou deixa saldo negativo. */
class StockConcurrencyIntegrationTest extends MySqlIntegrationTest {

    @Autowired SaleService               saleService;
    @Autowired StoreRepository           storeRepository;
    @Autowired ProductRepository         productRepository;
    @Autowired IngredientRepository      ingredientRepository;
    @Autowired InventoryRepository       inventoryRepository;
    @Autowired IngredientStockRepository ingredientStockRepository;
    @Autowired SaleRepository            saleRepository;

    Store loja;
    Product bolo;

    @BeforeEach
    void setUp() {
        var tag = UUID.randomUUID().toString().substring(0, 8);
        var s = new Store();
        s.setName("Loja Concorrência " + tag);
        loja = storeRepository.save(s);
        bolo = productRepository.save(SaleServiceTest.product(null, "Bolo " + tag, "45.00"));

        var inv = new Inventory();
        inv.setStore(loja); inv.setProduct(bolo); inv.setQuantity(3); inv.setMaxQuantity(10);
        inventoryRepository.save(inv);
    }

    @Test
    @DisplayName("CT-EST-01: gravação com saldo desatualizado de produto é recusada, sem sobrescrever a anterior")
    void versaoDesatualizadaProduto() {
        var copia1 = inventoryRepository.findByStoreIdAndProductId(loja.getId(), bolo.getId()).orElseThrow();
        var copia2 = inventoryRepository.findByStoreIdAndProductId(loja.getId(), bolo.getId()).orElseThrow();

        copia1.setQuantity(2);
        inventoryRepository.save(copia1);

        copia2.setQuantity(1);   // baseada no saldo antigo (3)
        assertThatThrownBy(() -> inventoryRepository.save(copia2))
                .isInstanceOf(ObjectOptimisticLockingFailureException.class);

        assertThat(qtd()).isEqualTo(2);
    }

    @Test
    @DisplayName("CT-EST-02: gravação com saldo desatualizado de insumo é recusada")
    void versaoDesatualizadaInsumo() {
        var i = new Ingredient();
        i.setName("Farinha " + UUID.randomUUID()); i.setUnit("kg");
        i = ingredientRepository.save(i);
        var st = new IngredientStock();
        st.setStore(loja); st.setIngredient(i); st.setQuantity(new BigDecimal("5.000"));
        st = ingredientStockRepository.save(st);

        var copia1 = ingredientStockRepository.findById(st.getId()).orElseThrow();
        var copia2 = ingredientStockRepository.findById(st.getId()).orElseThrow();
        copia1.setQuantity(new BigDecimal("4.000"));
        ingredientStockRepository.save(copia1);

        copia2.setQuantity(new BigDecimal("3.000"));
        assertThatThrownBy(() -> ingredientStockRepository.save(copia2))
                .isInstanceOf(ObjectOptimisticLockingFailureException.class);

        assertThat(ingredientStockRepository.findById(st.getId()).orElseThrow().getQuantity())
                .isEqualByComparingTo("4.000");
    }

    @Test
    @DisplayName("CT-EST-03: 8 vendas simultâneas com 3 unidades em estoque nunca vendem além do saldo (RN06)")
    void vendasSimultaneas() throws Exception {
        int threads = 8;
        var largada = new CountDownLatch(1);
        var pool    = Executors.newFixedThreadPool(threads);
        var sucesso = new AtomicInteger();
        var falhasInesperadas = new ArrayList<Throwable>();

        var tarefas = new ArrayList<Future<?>>();
        for (int t = 0; t < threads; t++) {
            tarefas.add(pool.submit(() -> {
                largada.await();
                try {
                    saleService.register(loja.getId(), request(item(bolo.getId(), 1)));
                    sucesso.incrementAndGet();
                } catch (BusinessException | ObjectOptimisticLockingFailureException | PessimisticLockingFailureException esperado) {
                    // sem saldo, perdeu a corrida ou o MySQL escolheu esta transação num deadlock:
                    // em todos os casos a venda é desfeita inteira, o que é aceitável
                } catch (Throwable outro) {
                    synchronized (falhasInesperadas) { falhasInesperadas.add(outro); }
                }
                return null;
            }));
        }
        largada.countDown();
        for (var f : tarefas) f.get(60, TimeUnit.SECONDS);
        pool.shutdown();

        assertThat(falhasInesperadas).isEmpty();
        assertThat(sucesso.get()).isBetween(1, 3);
        assertThat(qtd()).as("saldo = inicial - vendas efetivadas, nunca negativo").isEqualTo(3 - sucesso.get());
        assertThat(saleRepository.findByStoreIdOrderBySoldAtDesc(loja.getId())).hasSize(sucesso.get());
    }

    private int qtd() {
        return inventoryRepository.findByStoreIdAndProductId(loja.getId(), bolo.getId()).orElseThrow().getQuantity();
    }
}
