package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

// ─── Store ───────────────────────────────────────────────────

@Data
public class StoreRequest {
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100)
    public String name;
    public String address;
    public String phone;
}

@Data
public class StoreResponse {
    public Long id;
    public String name;
    public String address;
    public String phone;
    public Boolean active;

    public static StoreResponse from(Store s) {
        var r = new StoreResponse();
        r.id      = s.getId();
        r.name    = s.getName();
        r.address = s.getAddress();
        r.phone   = s.getPhone();
        r.active  = s.getActive();
        return r;
    }
}

// ─── Product ─────────────────────────────────────────────────

@Data
public class ProductRequest {
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100)
    public String name;
    public String description;
    @NotNull @DecimalMin("0.01")
    public BigDecimal price;
}

@Data
public class ProductResponse {
    public Long id;
    public String name;
    public String description;
    public BigDecimal price;
    public Boolean active;

    public static ProductResponse from(Product p) {
        var r = new ProductResponse();
        r.id          = p.getId();
        r.name        = p.getName();
        r.description = p.getDescription();
        r.price       = p.getPrice();
        r.active      = p.getActive();
        return r;
    }
}

// ─── Ingredient ──────────────────────────────────────────────

@Data
public class IngredientRequest {
    @NotBlank @Size(max = 100)
    public String name;
    @NotBlank @Size(max = 20)
    public String unit;
    @NotNull @DecimalMin("0")
    public BigDecimal minQuantity;
}

@Data
public class IngredientResponse {
    public Long id;
    public String name;
    public String unit;
    public BigDecimal minQuantity;
    public Boolean active;

    public static IngredientResponse from(Ingredient i) {
        var r = new IngredientResponse();
        r.id          = i.getId();
        r.name        = i.getName();
        r.unit        = i.getUnit();
        r.minQuantity = i.getMinQuantity();
        r.active      = i.getActive();
        return r;
    }
}

// ─── Inventory ───────────────────────────────────────────────

@Data
public class InventoryResponse {
    public Long inventoryId;
    public Long productId;
    public String productName;
    public BigDecimal productPrice;
    public Integer quantity;
    public Integer maxQuantity;
    public String status; // OK | LOW | OUT
    public LocalDateTime updatedAt;

    public static InventoryResponse from(Inventory inv) {
        var r = new InventoryResponse();
        r.inventoryId   = inv.getId();
        r.productId     = inv.getProduct().getId();
        r.productName   = inv.getProduct().getName();
        r.productPrice  = inv.getProduct().getPrice();
        r.quantity      = inv.getQuantity();
        r.maxQuantity   = inv.getMaxQuantity();
        r.updatedAt     = inv.getUpdatedAt();
        if (inv.getQuantity() == 0) r.status = "OUT";
        else if (inv.getMaxQuantity() > 0 && inv.getQuantity() < inv.getMaxQuantity() * 0.3) r.status = "LOW";
        else r.status = "OK";
        return r;
    }
}

@Data
public class InventoryUpdateRequest {
    @NotNull @Min(0)
    public Integer quantity;
    @Min(0)
    public Integer maxQuantity;
}

// ─── IngredientStock ─────────────────────────────────────────

@Data
public class IngredientStockResponse {
    public Long stockId;
    public Long ingredientId;
    public String ingredientName;
    public String unit;
    public BigDecimal quantity;
    public BigDecimal minQuantity;
    public boolean belowMinimum;
    public LocalDateTime updatedAt;

    public static IngredientStockResponse from(IngredientStock s) {
        var r = new IngredientStockResponse();
        r.stockId       = s.getId();
        r.ingredientId  = s.getIngredient().getId();
        r.ingredientName= s.getIngredient().getName();
        r.unit          = s.getIngredient().getUnit();
        r.quantity      = s.getQuantity();
        r.minQuantity   = s.getIngredient().getMinQuantity();
        r.belowMinimum  = s.getQuantity().compareTo(s.getIngredient().getMinQuantity()) < 0;
        r.updatedAt     = s.getUpdatedAt();
        return r;
    }
}

@Data
public class IngredientStockUpdateRequest {
    @NotNull @DecimalMin("0")
    public BigDecimal quantity;
}

// ─── Sale ────────────────────────────────────────────────────

@Data
public class SaleRequest {
    @NotEmpty(message = "Informe ao menos um item")
    @Valid
    public List<SaleItemRequest> items;
    public String notes;
}

@Data
public class SaleItemRequest {
    @NotNull public Long productId;
    @NotNull @Min(1) public Integer quantity;
}

@Data
public class SaleItemResponse {
    public Long productId;
    public String productName;
    public Integer quantity;
    public BigDecimal unitPrice;
    public BigDecimal subtotal;

    public static SaleItemResponse from(SaleItem si) {
        var r = new SaleItemResponse();
        r.productId   = si.getProduct().getId();
        r.productName = si.getProduct().getName();
        r.quantity    = si.getQuantity();
        r.unitPrice   = si.getUnitPrice();
        r.subtotal    = si.getUnitPrice().multiply(BigDecimal.valueOf(si.getQuantity()));
        return r;
    }
}

@Data
public class SaleResponse {
    public Long id;
    public Long storeId;
    public String storeName;
    public BigDecimal total;
    public LocalDateTime soldAt;
    public String notes;
    public List<SaleItemResponse> items;

    public static SaleResponse from(Sale sale) {
        var r = new SaleResponse();
        r.id        = sale.getId();
        r.storeId   = sale.getStore().getId();
        r.storeName = sale.getStore().getName();
        r.total     = sale.getTotal();
        r.soldAt    = sale.getSoldAt();
        r.notes     = sale.getNotes();
        r.items     = sale.getItems().stream().map(SaleItemResponse::from).toList();
        return r;
    }
}

// ─── Dashboard ───────────────────────────────────────────────

@Data
public class DashboardResponse {
    public Long storeId;
    public String storeName;
    public BigDecimal totalToday;
    public Long salesCountToday;
    public List<InventoryResponse> lowStockProducts;
    public List<IngredientStockResponse> lowStockIngredients;
    public List<SaleResponse> recentSales;
}

// ─── User (DTO público — senha nunca incluída) ────────────────

@Data
public class UserResponse {
    public Long    id;
    public String  username;
    public String  role;
    public Long    storeId;
    public String  storeName;
    public Boolean active;

    public static UserResponse from(com.docegestao.entity.User u) {
        var r = new UserResponse();
        r.id        = u.getId();
        r.username  = u.getUsername();
        r.role      = u.getRole().name();
        r.storeId   = u.getStore() != null ? u.getStore().getId()   : null;
        r.storeName = u.getStore() != null ? u.getStore().getName() : null;
        r.active    = u.getActive();
        return r;
    }
}

// ─── Recipe (Ficha Técnica) ───────────────────────────────────

@Data
public class RecipeItemRequest {
    @NotNull public Long   ingredientId;
    @NotNull @DecimalMin("0.001") public BigDecimal quantity;
    @NotBlank @Size(max = 20)     public String unit;
}

@Data
public class RecipeItemResponse {
    public Long       id;
    public Long       ingredientId;
    public String     ingredientName;
    public BigDecimal quantity;
    public String     unit;

    public static RecipeItemResponse from(com.docegestao.entity.RecipeItem r) {
        var res = new RecipeItemResponse();
        res.id             = r.getId();
        res.ingredientId   = r.getIngredient().getId();
        res.ingredientName = r.getIngredient().getName();
        res.quantity       = r.getQuantity();
        res.unit           = r.getUnit();
        return res;
    }
}

// ─── Production Batch (Fornada) ───────────────────────────────

@Data
public class BatchItemRequest {
    @NotNull          public Long productId;
    @NotNull @Min(1)  public Integer quantity;
}

/**
 * Desvio de insumo: quantidade real usada difere da sugerida pela ficha técnica.
 * Se não informado, usa-se a quantidade sugerida.
 */
@Data
public class IngredientAdjustment {
    @NotNull public Long ingredientId;
    /** Quantidade real usada (pode ser maior ou menor que o sugerido) */
    @NotNull @DecimalMin("0") public BigDecimal actualQty;
}

@Data
public class FornadaRequest {
    @NotEmpty(message = "Informe ao menos um sabor na fornada")
    @Valid
    public List<BatchItemRequest> items;

    /** Ajustes de desvio opcionais — sobrescrevem a quantidade sugerida pela ficha técnica */
    public List<IngredientAdjustment> adjustments;

    public String notes;
}

@Data
public class BatchIngredientUsageResponse {
    public Long       ingredientId;
    public String     ingredientName;
    public String     unit;
    public BigDecimal suggestedQty;
    public BigDecimal actualQty;
    public BigDecimal deviation; // actualQty - suggestedQty

    public static BatchIngredientUsageResponse from(com.docegestao.entity.BatchIngredientUsage u) {
        var r = new BatchIngredientUsageResponse();
        r.ingredientId   = u.getIngredient().getId();
        r.ingredientName = u.getIngredient().getName();
        r.unit           = u.getUnit();
        r.suggestedQty   = u.getSuggestedQty();
        r.actualQty      = u.getActualQty();
        r.deviation      = u.getActualQty().subtract(u.getSuggestedQty());
        return r;
    }
}

@Data
public class BatchItemResponse {
    public Long   productId;
    public String productName;
    public Integer quantity;

    public static BatchItemResponse from(com.docegestao.entity.BatchItem bi) {
        var r = new BatchItemResponse();
        r.productId   = bi.getProduct().getId();
        r.productName = bi.getProduct().getName();
        r.quantity    = bi.getQuantity();
        return r;
    }
}

@Data
public class FornadaResponse {
    public Long       id;
    public Long       storeId;
    public String     storeName;
    public String     status;
    public String     notes;
    public Integer    totalItems;
    public String     producedAt;
    public List<BatchItemResponse>             items;
    public List<BatchIngredientUsageResponse>  ingredientUsages;

    public static FornadaResponse from(com.docegestao.entity.ProductionBatch b) {
        var r = new FornadaResponse();
        r.id             = b.getId();
        r.storeId        = b.getStore().getId();
        r.storeName      = b.getStore().getName();
        r.status         = b.getStatus().name();
        r.notes          = b.getNotes();
        r.totalItems     = b.getTotalItems();
        r.producedAt     = b.getProducedAt().toString();
        r.items          = b.getItems().stream().map(BatchItemResponse::from).toList();
        r.ingredientUsages = b.getIngredientUsages().stream()
                              .map(BatchIngredientUsageResponse::from).toList();
        return r;
    }
}

/**
 * Preview: retorna o consolidado de insumos sem gravar nada.
 * Usado pelo painel de resumo em tempo real no frontend.
 */
@Data
public class FornadaPreviewResponse {
    public List<IngredientNeedResponse> ingredients;
    public int totalItems;
    public int flavors;
    public boolean missingRecipe; // true se nenhum produto tem ficha técnica

    @Data
    public static class IngredientNeedResponse {
        public Long       ingredientId;
        public String     ingredientName;
        public String     unit;
        public BigDecimal suggestedQty;
        public BigDecimal stockAvailable;
        public boolean    insufficient;
    }
}
