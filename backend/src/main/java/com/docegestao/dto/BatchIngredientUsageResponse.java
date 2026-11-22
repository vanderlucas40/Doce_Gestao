package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
