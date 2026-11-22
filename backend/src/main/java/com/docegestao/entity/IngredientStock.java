package com.docegestao.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ingredient_stock",
       uniqueConstraints = @UniqueConstraint(columnNames = {"store_id", "ingredient_id"}))
@Getter @Setter @NoArgsConstructor
public class IngredientStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    /**
     * Bloqueio otimista (R04): o UPDATE leva "WHERE version = ?"; se outra transação
     * gravou antes, lança ObjectOptimisticLockingFailureException e nada é gravado.
     * Long (e não long): versão nula identifica registro novo para o Spring Data.
     */
    @Version
    private Long version;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
