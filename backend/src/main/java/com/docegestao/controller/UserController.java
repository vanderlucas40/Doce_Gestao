package com.docegestao.controller;

import com.docegestao.entity.User;
import com.docegestao.repository.UserRepository;
import com.docegestao.service.ResourceNotFoundException;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Data
    public static class UserResponse {
        Long   id;
        String username;
        String role;
        Long   storeId;
        String storeName;
        Boolean active;

        static UserResponse from(User u) {
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

    @Data
    public static class ChangePasswordRequest {
        String newPassword;
    }

    @GetMapping
    public List<UserResponse> list() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    @GetMapping("/{id}")
    public UserResponse getById(@PathVariable Long id) {
        return UserResponse.from(getOrThrow(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        var user = getOrThrow(id);
        // O administrador não pode se desativar: perderia o acesso e a loja poderia ficar sem admin (DEF-21)
        var current = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        if (user.getUsername().equals(current)) {
            throw new com.docegestao.service.BusinessException("Você não pode desativar o próprio usuário.");
        }
        user.setActive(false);
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/password")
    public ResponseEntity<Void> changePassword(
            @PathVariable Long id,
            @RequestBody ChangePasswordRequest req) {
        var user = getOrThrow(id);
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }

    private User getOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + id));
    }
}
