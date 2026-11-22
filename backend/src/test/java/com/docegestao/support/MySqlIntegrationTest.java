package com.docegestao.support;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base dos testes de integração: sobe um MySQL 8 real em contêiner, aplica as
 * migrações Flyway (com ddl-auto=validate) e carrega o contexto Spring completo.
 *
 * Exige Docker na máquina; sem Docker, os testes que herdam desta classe são
 * ignorados (disabledWithoutDocker) e os testes unitários continuam rodando.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@TestPropertySource(properties = {
        "jwt.secret=segredo-de-teste-com-mais-de-32-bytes-0123456789",
        "app.seed.enabled=false"
})
public abstract class MySqlIntegrationTest {

    /**
     * Um único contêiner para toda a suíte (padrão singleton): o contexto Spring
     * fica em cache entre as classes de teste e precisa que o banco continue no ar.
     * O Ryuk do Testcontainers remove o contêiner ao fim da JVM.
     */
    @ServiceConnection
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0");

    static {
        MYSQL.start();
    }
}
