package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class FornadaRequest {
    @NotEmpty(message = "Informe ao menos um sabor na fornada")
    @Valid
    public List<BatchItemRequest> items;

    /** Ajustes de desvio opcionais — sobrescrevem a quantidade sugerida pela ficha técnica */
    @Valid
    public List<IngredientAdjustment> adjustments;

    public String notes;
}
