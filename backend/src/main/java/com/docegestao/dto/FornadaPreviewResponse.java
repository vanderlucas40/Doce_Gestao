package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
