package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class RecipeItemRequest {
    @NotNull public Long   ingredientId;
    @NotNull @DecimalMin("0.001") public BigDecimal quantity;
    @NotBlank @Size(max = 20)     public String unit;
}
