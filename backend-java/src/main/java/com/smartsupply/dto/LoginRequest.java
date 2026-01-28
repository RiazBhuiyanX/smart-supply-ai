package com.smartsupply.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Login request DTO.
 * 
 * Comparison:
 * - NestJS: class LoginDto { @IsEmail() email; @IsNotEmpty() password; }
 * - Java:   class LoginRequest { @Email String email; @NotBlank String password; }
 * 
 * Jakarta Validation annotations work like class-validator in NestJS.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;
    
    @NotBlank(message = "Password is required")
    private String password;
}
