package com.smartsupply.service;

import com.smartsupply.dto.CreateProductRequest;
import com.smartsupply.dto.ProductResponse;
import com.smartsupply.entity.Product;
import com.smartsupply.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

/**
 * ProductService - Business logic for Product operations.
 * 
 * Similar to NestJS ProductService.
 */
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    /**
     * Get all products with pagination.
     */
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable)
                .map(this::toResponse);
    }

    /**
     * Search products by name or SKU.
     */
    public Page<ProductResponse> searchProducts(String query, Pageable pageable) {
        return productRepository.findBySkuContainingIgnoreCaseOrNameContainingIgnoreCase(
                query, query, pageable)
                .map(this::toResponse);
    }

    /**
     * Get single product by ID.
     */
    public ProductResponse getProductById(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        return toResponse(product);
    }

    /**
     * Create new product.
     */
    public ProductResponse createProduct(CreateProductRequest request) {
        // Check if SKU already exists
        if (productRepository.existsBySku(request.getSku())) {
            throw new RuntimeException("Product with SKU " + request.getSku() + " already exists");
        }

        Product product = Product.builder()
                .sku(request.getSku())
                .name(request.getName())
                .category(request.getCategory())
                .price(request.getPrice())
                .safetyStock(request.getSafetyStock())
                .build();

        product = productRepository.save(product);
        return toResponse(product);
    }

    /**
     * Update existing product.
     */
    public ProductResponse updateProduct(String id, CreateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Check if new SKU conflicts with another product
        if (!product.getSku().equals(request.getSku()) && 
            productRepository.existsBySku(request.getSku())) {
            throw new RuntimeException("Product with SKU " + request.getSku() + " already exists");
        }

        product.setSku(request.getSku());
        product.setName(request.getName());
        product.setCategory(request.getCategory());
        product.setPrice(request.getPrice());
        product.setSafetyStock(request.getSafetyStock());

        product = productRepository.save(product);
        return toResponse(product);
    }

    /**
     * Delete product.
     */
    public void deleteProduct(String id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found");
        }
        productRepository.deleteById(id);
    }

    /**
     * Convert entity to response DTO.
     */
    private ProductResponse toResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .sku(product.getSku())
                .name(product.getName())
                .category(product.getCategory())
                .price(product.getPrice())
                .safetyStock(product.getSafetyStock())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
