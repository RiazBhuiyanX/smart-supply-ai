package com.smartsupply.service;

import com.smartsupply.dto.CreateWarehouseRequest;
import com.smartsupply.dto.WarehouseResponse;
import com.smartsupply.entity.Warehouse;
import com.smartsupply.entity.WarehouseType;
import com.smartsupply.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;

    public List<WarehouseResponse> getAllWarehouses() {
        return warehouseRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<WarehouseResponse> searchWarehouses(String search) {
        return warehouseRepository.findByNameContainingIgnoreCaseOrLocationContainingIgnoreCase(search, search)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public WarehouseResponse getWarehouseById(String id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        return toResponse(warehouse);
    }

    public WarehouseResponse createWarehouse(CreateWarehouseRequest request) {
        if (warehouseRepository.existsByName(request.getName())) {
            throw new RuntimeException("Warehouse with name '" + request.getName() + "' already exists");
        }

        Warehouse warehouse = Warehouse.builder()
                .name(request.getName())
                .location(request.getLocation())
                .type(request.getType() != null ? request.getType() : WarehouseType.PHYSICAL)
                .capacity(request.getCapacity() != null ? request.getCapacity() : 10000)
                .build();

        warehouse = warehouseRepository.save(warehouse);
        return toResponse(warehouse);
    }

    public WarehouseResponse updateWarehouse(String id, CreateWarehouseRequest request) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        warehouse.setName(request.getName());
        warehouse.setLocation(request.getLocation());
        if (request.getType() != null) {
            warehouse.setType(request.getType());
        }
        if (request.getCapacity() != null) {
            warehouse.setCapacity(request.getCapacity());
        }

        warehouse = warehouseRepository.save(warehouse);
        return toResponse(warehouse);
    }

    public void deleteWarehouse(String id) {
        if (!warehouseRepository.existsById(id)) {
            throw new RuntimeException("Warehouse not found");
        }
        warehouseRepository.deleteById(id);
    }

    private WarehouseResponse toResponse(Warehouse warehouse) {
        return WarehouseResponse.builder()
                .id(warehouse.getId())
                .name(warehouse.getName())
                .location(warehouse.getLocation())
                .type(warehouse.getType())
                .capacity(warehouse.getCapacity())
                .build();
    }
}
