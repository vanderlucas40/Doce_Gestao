package com.docegestao.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;

/**
 * Respostas JSON do Spring Security no mesmo contrato do GlobalExceptionHandler
 * ({ status, error, message, timestamp }).
 *
 * Sem um AuthenticationEntryPoint, o Spring Security responde 403 sem corpo a
 * requisições não autenticadas; o frontend só redireciona ao login em 401 (DEF-02).
 */
@Component
@RequiredArgsConstructor
public class JsonSecurityHandlers {

    /** Atributo marcado pelo JwtAuthFilter quando havia um token, mas ele foi rejeitado. */
    public static final String INVALID_TOKEN_ATTR = "docegestao.invalidToken";

    private final ObjectMapper objectMapper;

    /** 401 — token ausente, malformado, expirado ou de usuário desativado. */
    public AuthenticationEntryPoint entryPoint() {
        return (request, response, ex) -> {
            String msg = request.getAttribute(INVALID_TOKEN_ATTR) != null
                    ? "Sessão expirada. Faça login novamente."
                    : "Autenticação necessária. Faça login.";
            write(response, HttpStatus.UNAUTHORIZED, msg);
        };
    }

    /** 403 — autenticado, mas sem o perfil exigido pela rota. */
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, ex) ->
                write(response, HttpStatus.FORBIDDEN, "Você não tem permissão para esta operação.");
    }

    private void write(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        var body = new LinkedHashMap<String, Object>();
        body.put("status",    status.value());
        body.put("error",     status.getReasonPhrase());
        body.put("message",   message);
        body.put("timestamp", LocalDateTime.now().toString());

        response.setStatus(status.value());
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), body);
    }

    static void markInvalidToken(HttpServletRequest request) {
        request.setAttribute(INVALID_TOKEN_ATTR, Boolean.TRUE);
    }
}
