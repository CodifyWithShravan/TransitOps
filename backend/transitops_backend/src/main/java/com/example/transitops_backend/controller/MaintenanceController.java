package com.example.transitops_backend.controller;

import com.example.transitops_backend.dto.MaintenanceRequest;
import com.example.transitops_backend.entity.MaintenanceLog;
import com.example.transitops_backend.entity.MaintenanceStatus;
import com.example.transitops_backend.service.MaintenanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @GetMapping
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<List<MaintenanceLog>> getAllLogs(@RequestParam(required = false) MaintenanceStatus status) {
        return ResponseEntity.ok(maintenanceService.getAllMaintenanceLogs(status));
    }

    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<List<MaintenanceLog>> getLogsByVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceLogsByVehicle(vehicleId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<MaintenanceLog> getLogById(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceLogById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'SAFETY_OFFICER')")
    public ResponseEntity<MaintenanceLog> createLog(@Valid @RequestBody MaintenanceRequest request) {
        return new ResponseEntity<>(maintenanceService.createMaintenanceLog(request), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'SAFETY_OFFICER')")
    public ResponseEntity<MaintenanceLog> completeLog(@PathVariable Long id, @RequestBody(required = false) Map<String, Double> payload) {
        Double finalCost = payload != null ? payload.get("finalCost") : null;
        return ResponseEntity.ok(maintenanceService.completeMaintenanceLog(id, finalCost));
    }
}
