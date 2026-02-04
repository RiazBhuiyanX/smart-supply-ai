package com.smartsupply.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.ArrayList;
import java.util.List;

/**
 * Warehouse entity - Physical or virtual storage locations.
 */
@Entity
@Table(name = "warehouses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Warehouse {

    @Id
    @UuidGenerator
    private String id;

    @Column(nullable = false)
    private String name;

    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private WarehouseType type = WarehouseType.PHYSICAL;

    @Builder.Default
    private Integer capacity = 10000;

    @OneToMany(mappedBy = "warehouse", cascade = CascadeType.ALL)
    @Builder.Default
    private List<InventoryItem> inventoryItems = new ArrayList<>();
}
