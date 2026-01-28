package com.smartsupply.repository;

import com.smartsupply.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * UserRepository - Data access layer for User entity.
 * 
 * Comparison:
 * - Prisma:  prisma.user.findUnique({ where: { email } })
 * - Spring:  userRepository.findByEmail(email)
 * 
 * Spring Data JPA automatically implements these methods based on naming convention!
 * - findByEmail -> SELECT * FROM users WHERE email = ?
 * - existsByEmail -> SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)
 * 
 * No implementation needed - Spring does it for you!
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    /**
     * Find user by email.
     * Auto-implemented by Spring Data JPA.
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Check if user with email exists.
     * Auto-implemented by Spring Data JPA.
     */
    boolean existsByEmail(String email);
}
