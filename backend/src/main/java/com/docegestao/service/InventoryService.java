package com.docegestao.service;

import com.docegestao.dto.InventoryResponse;
import com.docegestao.dto.InventoryUpdateRequest;
import com.docegestao.entity.Inventory;
import com.docegestao.entity.Store;
import com.docegestao.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final StoreService storeService;
    private final ProductService productService;
    private final StockMovementService movementService;

    public List<InventoryResponse> findByStore(Long storeId) {
        storeService.getOrThrow(storeId); // valida se loja existe
        return inventoryRepository.findByStoreId(storeId)
                .stream().map(InventoryResponse::from).toList();
    }

    public List<InventoryResponse> findLowStock(Long storeId) {
        return inventoryRepository.findLowStockByStore(storeId)
                .stream().map(InventoryResponse::from).toList();
    }

    @Transactional
    public InventoryResponse upsert(Long storeId, Long productId, InventoryUpdateRequest req) {
        var store   = storeService.getOrThrow(storeId);
        var product = productService.getOrThrow(productId);

        var inv = inventoryRepository
                .findByStoreIdAndProductId(storeId, productId)
                .orElseGet(() -> {
                    var newInv = new Inventory();
                    newInv.setStore(store);
                    newInv.setProduct(product);
                    return newInv;
                });

        var previous = inv.getQuantity() == null ? 0 : inv.getQuantity();
        inv.setQuantity(req.getQuantity());
        if (req.getMaxQuantity() != null) inv.setMaxQuantity(req.getMaxQuantity());

        var saved = inventoryRepository.save(inv);
        movementService.recordProduct(store, product,
                java.math.BigDecimal.valueOf(previous), java.math.BigDecimal.valueOf(req.getQuantity()), req.getReason());
        return InventoryResponse.from(saved);
    }

    /**
     * Desconta do estoque ao registrar uma venda.
     * Lança exceção se não houver estoque suficiente.
     */
    @Transactional
    public void deduct(Store store, Long productId, int quantity) {
        var inv = inventoryRepository
                .findByStoreIdAndProductId(store.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Produto %d não encontrado no estoque da loja %d".formatted(productId, store.getId())));

        if (inv.getQuantity() < quantity) {
            throw new BusinessException(
                    "Estoque insuficiente para '%s'. Disponível: %d"
                            .formatted(inv.getProduct().getName(), inv.getQuantity()));
        }

        inv.setQuantity(inv.getQuantity() - quantity);
        inventoryRepository.save(inv);
    }
}
