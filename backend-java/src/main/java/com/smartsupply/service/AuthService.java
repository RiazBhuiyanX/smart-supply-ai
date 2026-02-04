package com.smartsupply.service;

import com.smartsupply.dto.AuthResponse;
import com.smartsupply.dto.LoginRequest;
import com.smartsupply.dto.RegisterRequest;
import com.smartsupply.entity.User;
import com.smartsupply.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * AuthService - Handles authentication business logic.
 * 
 * This is the equivalent of NestJS AuthService.
 * 
 * Comparison:
 * - NestJS: argon2.hash(password)
 * - Java:   passwordEncoder.encode(password)
 * 
 * - NestJS: argon2.verify(hash, password)
 * - Java:   passwordEncoder.matches(password, hash)
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * Register a new user.
     * 
     * Steps:
     * 1. Check if email exists
     * 2. Validate invite code and determine role
     * 3. Hash password
     * 4. Save user
     * 5. Return auth response with JWT
     */
    public AuthResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("User with this email already exists");
        }

        // Determine role from invite code (secure role assignment)
        var role = getRoleFromInviteCode(request.getInviteCode());

        // Build user entity with hashed password
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(role)
                .build();

        // Save to database
        user = userRepository.save(user);

        // Generate JWT token
        String jwtToken = jwtService.generateToken(user);

        return buildAuthResponse(user, jwtToken);
    }

    /**
     * Map invite code to role.
     * Without valid code, defaults to WAREHOUSE_OP.
     */
    private com.smartsupply.entity.Role getRoleFromInviteCode(String inviteCode) {
        if (inviteCode == null || inviteCode.isBlank()) {
            return com.smartsupply.entity.Role.WAREHOUSE_OP;
        }
        
        return switch (inviteCode.toUpperCase().trim()) {
            case "ADMIN-2024-SECRET" -> com.smartsupply.entity.Role.ADMIN;
            case "MGR-SMART-SUPPLY" -> com.smartsupply.entity.Role.MANAGER;
            case "PROC-SMART-SUPPLY" -> com.smartsupply.entity.Role.PROCUREMENT;
            default -> com.smartsupply.entity.Role.WAREHOUSE_OP;
        };
    }

    /**
     * Authenticate user and return JWT.
     * 
     * This is like NestJS: authService.validateUser() + authService.login()
     */
    public AuthResponse login(LoginRequest request) {
        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        // Verify password (like NestJS argon2.verify)
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        // Generate JWT token
        String jwtToken = jwtService.generateToken(user);

        return buildAuthResponse(user, jwtToken);
    }

    /**
     * Build auth response DTO.
     */
    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .accessToken(token)
                .user(AuthResponse.UserDto.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .role(user.getRole())
                        .build())
                .build();
    }
}
