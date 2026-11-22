package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class SaleRequest {
    @NotEmpty(message = "Informe ao menos um item")
    @Valid
    public List<SaleItemRequest> items;
    public String notes;
}
