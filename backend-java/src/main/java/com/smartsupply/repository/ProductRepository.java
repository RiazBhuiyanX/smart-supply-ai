package com.smartsupply.repository;

import com.smartsupply.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * ProductRepository - Database access for Products.
 * 
 * Spring Data JPA generates implementation automatically.
 * Similar to Prisma's prisma.product.findMany(), findUnique(), etc.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, String> {

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<Product> findBySkuContainingIgnoreCaseOrNameContainingIgnoreCase(
            String sku, String name, Pageable pageable);
}
