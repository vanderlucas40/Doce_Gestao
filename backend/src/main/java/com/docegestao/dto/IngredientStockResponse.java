package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
