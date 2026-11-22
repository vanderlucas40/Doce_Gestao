package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class IngredientStockUpdateRequest {
    @NotNull @DecimalMin("0")
    public BigDecimal quantity;

    /** Motivo do ajuste manual (ex.: Avaria / Perda), gravado em stock_movements */
    @Size(max = 255)
    public String reason;
}
