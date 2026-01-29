package com.smartsupply.config;

import com.smartsupply.repository.UserRepository;
import com.smartsupply.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security Configuration - Defines authentication and authorization rules.
 * 
 * This is the equivalent of:
 * - NestJS AuthModule configuration
 * - Passport configuration
 * - Guards configuration
 * 
 * Key concepts:
 * - SecurityFilterChain: Defines which endpoints need authentication
 * - AuthenticationProvider: How to authenticate users
 * - PasswordEncoder: How to hash/verify passwords (like Argon2 in NestJS)
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserRepository userRepository;

    // @Lazy breaks the circular dependency between JwtAuthFilter <-> SecurityConfig
    public SecurityConfig(@Lazy JwtAuthFilter jwtAuthFilter, UserRepository userRepository) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userRepository = userRepository;
    }

    /**
     * UserDetailsService - Loads user from database.
     * 
     * This is called by Spring Security when authenticating.
     * Similar to NestJS LocalStrategy calling validateUser().
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    /**
     * Security filter chain - Defines security rules.
     * 
     * This is like configuring which routes need @UseGuards(JwtAuthGuard) in NestJS,
     * but done globally here.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Enable CORS for frontend
                .cors(cors -> cors.configurationSource(request -> {
                    var config = new org.springframework.web.cors.CorsConfiguration();
                    config.setAllowedOrigins(java.util.List.of("http://localhost:5173"));
                    config.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    config.setAllowedHeaders(java.util.List.of("*"));
                    config.setAllowCredentials(true);
                    return config;
                }))
                
                // Disable CSRF (not needed for stateless JWT)
                .csrf(AbstractHttpConfigurer::disable)
                
                // Configure endpoint authorization
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints (no auth required)
                        .requestMatchers("/auth/register", "/auth/login").permitAll()
                        .requestMatchers("/products/**").permitAll()  // TODO: protect in production
                        .requestMatchers("/warehouses/**").permitAll()  // TODO: protect in production
                        .requestMatchers("/inventory/**").permitAll()  // TODO: protect in production
                        
                        // All other endpoints require authentication
                        .anyRequest().authenticated()
                )
                
                // Use stateless sessions (JWT, no cookies)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                
                // Use our custom authentication provider
                .authenticationProvider(authenticationProvider())
                
                // Add JWT filter before Spring's authentication filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Authentication provider - Defines how to authenticate.
     * 
     * Uses UserDetailsService to load user and PasswordEncoder to verify password.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * Authentication manager - Required for login endpoint.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Password encoder - BCrypt for hashing passwords.
     * 
     * NestJS uses Argon2, Spring typically uses BCrypt.
     * Both are secure - BCrypt is just more common in Java world.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
