package com.docegestao.controller;

import com.docegestao.dto.*;
import com.docegestao.security.StoreAccessGuard;
import com.docegestao.service.IngredientStockService;
import com.docegestao.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stores/{storeId}/inventory")
@RequiredArgsConstructor
class InventoryController {

    private final InventoryService inventoryService;
    private final StoreAccessGuard guard;

    @GetMapping
    public List<InventoryResponse> findByStore(@PathVariable Long storeId) {
        guard.check(storeId);
        return inventoryService.findByStore(storeId);
    }

    @GetMapping("/low-stock")
    public List<InventoryResponse> findLowStock(@PathVariable Long storeId) {
        guard.check(storeId);
        return inventoryService.findLowStock(storeId);
    }

    @PutMapping("/{productId}")
    public InventoryResponse upsert(
            @PathVariable Long storeId,
            @PathVariable Long productId,
            @Valid @RequestBody InventoryUpdateRequest req) {
        guard.check(storeId);
        return inventoryService.upsert(storeId, productId, req);
    }
}

@RestController
@RequestMapping("/stores/{storeId}/ingredient-stock")
@RequiredArgsConstructor
class IngredientStockController {

    private final IngredientStockService ingredientStockService;
    private final StoreAccessGuard       guard;

    @GetMapping
    public List<IngredientStockResponse> findByStore(@PathVariable Long storeId) {
        guard.check(storeId);
        return ingredientStockService.findByStore(storeId);
    }

    @GetMapping("/low-stock")
    public List<IngredientStockResponse> findLowStock(@PathVariable Long storeId) {
        guard.check(storeId);
        return ingredientStockService.findLowStock(storeId);
    }

    @PutMapping("/{ingredientId}")
    public IngredientStockResponse upsert(
            @PathVariable Long storeId,
            @PathVariable Long ingredientId,
            @Valid @RequestBody IngredientStockUpdateRequest req) {
        guard.check(storeId);
        return ingredientStockService.upsert(storeId, ingredientId, req);
    }
}
