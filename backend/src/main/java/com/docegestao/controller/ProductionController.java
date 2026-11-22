package com.docegestao.controller;

import com.docegestao.dto.*;
import com.docegestao.security.StoreAccessGuard;
import com.docegestao.service.ProductionService;
import com.docegestao.service.RecipeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// ─── Ficha Técnica ────────────────────────────────────────────

@RestController
@RequestMapping("/products/{productId}/recipe")
@RequiredArgsConstructor
class RecipeController {

    private final RecipeService    recipeService;

    @GetMapping
    public List<RecipeItemResponse> findByProduct(@PathVariable Long productId) {
        return recipeService.findByProduct(productId);
    }

    @PutMapping("/{ingredientId}")
    @PreAuthorize("hasRole('ADMIN')")
    public RecipeItemResponse upsert(
            @PathVariable Long productId,
            @PathVariable Long ingredientId,
            @Valid @RequestBody RecipeItemRequest req) {
        req.setIngredientId(ingredientId);
        return recipeService.upsert(productId, req);
    }

    @DeleteMapping("/{recipeItemId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long productId,
            @PathVariable Long recipeItemId) {
        recipeService.delete(productId, recipeItemId);
        return ResponseEntity.noContent().build();
    }
}

// ─── Fornada (Produção em Lote) ───────────────────────────────

@RestController
@RequestMapping("/stores/{storeId}/production")
@RequiredArgsConstructor
class ProductionBatchController {

    private final ProductionService productionService;
    private final StoreAccessGuard  guard;

    /** Histórico de fornadas da loja */
    @GetMapping
    public List<FornadaResponse> findByStore(@PathVariable Long storeId) {
        guard.check(storeId);
        return productionService.findByStore(storeId);
    }

    /** Detalhe de uma fornada específica */
    @GetMapping("/{batchId}")
    public FornadaResponse findById(
            @PathVariable Long storeId,
            @PathVariable Long batchId) {
        guard.check(storeId);
        return productionService.findById(storeId, batchId);
    }

    /**
     * Preview: consolida insumos sem gravar.
     * Usado pelo painel de resumo em tempo real no frontend.
     * Body: lista de { productId, quantity }
     */
    @PostMapping("/preview")
    public FornadaPreviewResponse preview(
            @PathVariable Long storeId,
            @Valid @RequestBody List<BatchItemRequest> items) {
        guard.check(storeId);
        return productionService.preview(storeId, items);
    }

    /**
     * Registra a fornada: desconta insumos e adiciona ao inventário de produtos.
     * Operação totalmente transacional.
     */
    @PostMapping
    public ResponseEntity<FornadaResponse> register(
            @PathVariable Long storeId,
            @Valid @RequestBody FornadaRequest req) {
        guard.check(storeId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productionService.register(storeId, req));
    }
}
