package com.docegestao.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity          // habilita @PreAuthorize nos controllers
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter       jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;
    private final JsonSecurityHandlers   securityHandlers;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // 401 para não autenticado, 403 para perfil insuficiente, ambos em JSON (DEF-02)
            .exceptionHandling(e -> e
                .authenticationEntryPoint(securityHandlers.entryPoint())
                .accessDeniedHandler(securityHandlers.accessDeniedHandler()))
            .authorizeHttpRequests(auth -> auth

                // ── Rotas públicas ──────────────────────────────────
                .requestMatchers("/auth/**").permitAll()

                // ── Rotas exclusivas de ADMIN ───────────────────────
                // Criar/excluir lojas, produtos e insumos
                .requestMatchers(HttpMethod.POST,   "/stores").hasRole("ADMIN")
                // "/stores/*" casa só /stores/{id}; as sub-rotas da loja
                // (/stores/{id}/inventory/..., /ingredient-stock/...) ficam
                // liberadas ao operador e protegidas pelo StoreAccessGuard (DEF-01)
                .requestMatchers(HttpMethod.PUT,    "/stores/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/stores/*").hasRole("ADMIN")

                .requestMatchers(HttpMethod.POST,   "/products").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/products/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.POST,   "/ingredients").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/ingredients/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/ingredients/**").hasRole("ADMIN")

                // Gerenciamento de usuários
                .requestMatchers("/users/**").hasRole("ADMIN")

                // ── Ficha Técnica: edição só por ADMIN ─────────────
                .requestMatchers(HttpMethod.PUT,    "/products/*/recipe/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/products/*/recipe/**").hasRole("ADMIN")

                // ── Tudo mais exige login (ADMIN ou OPERATOR) ───────
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        var provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
