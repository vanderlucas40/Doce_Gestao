package com.docegestao.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Registro de consumo real de insumo em uma fornada.
 * Guarda tanto o valor sugerido pela ficha técnica
 * quanto o valor real informado pelo padeiro (ajuste de desvio).
 */
@Entity
@Table(name = "batch_ingredient_usage")
@Getter @Setter @NoArgsConstructor
public class BatchIngredientUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "batch_id", nullable = false)
    private ProductionBatch batch;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    /** Quantidade sugerida pela ficha técnica (soma de todos os sabores) */
    @Column(name = "suggested_qty", nullable = false, precision = 10, scale = 4)
    private BigDecimal suggestedQty;

    /** Quantidade real informada pelo padeiro (pode diferir da sugerida) */
    @Column(name = "actual_qty", nullable = false, precision = 10, scale = 4)
    private BigDecimal actualQty;

    @Column(nullable = false, length = 20)
    private String unit;
}
