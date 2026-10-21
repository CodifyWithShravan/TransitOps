package com.example.transitops_backend.service;

import com.example.transitops_backend.dto.ExpenseRequest;
import com.example.transitops_backend.dto.FuelLogRequest;
import com.example.transitops_backend.entity.*;
import com.example.transitops_backend.repository.ExpenseRepository;
import com.example.transitops_backend.repository.FuelLogRepository;
import com.example.transitops_backend.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FuelAndExpenseService {

    private final FuelLogRepository fuelLogRepository;
    private final ExpenseRepository expenseRepository;
    private final VehicleService vehicleService;
    private final TripRepository tripRepository;

    // --- Fuel Logs ---

    @Transactional(readOnly = true)
    public List<FuelLog> getFuelLogs(Long vehicleId) {
        if (vehicleId != null) {
            return fuelLogRepository.findByVehicleId(vehicleId);
        }
        return fuelLogRepository.findAll();
    }

    @Transactional
    public FuelLog addFuelLog(FuelLogRequest request) {
        Vehicle vehicle = vehicleService.getVehicleById(request.getVehicleId());
        Trip trip = request.getTripId() != null
                ? tripRepository.findById(request.getTripId()).orElse(null)
                : null;

        FuelLog log = FuelLog.builder()
                .vehicle(vehicle)
                .trip(trip)
                .liters(request.getLiters())
                .cost(request.getCost())
                .logDate(request.getLogDate() != null ? request.getLogDate() : LocalDate.now())
                .odometerReading(request.getOdometerReading() != null ? request.getOdometerReading() : vehicle.getOdometer())
                .build();

        FuelLog saved = fuelLogRepository.save(log);

        // Also record as a FUEL expense for unified expense tracking
        Expense expense = Expense.builder()
                .vehicle(vehicle)
                .trip(trip)
                .expenseType(ExpenseType.FUEL)
                .amount(request.getCost())
                .expenseDate(saved.getLogDate())
                .description("Fuel: " + request.getLiters() + " Liters @ " + request.getCost())
                .build();
        expenseRepository.save(expense);

        return saved;
    }

    // --- Expenses ---

    @Transactional(readOnly = true)
    public List<Expense> getExpenses(Long vehicleId, ExpenseType type) {
        if (vehicleId != null) {
            return expenseRepository.findByVehicleId(vehicleId);
        }
        if (type != null) {
            return expenseRepository.findByExpenseType(type);
        }
        return expenseRepository.findAll();
    }

    @Transactional
    public Expense addExpense(ExpenseRequest request) {
        Vehicle vehicle = vehicleService.getVehicleById(request.getVehicleId());
        Trip trip = request.getTripId() != null
                ? tripRepository.findById(request.getTripId()).orElse(null)
                : null;

        Expense expense = Expense.builder()
                .vehicle(vehicle)
                .trip(trip)
                .expenseType(request.getExpenseType())
                .amount(request.getAmount())
                .expenseDate(request.getExpenseDate() != null ? request.getExpenseDate() : LocalDate.now())
                .description(request.getDescription())
                .build();

        return expenseRepository.save(expense);
    }

    // --- Operational Cost Calculations ---

    @Transactional(readOnly = true)
    public Map<String, Object> getVehicleOperationalCost(Long vehicleId) {
        Vehicle vehicle = vehicleService.getVehicleById(vehicleId);

        Double fuelCost = fuelLogRepository.sumFuelCostByVehicleId(vehicleId);
        Double totalFuelLiters = fuelLogRepository.sumFuelLitersByVehicleId(vehicleId);
        Double maintenanceCost = expenseRepository.sumExpensesByVehicleIdAndType(vehicleId, ExpenseType.MAINTENANCE);
        Double otherExpenses = expenseRepository.sumExpensesByVehicleId(vehicleId) - fuelCost - maintenanceCost;
        if (otherExpenses < 0) otherExpenses = 0.0;

        Double totalOperationalCost = fuelCost + maintenanceCost + otherExpenses;

        Map<String, Object> costSummary = new HashMap<>();
        costSummary.put("vehicleId", vehicle.getId());
        costSummary.put("registrationNumber", vehicle.getRegistrationNumber());
        costSummary.put("model", vehicle.getModel());
        costSummary.put("totalFuelCost", fuelCost);
        costSummary.put("totalFuelLiters", totalFuelLiters);
        costSummary.put("totalMaintenanceCost", maintenanceCost);
        costSummary.put("otherExpenses", otherExpenses);
        costSummary.put("totalOperationalCost", totalOperationalCost);

        return costSummary;
    }
}
