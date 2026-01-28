package com.smartsupply.controller;

import com.smartsupply.dto.AuthResponse;
import com.smartsupply.dto.LoginRequest;
import com.smartsupply.dto.RegisterRequest;
import com.smartsupply.entity.User;
import com.smartsupply.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController - REST endpoints for authentication.
 * 
 * Comparison:
 * - NestJS: @Controller('auth') + @Post('register')
 * - Java:   @RestController + @RequestMapping("/auth") + @PostMapping("/register")
 * 
 * Endpoints:
 * - POST /auth/register - Create new user account
 * - POST /auth/login    - Login and get JWT token
 * - GET  /auth/profile  - Get current user (protected)
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Register a new user.
     * 
     * @Valid triggers Jakarta Validation (like class-validator in NestJS)
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    /**
     * Login and get JWT token.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * Get current user profile.
     * 
     * @AuthenticationPrincipal is like NestJS @Request() req.user
     * It injects the authenticated user from Spring Security context.
     * 
     * This endpoint is protected by SecurityConfig (requires valid JWT).
     */
    @GetMapping("/profile")
    public ResponseEntity<AuthResponse.UserDto> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                AuthResponse.UserDto.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .role(user.getRole())
                        .build()
        );
    }
}
