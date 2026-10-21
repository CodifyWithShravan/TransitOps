package com.example.transitops_backend.controller;

import com.example.transitops_backend.dto.VehicleRequest;
import com.example.transitops_backend.entity.Vehicle;
import com.example.transitops_backend.entity.VehicleStatus;
import com.example.transitops_backend.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<List<Vehicle>> getAllVehicles(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) VehicleStatus status,
            @RequestParam(required = false) String region) {
        return ResponseEntity.ok(vehicleService.getAllVehicles(type, status, region));
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<List<Vehicle>> getAvailableVehicles() {
        return ResponseEntity.ok(vehicleService.getAvailableVehicles());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<Vehicle> getVehicleById(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('FLEET_MANAGER')")
    public ResponseEntity<Vehicle> createVehicle(@Valid @RequestBody VehicleRequest request) {
        return new ResponseEntity<>(vehicleService.createVehicle(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('FLEET_MANAGER')")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable Long id, @Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.ok(vehicleService.updateVehicle(id, request));
    }

    @PatchMapping("/{id}/retire")
    @PreAuthorize("hasRole('FLEET_MANAGER')")
    public ResponseEntity<Vehicle> retireVehicle(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.retireVehicle(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FLEET_MANAGER')")
    public ResponseEntity<?> deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.ok(Map.of("message", "Vehicle deleted successfully"));
    }
}
