package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
