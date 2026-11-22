package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class SaleItemResponse {
    public Long productId;
    public String productName;
    public Integer quantity;
    public BigDecimal unitPrice;
    public BigDecimal subtotal;

    public static SaleItemResponse from(SaleItem si) {
        var r = new SaleItemResponse();
        r.productId   = si.getProduct().getId();
        r.productName = si.getProduct().getName();
        r.quantity    = si.getQuantity();
        r.unitPrice   = si.getUnitPrice();
        r.subtotal    = si.getUnitPrice().multiply(BigDecimal.valueOf(si.getQuantity()));
        return r;
    }
}
