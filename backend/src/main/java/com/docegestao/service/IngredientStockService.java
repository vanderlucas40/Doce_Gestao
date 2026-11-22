package com.docegestao.service;

import com.docegestao.dto.IngredientStockResponse;
import com.docegestao.dto.IngredientStockUpdateRequest;
import com.docegestao.entity.IngredientStock;
import com.docegestao.repository.IngredientStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IngredientStockService {

    private final IngredientStockRepository ingredientStockRepository;
    private final StoreService storeService;
    private final IngredientService ingredientService;
    private final StockMovementService movementService;

    public List<IngredientStockResponse> findByStore(Long storeId) {
        storeService.getOrThrow(storeId);
        return ingredientStockRepository.findByStoreId(storeId)
                .stream().map(IngredientStockResponse::from).toList();
    }

    public List<IngredientStockResponse> findLowStock(Long storeId) {
        return ingredientStockRepository.findLowStockByStore(storeId)
                .stream().map(IngredientStockResponse::from).toList();
    }

    @Transactional
    public IngredientStockResponse upsert(Long storeId, Long ingredientId, IngredientStockUpdateRequest req) {
        var store      = storeService.getOrThrow(storeId);
        var ingredient = ingredientService.getOrThrow(ingredientId);

        var stock = ingredientStockRepository
                .findByStoreIdAndIngredientId(storeId, ingredientId)
                .orElseGet(() -> {
                    var s = new IngredientStock();
                    s.setStore(store);
                    s.setIngredient(ingredient);
                    return s;
                });

        var previous = stock.getQuantity() == null ? java.math.BigDecimal.ZERO : stock.getQuantity();
        stock.setQuantity(req.getQuantity());
        var saved = ingredientStockRepository.save(stock);
        movementService.recordIngredient(store, ingredient, previous, req.getQuantity(), req.getReason());
        return IngredientStockResponse.from(saved);
    }
}
