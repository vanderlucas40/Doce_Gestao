package com.docegestao.service;

import com.docegestao.dto.PageResponse;
import com.docegestao.dto.StockMovementResponse;
import com.docegestao.entity.*;
import com.docegestao.repository.StockMovementRepository;
import com.docegestao.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/** Trilha dos ajustes manuais de estoque (motivo, autor, saldo anterior e novo). */
@Service
@RequiredArgsConstructor
public class StockMovementService {

    public static final int MAX_PAGE_SIZE = 100;

    private final StockMovementRepository repository;
    private final UserRepository          userRepository;

    /** Registra o ajuste de produto; não grava nada se a quantidade não mudou. */
    public void recordProduct(Store store, Product product, BigDecimal previous, BigDecimal current, String reason) {
        var m = base(store, StockMovement.ItemType.PRODUCT, previous, current, reason);
        if (m == null) return;
        m.setProduct(product);
        repository.save(m);
    }

    /** Registra o ajuste de insumo; não grava nada se a quantidade não mudou. */
    public void recordIngredient(Store store, Ingredient ingredient, BigDecimal previous, BigDecimal current, String reason) {
        var m = base(store, StockMovement.ItemType.INGREDIENT, previous, current, reason);
        if (m == null) return;
        m.setIngredient(ingredient);
        repository.save(m);
    }

    @Transactional(readOnly = true)
    public PageResponse<StockMovementResponse> findByStore(Long storeId, int page, int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        return PageResponse.of(repository.findByStoreIdOrderByCreatedAtDescIdDesc(storeId, pageable),
                StockMovementResponse::from);
    }

    private StockMovement base(Store store, StockMovement.ItemType type,
                               BigDecimal previous, BigDecimal current, String reason) {
        if (previous.compareTo(current) == 0) return null;
        var m = new StockMovement();
        m.setStore(store);
        m.setItemType(type);
        m.setPreviousQty(previous);
        m.setNewQty(current);
        m.setReason(reason == null || reason.isBlank() ? null : reason.trim());
        m.setUser(currentUser());
        return m;
    }

    private User currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        return userRepository.findByUsernameAndActiveTrue(auth.getName()).orElse(null);
    }
}
