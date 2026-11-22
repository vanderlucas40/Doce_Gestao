package com.docegestao.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory",
       uniqueConstraints = @UniqueConstraint(columnNames = {"store_id", "product_id"}))
@Getter @Setter @NoArgsConstructor
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity = 0;

    @Column(name = "max_quantity", nullable = false)
    private Integer maxQuantity = 0;

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
