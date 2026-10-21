package com.example.transitops_backend.controller;

import com.example.transitops_backend.dto.DriverRequest;
import com.example.transitops_backend.entity.Driver;
import com.example.transitops_backend.entity.DriverStatus;
import com.example.transitops_backend.service.DriverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;

    @GetMapping
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<List<Driver>> getAllDrivers(@RequestParam(required = false) DriverStatus status) {
        return ResponseEntity.ok(driverService.getAllDrivers(status));
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<List<Driver>> getAvailableDrivers() {
        return ResponseEntity.ok(driverService.getAvailableDrivers());
    }

    @GetMapping("/alerts/expiring")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<List<Driver>> getExpiringDrivers(@RequestParam(defaultValue = "30") Integer days) {
        return ResponseEntity.ok(driverService.getExpiringDrivers(days));
    }

    @PostMapping("/{id}/send-expiry-reminder")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'SAFETY_OFFICER')")
    public ResponseEntity<Map<String, Object>> sendExpiryReminder(@PathVariable Long id) {
        return ResponseEntity.ok(driverService.sendExpiryReminder(id));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<Driver> getDriverById(@PathVariable Long id) {
        return ResponseEntity.ok(driverService.getDriverById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'SAFETY_OFFICER')")
    public ResponseEntity<Driver> createDriver(@Valid @RequestBody DriverRequest request) {
        return new ResponseEntity<>(driverService.createDriver(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'SAFETY_OFFICER')")
    public ResponseEntity<Driver> updateDriver(@PathVariable Long id, @Valid @RequestBody DriverRequest request) {
        return ResponseEntity.ok(driverService.updateDriver(id, request));
    }

    @PatchMapping("/{id}/safety-score")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'SAFETY_OFFICER')")
    public ResponseEntity<Driver> updateSafetyScore(@PathVariable Long id, @RequestBody Map<String, Double> payload) {
        Double score = payload.get("safetyScore");
        if (score == null) {
            throw new IllegalArgumentException("safetyScore is required");
        }
        return ResponseEntity.ok(driverService.updateSafetyScore(id, score));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FLEET_MANAGER')")
    public ResponseEntity<?> deleteDriver(@PathVariable Long id) {
        driverService.deleteDriver(id);
        return ResponseEntity.ok(Map.of("message", "Driver deleted successfully"));
    }
}
