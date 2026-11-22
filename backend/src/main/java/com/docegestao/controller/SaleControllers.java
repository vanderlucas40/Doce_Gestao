package com.docegestao.controller;

import com.docegestao.dto.DashboardResponse;
import com.docegestao.dto.SaleRequest;
import com.docegestao.dto.SaleResponse;
import com.docegestao.security.StoreAccessGuard;
import com.docegestao.service.SaleService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/stores/{storeId}/sales")
@RequiredArgsConstructor
@Validated
class SaleController {

    private final SaleService      saleService;
    private final StoreAccessGuard guard;

    /** Lista todas as vendas da loja (sem paginação — uso interno/dashboard) */
    @GetMapping
    public List<SaleResponse> findByStore(@PathVariable Long storeId) {
        guard.check(storeId);
        return saleService.findByStore(storeId);
    }

    /** Vendas de um dia específico (usado pelo Dashboard) */
    @GetMapping("/by-date")
    public List<SaleResponse> findByDate(
            @PathVariable Long storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        guard.check(storeId);
        return saleService.findByStoreAndDate(storeId, date);
    }

    /**
     * Vendas de um intervalo de datas (usado pelo Relatórios).
     * Máximo de 366 dias para evitar queries excessivas.
     * Substitui N chamadas a /by-date com uma única chamada de range.
     *
     * Exemplo: GET /stores/1/sales/by-range?from=2025-01-01&to=2025-01-31
     */
    @GetMapping("/by-range")
    public List<SaleResponse> findByRange(
            @PathVariable Long storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        guard.check(storeId);

        // Validação de intervalo no servidor
        if (from.isAfter(to)) {
            throw new com.docegestao.service.BusinessException(
                "A data inicial não pode ser posterior à data final."
            );
        }
        if (from.plusDays(366).isBefore(to)) {
            throw new com.docegestao.service.BusinessException(
                "O intervalo máximo permitido é de 366 dias."
            );
        }

        return saleService.findByStoreAndRange(storeId, from, to);
    }

    /** Registra uma venda e desconta estoque atomicamente */
    @PostMapping
    public ResponseEntity<SaleResponse> register(
            @PathVariable Long storeId,
            @Valid @RequestBody SaleRequest req) {
        guard.check(storeId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(saleService.register(storeId, req));
    }
}

@RestController
@RequestMapping("/stores/{storeId}/dashboard")
@RequiredArgsConstructor
class DashboardController {

    private final SaleService      saleService;
    private final StoreAccessGuard guard;

    @GetMapping
    public DashboardResponse getDashboard(@PathVariable Long storeId) {
        guard.check(storeId);
        return saleService.getDashboard(storeId);
    }
}
