package com.smartsupply.dto;

import com.smartsupply.entity.WarehouseType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseResponse {
    private String id;
    private String name;
    private String location;
    private WarehouseType type;
}
