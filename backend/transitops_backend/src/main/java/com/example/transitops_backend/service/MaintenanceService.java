package com.example.transitops_backend.service;

import com.example.transitops_backend.dto.MaintenanceRequest;
import com.example.transitops_backend.entity.*;
import com.example.transitops_backend.repository.ExpenseRepository;
import com.example.transitops_backend.repository.MaintenanceLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceService {

    private final MaintenanceLogRepository maintenanceLogRepository;
    private final VehicleService vehicleService;
    private final ExpenseRepository expenseRepository;

    @Transactional(readOnly = true)
    public List<MaintenanceLog> getAllMaintenanceLogs(MaintenanceStatus status) {
        if (status != null) {
            return maintenanceLogRepository.findByStatus(status);
        }
        return maintenanceLogRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<MaintenanceLog> getMaintenanceLogsByVehicle(Long vehicleId) {
        return maintenanceLogRepository.findByVehicleId(vehicleId);
    }

    @Transactional(readOnly = true)
    public MaintenanceLog getMaintenanceLogById(Long id) {
        return maintenanceLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Maintenance log not found with ID: " + id));
    }

    @Transactional
    public MaintenanceLog createMaintenanceLog(MaintenanceRequest request) {
        Vehicle vehicle = vehicleService.getVehicleById(request.getVehicleId());

        if (vehicle.getStatus() == VehicleStatus.ON_TRIP) {
            throw new IllegalStateException("Cannot put vehicle '" + vehicle.getRegistrationNumber() +
                    "' into maintenance while it is actively ON_TRIP. Complete or cancel the trip first.");
        }

        // Mandatory Business Rule 1: Adding a vehicle to Maintenance automatically switches status to "In Shop"
        vehicle.setStatus(VehicleStatus.IN_SHOP);

        MaintenanceLog logEntry = MaintenanceLog.builder()
                .vehicle(vehicle)
                .serviceType(request.getServiceType().trim())
                .description(request.getDescription())
                .cost(request.getCost())
                .status(MaintenanceStatus.IN_PROGRESS)
                .startDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now())
                .build();

        MaintenanceLog saved = maintenanceLogRepository.save(logEntry);
        log.info("Vehicle {} placed IN_SHOP for service: {}", vehicle.getRegistrationNumber(), request.getServiceType());
        return saved;
    }

    @Transactional
    public MaintenanceLog completeMaintenanceLog(Long id, Double finalCost) {
        MaintenanceLog logEntry = getMaintenanceLogById(id);

        if (logEntry.getStatus() == MaintenanceStatus.COMPLETED) {
            throw new IllegalStateException("Maintenance log is already marked as COMPLETED.");
        }

        if (finalCost != null) {
            logEntry.setCost(finalCost);
        }

        logEntry.setStatus(MaintenanceStatus.COMPLETED);
        logEntry.setCompletedDate(LocalDate.now());

        Vehicle vehicle = logEntry.getVehicle();

        // Mandatory Business Rule 2: Closing maintenance restores the vehicle to Available (unless retired)
        if (vehicle.getStatus() != VehicleStatus.RETIRED) {
            vehicle.setStatus(VehicleStatus.AVAILABLE);
        }

        // Automatically log this maintenance as an Expense for total operational cost tracking
        Expense maintenanceExpense = Expense.builder()
                .vehicle(vehicle)
                .expenseType(ExpenseType.MAINTENANCE)
                .amount(logEntry.getCost())
                .expenseDate(LocalDate.now())
                .description("Maintenance: " + logEntry.getServiceType() +
                        (logEntry.getDescription() != null ? " - " + logEntry.getDescription() : ""))
                .build();
        expenseRepository.save(maintenanceExpense);

        log.info("Closed maintenance for Vehicle {}. Status restored to {}.", vehicle.getRegistrationNumber(), vehicle.getStatus());
        return maintenanceLogRepository.save(logEntry);
    }
}
