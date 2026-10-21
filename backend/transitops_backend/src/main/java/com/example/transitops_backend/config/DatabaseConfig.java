package com.example.transitops_backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${SPRING_DATASOURCE_URL:${DATABASE_URL:}}")
    private String rawUrl;

    @Value("${SPRING_DATASOURCE_USERNAME:${DATABASE_USERNAME:}}")
    private String explicitUsername;

    @Value("${SPRING_DATASOURCE_PASSWORD:${DATABASE_PASSWORD:}}")
    private String explicitPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        String url = StringUtils.hasText(rawUrl) ? rawUrl.trim() : "";
        String username = StringUtils.hasText(explicitUsername) ? explicitUsername.trim() : null;
        String password = StringUtils.hasText(explicitPassword) ? explicitPassword.trim() : null;
        String driverClassName = null;

        if (!StringUtils.hasText(url)) {
            log.info("No external datasource URL configured. Falling back to in-memory H2 database.");
            url = "jdbc:h2:mem:transitops_db;DB_CLOSE_DELAY=-1;MODE=MySQL;DATABASE_TO_LOWER=TRUE";
            username = "sa";
            password = "";
            driverClassName = "org.h2.Driver";
        } else if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
            try {
                // Parse standard URI: postgres://user:password@host:port/dbname
                String cleanUri = url.replace("postgres://", "http://").replace("postgresql://", "http://");
                URI uri = new URI(cleanUri);
                if (uri.getUserInfo() != null) {
                    String[] parts = uri.getUserInfo().split(":", 2);
                    if (!StringUtils.hasText(username)) username = parts[0];
                    if (!StringUtils.hasText(password) && parts.length > 1) password = parts[1];
                }
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                url = "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getPath();
                if (StringUtils.hasText(uri.getQuery())) {
                    url += "?" + uri.getQuery();
                }
                driverClassName = "org.postgresql.Driver";
                log.info("Auto-converted PostgreSQL URL to JDBC format: {}", url);
            } catch (Exception e) {
                log.warn("Failed to parse PostgreSQL URI, prepending 'jdbc:': {}", e.getMessage());
                url = "jdbc:" + url;
                driverClassName = "org.postgresql.Driver";
            }
        } else if (url.startsWith("mysql://")) {
            try {
                // Parse standard URI: mysql://user:password@host:port/dbname
                String cleanUri = url.replace("mysql://", "http://");
                URI uri = new URI(cleanUri);
                if (uri.getUserInfo() != null) {
                    String[] parts = uri.getUserInfo().split(":", 2);
                    if (!StringUtils.hasText(username)) username = parts[0];
                    if (!StringUtils.hasText(password) && parts.length > 1) password = parts[1];
                }
                int port = uri.getPort() > 0 ? uri.getPort() : 3306;
                url = "jdbc:mysql://" + uri.getHost() + ":" + port + uri.getPath();
                if (StringUtils.hasText(uri.getQuery())) {
                    url += "?" + uri.getQuery();
                }
                driverClassName = "com.mysql.cj.jdbc.Driver";
                log.info("Auto-converted MySQL URL to JDBC format: {}", url);
            } catch (Exception e) {
                log.warn("Failed to parse MySQL URI, prepending 'jdbc:': {}", e.getMessage());
                url = "jdbc:" + url;
                driverClassName = "com.mysql.cj.jdbc.Driver";
            }
        } else if (url.startsWith("jdbc:postgresql:")) {
            driverClassName = "org.postgresql.Driver";
        } else if (url.startsWith("jdbc:mysql:")) {
            driverClassName = "com.mysql.cj.jdbc.Driver";
        } else if (url.startsWith("jdbc:h2:")) {
            driverClassName = "org.h2.Driver";
        }

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        if (StringUtils.hasText(username)) {
            config.setUsername(username);
        }
        if (password != null) {
            config.setPassword(password);
        }
        if (StringUtils.hasText(driverClassName)) {
            config.setDriverClassName(driverClassName);
        }

        // Hikari pool resilience settings for cloud network latency
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(1);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);

        log.info("Configured HikariDataSource connected to: {} (user: {})", url, username != null ? username : "[none]");
        return new HikariDataSource(config);
    }
}
