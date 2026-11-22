package com.docegestao.dto;

import com.docegestao.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class UserResponse {
    public Long    id;
    public String  username;
    public String  role;
    public Long    storeId;
    public String  storeName;
    public Boolean active;

    public static UserResponse from(com.docegestao.entity.User u) {
        var r = new UserResponse();
        r.id        = u.getId();
        r.username  = u.getUsername();
        r.role      = u.getRole().name();
        r.storeId   = u.getStore() != null ? u.getStore().getId()   : null;
        r.storeName = u.getStore() != null ? u.getStore().getName() : null;
        r.active    = u.getActive();
        return r;
    }
}
