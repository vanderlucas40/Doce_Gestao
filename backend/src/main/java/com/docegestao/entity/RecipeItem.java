package com.docegestao.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Ficha Técnica: define quanto de um insumo é necessário
 * para produzir 1 unidade de um produto (sabor de bolo).
 *
 * Ex: 1 Bolo de Cenoura → 0.5 kg de Farinha de Trigo
 */
@Entity
@Table(name = "recipe_items",
       uniqueConstraints = @UniqueConstraint(columnNames = {"product_id","ingredient_id"}))
@Getter @Setter @NoArgsConstructor
public class RecipeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    /** Quantidade do insumo necessária para produzir 1 unidade do produto */
    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal quantity;

    /** Unidade de medida desta quantidade (kg, litro, unidade, dúzia...) */
    @Column(nullable = false, length = 20)
    private String unit;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = LocalDateTime.now(); }
}
