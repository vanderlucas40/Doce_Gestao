package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
