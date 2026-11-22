package com.docegestao.enums;

/**
 * Perfis de acesso do sistema.
 *
 * ADMIN    → acesso total: todas as lojas, cadastros, usuários, relatórios.
 * OPERATOR → acesso restrito à loja vinculada: PDV, estoque e dashboard.
 */
public enum Role {
    ADMIN,
    OPERATOR
}
