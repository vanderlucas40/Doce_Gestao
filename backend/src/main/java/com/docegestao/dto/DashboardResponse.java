package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class DashboardResponse {
    public Long storeId;
    public String storeName;
    public BigDecimal totalToday;
    public Long salesCountToday;
    public List<InventoryResponse> lowStockProducts;
    public List<IngredientStockResponse> lowStockIngredients;
    public List<SaleResponse> recentSales;
}
