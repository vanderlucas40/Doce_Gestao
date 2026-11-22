package com.docegestao.security;

import com.docegestao.entity.User;
import com.docegestao.enums.Role;
import com.docegestao.repository.StoreRepository;
import com.docegestao.repository.UserRepository;
import com.docegestao.service.BusinessException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository         userRepository;
    private final StoreRepository        storeRepository;
    private final PasswordEncoder        passwordEncoder;
    private final JwtService             jwtService;
    private final AuthenticationManager  authManager;
    private final UserDetailsServiceImpl userDetailsService;

    @Data
    public static class LoginRequest {
        @NotBlank public String username;
        @NotBlank public String password;
    }

    @Data
    public static class RegisterRequest {
        @NotBlank @Size(min = 3, max = 80)
        public String username;
        @NotBlank @Size(min = 6)
        public String password;
        public Role role    = Role.OPERATOR;
        public Long storeId;
    }

    public record AuthResponse(
        String token,
        String username,
        String role,
        Long   storeId,
        String storeName
    ) {}

    public AuthResponse login(LoginRequest req) {
        try {
            authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword())
            );
        } catch (AuthenticationException e) {
            throw new BusinessException("Usuário ou senha inválidos");
        }

        var user        = userRepository.findByUsernameAndActiveTrue(req.getUsername()).orElseThrow();
        var userDetails = userDetailsService.loadUserByUsername(req.getUsername());

        var claims = Map.<String, Object>of(
            "role",    user.getRole().name(),
            "storeId", user.getStore() != null ? user.getStore().getId() : ""
        );

        String token = jwtService.generateToken(userDetails, claims);

        return new AuthResponse(
            token,
            user.getUsername(),
            user.getRole().name(),
            user.getStore() != null ? user.getStore().getId()   : null,
            user.getStore() != null ? user.getStore().getName() : null
        );
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new BusinessException("Nome de usuário já está em uso");
        }
        if (req.getRole() == Role.OPERATOR && req.getStoreId() == null) {
            throw new BusinessException("Operadores precisam ter uma loja associada");
        }

        var user = new User();
        user.setUsername(req.getUsername());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(req.getRole());

        if (req.getStoreId() != null) {
            var store = storeRepository.findById(req.getStoreId())
                .orElseThrow(() -> new BusinessException("Loja não encontrada: " + req.getStoreId()));
            user.setStore(store);
        }

        userRepository.save(user);

        var loginReq = new LoginRequest();
        loginReq.username = req.getUsername();
        loginReq.password = req.getPassword();
        return login(loginReq);
    }
}
