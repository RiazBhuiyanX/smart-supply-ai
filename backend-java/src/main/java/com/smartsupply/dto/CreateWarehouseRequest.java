package com.smartsupply.dto;

import com.smartsupply.entity.WarehouseType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWarehouseRequest {
    
    @NotBlank(message = "Name is required")
    private String name;
    
    private String location;
    
    private WarehouseType type;
    
    private Integer capacity;
}
