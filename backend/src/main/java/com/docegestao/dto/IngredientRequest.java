package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class IngredientRequest {
    @NotBlank @Size(max = 100)
    public String name;
    @NotBlank @Size(max = 20)
    public String unit;
    @NotNull @DecimalMin("0")
    public BigDecimal minQuantity;
}
