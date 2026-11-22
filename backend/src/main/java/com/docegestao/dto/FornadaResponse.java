package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class FornadaResponse {
    public Long       id;
    public Long       storeId;
    public String     storeName;
    public String     status;
    public String     notes;
    public Integer    totalItems;
    public String     producedAt;
    public List<BatchItemResponse>             items;
    public List<BatchIngredientUsageResponse>  ingredientUsages;

    public static FornadaResponse from(com.docegestao.entity.ProductionBatch b) {
        var r = new FornadaResponse();
        r.id             = b.getId();
        r.storeId        = b.getStore().getId();
        r.storeName      = b.getStore().getName();
        r.status         = b.getStatus().name();
        r.notes          = b.getNotes();
        r.totalItems     = b.getTotalItems();
        r.producedAt     = b.getProducedAt().toString();
        r.items          = b.getItems().stream().map(BatchItemResponse::from).toList();
        r.ingredientUsages = b.getIngredientUsages().stream()
                              .map(BatchIngredientUsageResponse::from).toList();
        return r;
    }
}
