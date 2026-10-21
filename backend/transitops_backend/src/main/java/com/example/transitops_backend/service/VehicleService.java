package com.example.transitops_backend.service;

import com.example.transitops_backend.dto.VehicleRequest;
import com.example.transitops_backend.entity.Vehicle;
import com.example.transitops_backend.entity.VehicleStatus;
import com.example.transitops_backend.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    @Transactional(readOnly = true)
    public List<Vehicle> getAllVehicles(String type, VehicleStatus status, String region) {
        List<Vehicle> list = vehicleRepository.findAll();

        return list.stream()
                .filter(v -> type == null || type.isBlank() || v.getType().equalsIgnoreCase(type))
                .filter(v -> status == null || v.getStatus() == status)
                .filter(v -> region == null || region.isBlank() || v.getRegion().equalsIgnoreCase(region))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Vehicle getVehicleById(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Vehicle> getAvailableVehicles() {
        return vehicleRepository.findByStatus(VehicleStatus.AVAILABLE);
    }

    @Transactional
    public Vehicle createVehicle(VehicleRequest request) {
        if (vehicleRepository.existsByRegistrationNumber(request.getRegistrationNumber())) {
            throw new IllegalArgumentException("Vehicle with registration number '" + request.getRegistrationNumber() + "' already exists.");
        }

        Vehicle vehicle = Vehicle.builder()
                .registrationNumber(request.getRegistrationNumber().trim().toUpperCase())
                .model(request.getModel().trim())
                .type(request.getType().trim())
                .maxCapacity(request.getMaxCapacity())
                .odometer(request.getOdometer() != null ? request.getOdometer() : 0.0)
                .acquisitionCost(request.getAcquisitionCost())
                .status(request.getStatus() != null ? request.getStatus() : VehicleStatus.AVAILABLE)
                .region(request.getRegion() != null && !request.getRegion().isBlank() ? request.getRegion() : "Central")
                .build();

        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public Vehicle updateVehicle(Long id, VehicleRequest request) {
        Vehicle vehicle = getVehicleById(id);

        if (!vehicle.getRegistrationNumber().equalsIgnoreCase(request.getRegistrationNumber())) {
            if (vehicleRepository.existsByRegistrationNumber(request.getRegistrationNumber())) {
                throw new IllegalArgumentException("Registration number '" + request.getRegistrationNumber() + "' is already in use.");
            }
            vehicle.setRegistrationNumber(request.getRegistrationNumber().trim().toUpperCase());
        }

        vehicle.setModel(request.getModel().trim());
        vehicle.setType(request.getType().trim());
        vehicle.setMaxCapacity(request.getMaxCapacity());
        if (request.getOdometer() != null) {
            vehicle.setOdometer(request.getOdometer());
        }
        vehicle.setAcquisitionCost(request.getAcquisitionCost());
        if (request.getStatus() != null) {
            vehicle.setStatus(request.getStatus());
        }
        if (request.getRegion() != null && !request.getRegion().isBlank()) {
            vehicle.setRegion(request.getRegion());
        }

        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public void deleteVehicle(Long id) {
        Vehicle vehicle = getVehicleById(id);
        vehicleRepository.delete(vehicle);
    }

    @Transactional
    public Vehicle retireVehicle(Long id) {
        Vehicle vehicle = getVehicleById(id);
        vehicle.setStatus(VehicleStatus.RETIRED);
        return vehicleRepository.save(vehicle);
    }
}
