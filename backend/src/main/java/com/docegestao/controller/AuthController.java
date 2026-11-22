package com.docegestao.controller;

import com.docegestao.security.AuthService;
import com.docegestao.security.AuthService.AuthResponse;
import com.docegestao.security.AuthService.LoginRequest;
import com.docegestao.security.AuthService.RegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/login
     * Body: { "username": "admin", "password": "123456" }
     * Retorna: { "token": "eyJ...", "role": "ADMIN", ... }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    /**
     * POST /api/auth/register
     * Apenas ADMIN pode criar novos usuários.
     * Body: { "username": "maria", "password": "senha123", "role": "OPERATOR", "storeId": 1 }
     */
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }
}
