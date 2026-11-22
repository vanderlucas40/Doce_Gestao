package com.docegestao.config;

import com.docegestao.service.BusinessException;
import com.docegestao.service.ResourceNotFoundException;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ─── 404 ─────────────────────────────────────────────────
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return body(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    // ─── 422 Regra de negócio ─────────────────────────────────
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, Object>> handleBusiness(BusinessException ex) {
        return body(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
    }

    // ─── 400 Validação de campos ──────────────────────────────
    // Retorna a mensagem do PRIMEIRO campo inválido como `message` (Toast)
    // e a lista completa em `fields` (uso futuro em formulários inline)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        var fields = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        f -> f.getDefaultMessage() != null ? f.getDefaultMessage() : "Valor inválido",
                        (a, b) -> a
                ));

        // Primeira mensagem de campo como mensagem principal (aparece no Toast)
        String firstMessage = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(f -> f.getDefaultMessage() != null ? f.getDefaultMessage() : "Campo inválido: " + f.getField())
                .orElse("Erro de validação");

        var map = base(HttpStatus.BAD_REQUEST, firstMessage);
        map.put("fields", fields);
        return ResponseEntity.badRequest().body(map);
    }

    // ─── 409 Conflito de concorrência no estoque (R04) ───────
    // Duas operações gravaram o mesmo saldo ao mesmo tempo; a segunda é desfeita inteira
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, Object>> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        return body(HttpStatus.CONFLICT,
                "O estoque foi alterado por outra operação ao mesmo tempo. Confira o saldo e tente novamente.");
    }

    // ─── 409 Violação de integridade do banco ─────────────────
    // Cobre: Duplicate Entry, FK violation, NOT NULL constraint
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        String msg = extractDataIntegrityMessage(ex);
        return body(HttpStatus.CONFLICT, msg);
    }

    // ─── 401 Credenciais inválidas ────────────────────────────
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return body(HttpStatus.UNAUTHORIZED, "Usuário ou senha inválidos");
    }

    // ─── 401 JWT expirado ─────────────────────────────────────
    @ExceptionHandler(ExpiredJwtException.class)
    public ResponseEntity<Map<String, Object>> handleExpiredJwt(ExpiredJwtException ex) {
        return body(HttpStatus.UNAUTHORIZED, "Sessão expirada. Faça login novamente.");
    }

    // ─── 401 JWT malformado ───────────────────────────────────
    @ExceptionHandler(JwtException.class)
    public ResponseEntity<Map<String, Object>> handleJwt(JwtException ex) {
        return body(HttpStatus.UNAUTHORIZED, "Token inválido.");
    }

    // ─── 403 Sem permissão ────────────────────────────────────
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(AccessDeniedException ex) {
        return body(HttpStatus.FORBIDDEN, "Você não tem permissão para esta operação.");
    }

    // ─── 500 Genérico (última linha de defesa) ────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        // Log interno para diagnóstico — não vaza stack trace para o cliente
        System.err.println("[GlobalExceptionHandler] Unhandled: " + ex.getClass().getName() + ": " + ex.getMessage());
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Ocorreu um erro interno. Tente novamente.");
    }

    // ─── Helpers ─────────────────────────────────────────────

    /**
     * Traduz mensagens de constraint do banco para mensagens amigáveis.
     * Inspeciona a causa raiz para obter detalhes da constraint violada.
     */
    private String extractDataIntegrityMessage(DataIntegrityViolationException ex) {
        Throwable cause = ex.getMostSpecificCause();
        String causeMsg = cause.getMessage() != null ? cause.getMessage().toLowerCase() : "";

        // Duplicate entry (MySQL: "Duplicate entry 'X' for key 'Y'")
        if (causeMsg.contains("duplicate entry")) {
            if (causeMsg.contains("username"))    return "Este nome de usuário já está em uso.";
            if (causeMsg.contains("uq_store_product"))    return "Este produto já está cadastrado nesta loja.";
            if (causeMsg.contains("uq_store_ingredient")) return "Este insumo já está cadastrado nesta loja.";
            // Fallback: extrai o valor duplicado da mensagem original
            return "Este registro já existe. Verifique os dados e tente novamente.";
        }

        // NOT NULL constraint
        if (causeMsg.contains("cannot be null") || causeMsg.contains("not null")) {
            return "Um campo obrigatório não foi preenchido.";
        }

        // Foreign key constraint
        if (causeMsg.contains("foreign key") || causeMsg.contains("constraint")) {
            if (causeMsg.contains("fk_user_store")) return "Loja não encontrada ou inativa.";
            if (causeMsg.contains("fk_inv_store"))  return "Loja não encontrada.";
            return "Referência inválida. Verifique os dados relacionados.";
        }

        // Data too long
        if (causeMsg.contains("data too long")) {
            return "Um dos campos excedeu o tamanho máximo permitido.";
        }

        return "Erro de integridade dos dados. Verifique as informações e tente novamente.";
    }

    private Map<String, Object> base(HttpStatus status, String message) {
        var map = new LinkedHashMap<String, Object>();
        map.put("status",    status.value());
        map.put("error",     status.getReasonPhrase());
        map.put("message",   message);
        map.put("timestamp", LocalDateTime.now().toString());
        return map;
    }

    private ResponseEntity<Map<String, Object>> body(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(base(status, message));
    }
}
