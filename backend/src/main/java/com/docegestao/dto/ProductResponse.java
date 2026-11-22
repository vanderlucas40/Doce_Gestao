package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProductResponse {
    public Long id;
    public String name;
    public String description;
    public BigDecimal price;
    public Boolean active;

    public static ProductResponse from(Product p) {
        var r = new ProductResponse();
        r.id          = p.getId();
        r.name        = p.getName();
        r.description = p.getDescription();
        r.price       = p.getPrice();
        r.active      = p.getActive();
        return r;
    }
}
