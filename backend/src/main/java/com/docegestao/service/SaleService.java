package com.docegestao.service;

import com.docegestao.dto.DashboardResponse;
import com.docegestao.dto.SaleRequest;
import com.docegestao.dto.SaleResponse;
import com.docegestao.dto.PageResponse;
import com.docegestao.entity.Sale;
import com.docegestao.entity.SaleItem;
import com.docegestao.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository       saleRepository;
    private final StoreService         storeService;
    private final ProductService       productService;
    private final InventoryService     inventoryService;
    private final IngredientStockService ingredientStockService;

    public static final int MAX_PAGE_SIZE = 100;

    /** Vendas da loja, mais recentes primeiro, paginadas no banco (R06). */
    @Transactional(readOnly = true)
    public PageResponse<SaleResponse> findByStore(Long storeId, int page, int size) {
        storeService.getOrThrow(storeId);
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        var ids = saleRepository.findIdsByStoreId(storeId, pageable);
        if (ids.isEmpty()) return PageResponse.of(List.of(), ids);

        var byId = saleRepository.findWithItemsByIdIn(ids.getContent()).stream()
                .collect(java.util.stream.Collectors.toMap(Sale::getId, v -> v));
        var content = ids.getContent().stream().map(byId::get).map(SaleResponse::from).toList();
        return PageResponse.of(content, ids);
    }

    public List<SaleResponse> findByStoreAndDate(Long storeId, LocalDate date) {
        var start = date.atStartOfDay();
        var end   = date.atTime(LocalTime.MAX);
        return saleRepository.findByStoreAndDateRange(storeId, start, end)
                .stream().map(SaleResponse::from).toList();
    }

    /**
     * Busca vendas de um intervalo de datas com uma única query.
     * Usado pelo endpoint GET /by-range — substitui N chamadas a /by-date.
     */
    public List<SaleResponse> findByStoreAndRange(Long storeId, LocalDate from, LocalDate to) {
        storeService.getOrThrow(storeId);
        var start = from.atStartOfDay();
        var end   = to.atTime(LocalTime.MAX);
        return saleRepository.findByStoreAndDateRange(storeId, start, end)
                .stream().map(SaleResponse::from).toList();
    }

    /**
     * Registra uma venda e desconta automaticamente do estoque.
     * Transacional: se qualquer item falhar, toda a venda é revertida.
     */
    @Transactional
    public SaleResponse register(Long storeId, SaleRequest req) {
        var store = storeService.getOrThrow(storeId);
        var sale  = new Sale();
        sale.setStore(store);
        sale.setNotes(req.getNotes());

        BigDecimal total = BigDecimal.ZERO;

        for (var itemReq : req.getItems()) {
            var product = productService.getOrThrow(itemReq.getProductId());

            inventoryService.deduct(store, product.getId(), itemReq.getQuantity());

            var item = new SaleItem();
            item.setSale(sale);
            item.setProduct(product);
            item.setQuantity(itemReq.getQuantity());
            item.setUnitPrice(product.getPrice());

            sale.getItems().add(item);
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity())));
        }

        sale.setTotal(total);
        return SaleResponse.from(saleRepository.save(sale));
    }

    public DashboardResponse getDashboard(Long storeId) {
        var store = storeService.getOrThrow(storeId);
        var today = LocalDate.now();
        var start = today.atStartOfDay();
        var end   = today.atTime(LocalTime.MAX);

        var totalToday     = saleRepository.sumTotalByStoreAndDateRange(storeId, start, end);
        var todaySales     = saleRepository.findByStoreAndDateRange(storeId, start, end);
        var lowProducts    = inventoryService.findLowStock(storeId);
        var lowIngredients = ingredientStockService.findLowStock(storeId);

        var dashboard = new DashboardResponse();
        dashboard.setStoreId(store.getId());
        dashboard.setStoreName(store.getName());
        dashboard.setTotalToday(totalToday != null ? totalToday : BigDecimal.ZERO);
        dashboard.setSalesCountToday((long) todaySales.size());
        dashboard.setLowStockProducts(lowProducts);
        dashboard.setLowStockIngredients(lowIngredients);
        dashboard.setRecentSales(todaySales.stream().limit(10).map(SaleResponse::from).toList());

        return dashboard;
    }
}
