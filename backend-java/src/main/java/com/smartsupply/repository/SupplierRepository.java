package com.smartsupply.repository;

import com.smartsupply.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, String> {
    
    Optional<Supplier> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT s FROM Supplier s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Supplier> searchByName(String query);
}
