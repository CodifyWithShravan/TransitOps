package com.example.transitops_backend.controller;

import com.example.transitops_backend.dto.ExpenseRequest;
import com.example.transitops_backend.dto.FuelLogRequest;
import com.example.transitops_backend.entity.Expense;
import com.example.transitops_backend.entity.ExpenseType;
import com.example.transitops_backend.entity.FuelLog;
import com.example.transitops_backend.service.FuelAndExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FuelAndExpenseController {

    private final FuelAndExpenseService fuelAndExpenseService;

    // --- Fuel Logs ---

    @GetMapping("/fuel-logs")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<List<FuelLog>> getFuelLogs(@RequestParam(required = false) Long vehicleId) {
        return ResponseEntity.ok(fuelAndExpenseService.getFuelLogs(vehicleId));
    }

    @PostMapping("/fuel-logs")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<FuelLog> addFuelLog(@Valid @RequestBody FuelLogRequest request) {
        return new ResponseEntity<>(fuelAndExpenseService.addFuelLog(request), HttpStatus.CREATED);
    }

    // --- Expenses ---

    @GetMapping("/expenses")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<List<Expense>> getExpenses(
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) ExpenseType type) {
        return ResponseEntity.ok(fuelAndExpenseService.getExpenses(vehicleId, type));
    }

    @PostMapping("/expenses")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<Expense> addExpense(@Valid @RequestBody ExpenseRequest request) {
        return new ResponseEntity<>(fuelAndExpenseService.addExpense(request), HttpStatus.CREATED);
    }

    @GetMapping("/expenses/vehicle/{vehicleId}/cost-summary")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<Map<String, Object>> getVehicleCostSummary(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(fuelAndExpenseService.getVehicleOperationalCost(vehicleId));
    }
}
