package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BatchItemResponse {
    public Long   productId;
    public String productName;
    public Integer quantity;

    public static BatchItemResponse from(com.docegestao.entity.BatchItem bi) {
        var r = new BatchItemResponse();
        r.productId   = bi.getProduct().getId();
        r.productName = bi.getProduct().getName();
        r.quantity    = bi.getQuantity();
        return r;
    }
}
