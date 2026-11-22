package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class SaleResponse {
    public Long id;
    public Long storeId;
    public String storeName;
    public BigDecimal total;
    public LocalDateTime soldAt;
    public String notes;
    public List<SaleItemResponse> items;

    public static SaleResponse from(Sale sale) {
        var r = new SaleResponse();
        r.id        = sale.getId();
        r.storeId   = sale.getStore().getId();
        r.storeName = sale.getStore().getName();
        r.total     = sale.getTotal();
        r.soldAt    = sale.getSoldAt();
        r.notes     = sale.getNotes();
        r.items     = sale.getItems().stream().map(SaleItemResponse::from).toList();
        return r;
    }
}
