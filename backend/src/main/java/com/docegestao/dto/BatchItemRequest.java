package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BatchItemRequest {
    @NotNull          public Long productId;
    @NotNull @Min(1)  public Integer quantity;
}
