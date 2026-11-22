package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
