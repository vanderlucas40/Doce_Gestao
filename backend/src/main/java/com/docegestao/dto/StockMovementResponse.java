package com.docegestao.dto;

import com.docegestao.entity.StockMovement;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class StockMovementResponse {
    public Long          id;
    public String        itemType;
    public Long          itemId;
    public String        itemName;
    public BigDecimal    previousQty;
    public BigDecimal    newQty;
    public BigDecimal    difference;
    public String        reason;
    public String        username;
    public LocalDateTime createdAt;

    public static StockMovementResponse from(StockMovement m) {
        var r = new StockMovementResponse();
        r.id          = m.getId();
        r.itemType    = m.getItemType().name();
        boolean produto = m.getItemType() == StockMovement.ItemType.PRODUCT;
        r.itemId      = produto ? m.getProduct().getId()   : m.getIngredient().getId();
        r.itemName    = produto ? m.getProduct().getName() : m.getIngredient().getName();
        r.previousQty = m.getPreviousQty();
        r.newQty      = m.getNewQty();
        r.difference  = m.getNewQty().subtract(m.getPreviousQty());
        r.reason      = m.getReason();
        r.username    = m.getUser() != null ? m.getUser().getUsername() : null;
        r.createdAt   = m.getCreatedAt();
        return r;
    }
}
