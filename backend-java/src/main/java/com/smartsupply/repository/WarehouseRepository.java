package com.smartsupply.repository;

import com.smartsupply.entity.Warehouse;
import com.smartsupply.entity.WarehouseType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, String> {
    
    List<Warehouse> findByType(WarehouseType type);
    
    boolean existsByName(String name);
    
    // Search by name or location (case-insensitive)
    List<Warehouse> findByNameContainingIgnoreCaseOrLocationContainingIgnoreCase(String name, String location);
}
