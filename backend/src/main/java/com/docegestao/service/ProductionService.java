package com.docegestao.service;

import com.docegestao.dto.*;
import com.docegestao.dto.FornadaPreviewResponse.IngredientNeedResponse;
import com.docegestao.entity.*;
import com.docegestao.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductionService {

    private final ProductionBatchRepository   batchRepository;
    private final RecipeItemRepository        recipeItemRepository;
    private final IngredientStockRepository   ingredientStockRepository;
    private final InventoryRepository         inventoryRepository;
    private final StoreService                storeService;
    private final ProductService              productService;
    private final UserRepository              userRepository;

    // ─── Histórico ───────────────────────────────────────────────

    public List<FornadaResponse> findByStore(Long storeId) {
        storeService.getOrThrow(storeId);
        return batchRepository.findByStoreIdWithDetails(storeId)
                .stream().map(FornadaResponse::from).toList();
    }

    public FornadaResponse findById(Long storeId, Long batchId) {
        var batch = batchRepository.findByIdWithDetails(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Fornada não encontrada: " + batchId));
        if (!batch.getStore().getId().equals(storeId))
            throw new BusinessException("Esta fornada não pertence à loja informada.");
        return FornadaResponse.from(batch);
    }

    // ─── Preview (sem gravar) ─────────────────────────────────────

    public FornadaPreviewResponse preview(Long storeId, List<BatchItemRequest> items) {
        var consolidated = consolidateIngredients(items);

        if (consolidated.isEmpty()) {
            // Nenhum produto tem ficha técnica — avisa o padeiro
            var preview = new FornadaPreviewResponse();
            preview.ingredients = List.of();
            preview.totalItems  = items.stream().mapToInt(i -> i.quantity).sum();
            preview.flavors     = (int) items.stream().map(i -> i.productId).distinct().count();
            preview.missingRecipe = true;
            return preview;
        }

        var stockMap = loadIngredientStocks(storeId, consolidated.keySet());

        var needs = consolidated.entrySet().stream().map(e -> {
            var need  = e.getValue();
            var stock = stockMap.getOrDefault(e.getKey(), BigDecimal.ZERO);
            var row   = new IngredientNeedResponse();
            row.ingredientId   = e.getKey();
            row.ingredientName = need.name();
            row.unit           = need.unit();
            row.suggestedQty   = need.qty();
            row.stockAvailable = stock;
            row.insufficient   = stock.compareTo(need.qty()) < 0;
            return row;
        }).sorted(Comparator.comparing(r -> r.ingredientName)).toList();

        var preview = new FornadaPreviewResponse();
        preview.ingredients  = needs;
        preview.totalItems   = items.stream().mapToInt(i -> i.quantity).sum();
        preview.flavors      = (int) items.stream().map(i -> i.productId).distinct().count();
        preview.missingRecipe = false;
        return preview;
    }

    // ─── Registrar Fornada ────────────────────────────────────────

    @Transactional
    public FornadaResponse register(Long storeId, FornadaRequest req) {
        var store = storeService.getOrThrow(storeId);

        var consolidated = consolidateIngredients(req.getItems());

        if (consolidated.isEmpty()) {
            throw new BusinessException(
                "Nenhum dos produtos selecionados possui Ficha Técnica cadastrada. " +
                "Cadastre os ingredientes por produto antes de registrar uma fornada."
            );
        }

        // Ajustes de desvio
        Map<Long, BigDecimal> adjustmentMap = new HashMap<>();
        if (req.getAdjustments() != null) {
            for (var adj : req.getAdjustments())
                adjustmentMap.put(adj.getIngredientId(), adj.getActualQty());
        }

        // Validação fail-fast: verifica TODOS antes de descontar qualquer um
        var stockMap  = loadIngredientStocks(storeId, consolidated.keySet());
        var shortages = new ArrayList<String>();

        for (var entry : consolidated.entrySet()) {
            var need      = entry.getValue();
            var actualQty = adjustmentMap.getOrDefault(entry.getKey(), need.qty());
            var available = stockMap.getOrDefault(entry.getKey(), BigDecimal.ZERO);
            if (available.compareTo(actualQty) < 0) {
                shortages.add("'%s': precisa %.3f %s, tem %.3f %s"
                        .formatted(need.name(), actualQty, need.unit(), available, need.unit()));
            }
        }

        if (!shortages.isEmpty()) {
            throw new BusinessException(
                "Estoque insuficiente para a fornada:\n• " + String.join("\n• ", shortages)
            );
        }

        // Descontar insumos e registrar uso
        var ingredientStocks = ingredientStockRepository.findByStoreId(storeId);
        var stockById = ingredientStocks.stream()
                .collect(Collectors.toMap(s -> s.getIngredient().getId(), s -> s));

        var batch = new ProductionBatch();
        batch.setStore(store);
        batch.setNotes(req.getNotes());
        batch.setStatus(ProductionBatch.BatchStatus.COMPLETED);
        batch.setTotalItems(req.getItems().stream().mapToInt(i -> i.quantity).sum());

        try {
            var username = SecurityContextHolder.getContext().getAuthentication().getName();
            userRepository.findByUsernameAndActiveTrue(username).ifPresent(batch::setCreatedBy);
        } catch (Exception ignored) {}

        for (var entry : consolidated.entrySet()) {
            var need         = entry.getValue();
            var suggestedQty = need.qty();
            var actualQty    = adjustmentMap.getOrDefault(entry.getKey(), suggestedQty);
            var iStock       = stockById.get(entry.getKey());

            if (iStock == null) continue; // insumo sem estoque cadastrado — ignorar silenciosamente

            iStock.setQuantity(iStock.getQuantity().subtract(actualQty));
            ingredientStockRepository.save(iStock);

            var usage = new BatchIngredientUsage();
            usage.setBatch(batch);
            usage.setIngredient(iStock.getIngredient()); // nunca null aqui
            usage.setSuggestedQty(suggestedQty);
            usage.setActualQty(actualQty);
            usage.setUnit(need.unit());
            batch.getIngredientUsages().add(usage);
        }

        // Itens e incremento de inventário
        var invByProduct = inventoryRepository.findByStoreId(storeId).stream()
                .collect(Collectors.toMap(i -> i.getProduct().getId(), i -> i));

        for (var itemReq : req.getItems()) {
            var product   = productService.getOrThrow(itemReq.getProductId());
            var batchItem = new BatchItem();
            batchItem.setBatch(batch);
            batchItem.setProduct(product);
            batchItem.setQuantity(itemReq.getQuantity());
            batch.getItems().add(batchItem);

            var inv = invByProduct.get(itemReq.getProductId());
            if (inv != null) {
                inv.setQuantity(inv.getQuantity() + itemReq.getQuantity());
                inventoryRepository.save(inv);
            }
        }

        return FornadaResponse.from(batchRepository.save(batch));
    }

    // ─── Internos ─────────────────────────────────────────────────

    private Map<Long, IngredientNeed> consolidateIngredients(List<BatchItemRequest> items) {
        var productIds      = items.stream().map(i -> i.getProductId()).distinct().toList();
        var recipeItems     = recipeItemRepository.findByProductIds(productIds);
        var recipeByProduct = recipeItems.stream()
                .collect(Collectors.groupingBy(r -> r.getProduct().getId()));

        Map<Long, IngredientNeed> consolidated = new LinkedHashMap<>();
        for (var itemReq : items) {
            var recipe = recipeByProduct.getOrDefault(itemReq.getProductId(), List.of());
            for (var r : recipe) {
                var ingId  = r.getIngredient().getId();
                var needed = r.getQuantity().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
                consolidated.merge(ingId,
                    new IngredientNeed(ingId, r.getIngredient().getName(), r.getUnit(), needed),
                    (ex, nw) -> new IngredientNeed(ingId, ex.name(), ex.unit(), ex.qty().add(nw.qty()))
                );
            }
        }
        return consolidated;
    }

    private Map<Long, BigDecimal> loadIngredientStocks(Long storeId, Set<Long> ingredientIds) {
        return ingredientStockRepository.findByStoreId(storeId).stream()
                .filter(s -> ingredientIds.contains(s.getIngredient().getId()))
                .collect(Collectors.toMap(s -> s.getIngredient().getId(), IngredientStock::getQuantity));
    }

    private record IngredientNeed(Long id, String name, String unit, BigDecimal qty) {}
}
