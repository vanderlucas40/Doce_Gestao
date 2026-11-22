package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class StoreResponse {
    public Long id;
    public String name;
    public String address;
    public String phone;
    public Boolean active;

    public static StoreResponse from(Store s) {
        var r = new StoreResponse();
        r.id      = s.getId();
        r.name    = s.getName();
        r.address = s.getAddress();
        r.phone   = s.getPhone();
        r.active  = s.getActive();
        return r;
    }
}
