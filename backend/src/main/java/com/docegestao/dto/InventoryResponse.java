package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class InventoryResponse {
    public Long inventoryId;
    public Long productId;
    public String productName;
    public BigDecimal productPrice;
    public Integer quantity;
    public Integer maxQuantity;
    public String status; // OK | LOW | OUT
    public LocalDateTime updatedAt;

    public static InventoryResponse from(Inventory inv) {
        var r = new InventoryResponse();
        r.inventoryId   = inv.getId();
        r.productId     = inv.getProduct().getId();
        r.productName   = inv.getProduct().getName();
        r.productPrice  = inv.getProduct().getPrice();
        r.quantity      = inv.getQuantity();
        r.maxQuantity   = inv.getMaxQuantity();
        r.updatedAt     = inv.getUpdatedAt();
        if (inv.getQuantity() == 0) r.status = "OUT";
        else if (inv.getMaxQuantity() > 0 && inv.getQuantity() < inv.getMaxQuantity() * 0.3) r.status = "LOW";
        else r.status = "OK";
        return r;
    }
}
