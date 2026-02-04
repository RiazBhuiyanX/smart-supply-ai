package com.smartsupply.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

/**
 * Supplier entity - Vendors you order products from.
 */
@Entity
@Table(name = "suppliers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Supplier {

    @Id
    @UuidGenerator
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String email;

    private String phone;

    private String address;

    private String contactPerson;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
