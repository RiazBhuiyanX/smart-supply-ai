package com.smartsupply.dto;

import com.smartsupply.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Register request DTO.
 * 
 * Comparison:
 * - NestJS: @MinLength(6) password; @IsEnum(Role) role;
 * - Java:   @Size(min = 6) password; Role role (optional, defaults to USER);
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    @NotBlank(message = "First name is required")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    private String lastName;
    
    // Role is optional, defaults to WAREHOUSE_OP if not provided
    private Role role = Role.WAREHOUSE_OP;
}
