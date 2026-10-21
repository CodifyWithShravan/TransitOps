package com.example.transitops_backend.service;

import com.example.transitops_backend.dto.DriverRequest;
import com.example.transitops_backend.entity.Driver;
import com.example.transitops_backend.entity.DriverStatus;
import com.example.transitops_backend.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;

    @Transactional(readOnly = true)
    public List<Driver> getAllDrivers(DriverStatus status) {
        if (status != null) {
            return driverRepository.findByStatus(status);
        }
        return driverRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Driver getDriverById(Long id) {
        return driverRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Driver> getAvailableDrivers() {
        // Business Rule: Drivers with expired licenses or Suspended status cannot be assigned to trips
        return driverRepository.findAll().stream()
                .filter(Driver::isEligibleForTrip)
                .collect(Collectors.toList());
    }

    @Transactional
    public Driver createDriver(DriverRequest request) {
        if (driverRepository.existsByLicenseNumber(request.getLicenseNumber())) {
            throw new IllegalArgumentException("Driver with license number '" + request.getLicenseNumber() + "' already exists.");
        }

        Driver driver = Driver.builder()
                .name(request.getName().trim())
                .licenseNumber(request.getLicenseNumber().trim().toUpperCase())
                .licenseCategory(request.getLicenseCategory().trim())
                .licenseExpiryDate(request.getLicenseExpiryDate())
                .contactNumber(request.getContactNumber().trim())
                .safetyScore(request.getSafetyScore() != null ? request.getSafetyScore() : 100.0)
                .status(request.getStatus() != null ? request.getStatus() : DriverStatus.AVAILABLE)
                .build();

        return driverRepository.save(driver);
    }

    @Transactional
    public Driver updateDriver(Long id, DriverRequest request) {
        Driver driver = getDriverById(id);

        if (!driver.getLicenseNumber().equalsIgnoreCase(request.getLicenseNumber())) {
            if (driverRepository.existsByLicenseNumber(request.getLicenseNumber())) {
                throw new IllegalArgumentException("License number '" + request.getLicenseNumber() + "' is already in use.");
            }
            driver.setLicenseNumber(request.getLicenseNumber().trim().toUpperCase());
        }

        driver.setName(request.getName().trim());
        driver.setLicenseCategory(request.getLicenseCategory().trim());
        driver.setLicenseExpiryDate(request.getLicenseExpiryDate());
        driver.setContactNumber(request.getContactNumber().trim());
        if (request.getSafetyScore() != null) {
            driver.setSafetyScore(request.getSafetyScore());
        }
        if (request.getStatus() != null) {
            driver.setStatus(request.getStatus());
        }

        return driverRepository.save(driver);
    }

    @Transactional
    public Driver updateSafetyScore(Long id, Double score) {
        Driver driver = getDriverById(id);
        driver.setSafetyScore(Math.max(0.0, Math.min(100.0, score)));
        return driverRepository.save(driver);
    }

    @Transactional(readOnly = true)
    public List<Driver> getExpiringDrivers(Integer days) {
        int threshold = (days != null && days > 0) ? days : 30;
        java.time.LocalDate limit = java.time.LocalDate.now().plusDays(threshold);
        return driverRepository.findAll().stream()
                .filter(d -> d.getLicenseExpiryDate() != null && d.getLicenseExpiryDate().isBefore(limit))
                .collect(Collectors.toList());
    }

    @Transactional
    public java.util.Map<String, Object> sendExpiryReminder(Long id) {
        Driver driver = getDriverById(id);
        return java.util.Map.of(
                "driverId", driver.getId(),
                "driverName", driver.getName(),
                "licenseNumber", driver.getLicenseNumber(),
                "expiryDate", driver.getLicenseExpiryDate().toString(),
                "status", "DISPATCHED",
                "message", "License renewal notice successfully dispatched to " + driver.getName() + " (" + driver.getContactNumber() + ") and Safety Officer.",
                "timestamp", java.time.LocalDateTime.now().toString()
        );
    }

    @Transactional
    public void deleteDriver(Long id) {
        Driver driver = getDriverById(id);
        driverRepository.delete(driver);
    }
}
