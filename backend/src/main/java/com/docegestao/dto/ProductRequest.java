package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProductRequest {
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100)
    public String name;
    public String description;
    @NotNull @DecimalMin("0.01")
    public BigDecimal price;
}
