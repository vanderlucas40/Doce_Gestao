package com.docegestao.security;

import com.docegestao.entity.User;
import com.docegestao.enums.Role;
import com.docegestao.repository.UserRepository;
import com.docegestao.service.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Componente que controllers e services usam para verificar
 * se o usuário autenticado tem permissão de acessar uma loja específica.
 *
 * ADMIN   → pode acessar qualquer loja
 * OPERATOR → só pode acessar a loja à qual está vinculado
 */
@Component
@RequiredArgsConstructor
public class StoreAccessGuard {

    private final UserRepository userRepository;

    /**
     * Lança BusinessException (403) se o usuário não puder acessar storeId.
     */
    public void check(Long storeId) {
        var auth     = SecurityContextHolder.getContext().getAuthentication();
        var username = auth.getName();

        User user = userRepository.findByUsernameAndActiveTrue(username).orElseThrow();

        if (user.getRole() == Role.ADMIN) return;

        if (user.getStore() == null || !user.getStore().getId().equals(storeId)) {
            throw new BusinessException("Acesso negado: você não tem permissão para esta loja");
        }
    }

    /**
     * Retorna o usuário autenticado no momento.
     */
    public User currentUser() {
        var username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsernameAndActiveTrue(username).orElseThrow();
    }
}
