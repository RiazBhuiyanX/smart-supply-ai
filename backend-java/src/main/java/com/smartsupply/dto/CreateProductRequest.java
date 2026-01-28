package com.smartsupply.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for creating a new product.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {

    @NotBlank(message = "SKU is required")
    private String sku;

    @NotBlank(message = "Name is required")
    private String name;

    private String category;

    @PositiveOrZero(message = "Price must be positive or zero")
    private BigDecimal price;

    @PositiveOrZero(message = "Safety stock must be positive or zero")
    private Integer safetyStock;
}
