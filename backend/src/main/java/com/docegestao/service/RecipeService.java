package com.docegestao.service;

import com.docegestao.dto.RecipeItemRequest;
import com.docegestao.dto.RecipeItemResponse;
import com.docegestao.entity.RecipeItem;
import com.docegestao.repository.RecipeItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeItemRepository recipeItemRepository;
    private final ProductService        productService;
    private final IngredientService     ingredientService;

    public List<RecipeItemResponse> findByProduct(Long productId) {
        productService.getOrThrow(productId);
        return recipeItemRepository.findByProductId(productId)
                .stream().map(RecipeItemResponse::from).toList();
    }

    @Transactional
    public RecipeItemResponse upsert(Long productId, RecipeItemRequest req) {
        var product    = productService.getOrThrow(productId);
        var ingredient = ingredientService.getOrThrow(req.getIngredientId());

        var item = recipeItemRepository
                .findByProductIdAndIngredientId(productId, req.getIngredientId())
                .orElseGet(() -> {
                    var r = new RecipeItem();
                    r.setProduct(product);
                    r.setIngredient(ingredient);
                    return r;
                });

        item.setQuantity(req.getQuantity());
        item.setUnit(req.getUnit());
        return RecipeItemResponse.from(recipeItemRepository.save(item));
    }

    @Transactional
    public void delete(Long productId, Long recipeItemId) {
        var item = recipeItemRepository.findById(recipeItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item de ficha técnica não encontrado: " + recipeItemId));
        if (!item.getProduct().getId().equals(productId)) {
            throw new BusinessException("Este item não pertence ao produto informado.");
        }
        recipeItemRepository.delete(item);
    }

    /** Busca todos os RecipeItems de uma lista de produtos em uma única query */
    public List<RecipeItem> findByProductIds(List<Long> productIds) {
        return recipeItemRepository.findByProductIds(productIds);
    }
}
