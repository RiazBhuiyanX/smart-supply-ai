package com.smartsupply.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * User entity - JPA version of Prisma User model.
 * 
 * Comparison:
 * - Prisma: model User { id String @id @default(uuid()) ... }
 * - JPA:    @Entity class User { @Id String id; ... }
 * 
 * This class also implements UserDetails for Spring Security integration.
 * UserDetails is the interface Spring Security uses to represent a user.
 */
@Entity
@Table(name = "users")  // Maps to 'users' table (same as Prisma)
@Data                   // Lombok: generates getters, setters, toString, equals, hashCode
@Builder               // Lombok: enables User.builder().email("...").build()
@NoArgsConstructor     // Lombok: generates no-args constructor
@AllArgsConstructor    // Lombok: generates all-args constructor
public class User implements UserDetails {

    @Id
    @UuidGenerator  // Generates UUID as String
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.WAREHOUSE_OP;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ========== UserDetails Implementation ==========
    // Spring Security requires these methods

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Convert role to Spring Security authority
        // ROLE_ prefix is Spring Security convention
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;  // We use email as the username
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
