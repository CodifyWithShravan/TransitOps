package com.example.transitops_backend.service;

import com.example.transitops_backend.dto.TripCompleteRequest;
import com.example.transitops_backend.dto.TripCreateRequest;
import com.example.transitops_backend.entity.*;
import com.example.transitops_backend.repository.FuelLogRepository;
import com.example.transitops_backend.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TripService {

    private final TripRepository tripRepository;
    private final VehicleService vehicleService;
    private final DriverService driverService;
    private final FuelLogRepository fuelLogRepository;

    @Transactional(readOnly = true)
    public List<Trip> getAllTrips(TripStatus status) {
        if (status != null) {
            return tripRepository.findByStatus(status);
        }
        return tripRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Trip getTripById(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found with ID: " + id));
    }

    @Transactional
    public Trip createTrip(TripCreateRequest request) {
        Vehicle vehicle = vehicleService.getVehicleById(request.getVehicleId());
        Driver driver = driverService.getDriverById(request.getDriverId());

        // Mandatory Business Rule 1: Retired or In Shop vehicles must never appear in dispatch
        if (vehicle.getStatus() != VehicleStatus.AVAILABLE) {
            throw new IllegalStateException("Vehicle '" + vehicle.getRegistrationNumber() +
                    "' is not available for dispatch. Current status: " + vehicle.getStatus());
        }

        // Mandatory Business Rule 2: Drivers with expired licenses or Suspended status cannot be assigned
        if (driver.isLicenseExpired()) {
            throw new IllegalStateException("Driver '" + driver.getName() +
                    "' cannot be assigned: Driver license expired on " + driver.getLicenseExpiryDate());
        }
        if (driver.getStatus() == DriverStatus.SUSPENDED) {
            throw new IllegalStateException("Driver '" + driver.getName() + "' is SUSPENDED and cannot be assigned.");
        }
        if (driver.getStatus() != DriverStatus.AVAILABLE) {
            throw new IllegalStateException("Driver '" + driver.getName() +
                    "' is not available. Current status: " + driver.getStatus());
        }

        // Mandatory Business Rule 3: Cargo Weight must not exceed the vehicle's maximum load capacity
        if (request.getCargoWeight() > vehicle.getMaxCapacity()) {
            throw new IllegalArgumentException("Cargo weight (" + request.getCargoWeight() +
                    " kg) exceeds vehicle max load capacity (" + vehicle.getMaxCapacity() + " kg)");
        }

        String tripCode = "TRIP-" + (System.currentTimeMillis() % 10000000);

        Trip trip = Trip.builder()
                .tripCode(tripCode)
                .source(request.getSource().trim())
                .destination(request.getDestination().trim())
                .vehicle(vehicle)
                .driver(driver)
                .cargoWeight(request.getCargoWeight())
                .plannedDistance(request.getPlannedDistance())
                .revenue(request.getRevenue() != null ? request.getRevenue() : 0.0)
                .status(TripStatus.DRAFT)
                .build();

        Trip savedTrip = tripRepository.save(trip);

        if (Boolean.TRUE.equals(request.getAutoDispatch())) {
            return dispatchTrip(savedTrip.getId());
        }

        return savedTrip;
    }

    @Transactional
    public Trip dispatchTrip(Long tripId) {
        Trip trip = getTripById(tripId);

        if (trip.getStatus() != TripStatus.DRAFT) {
            throw new IllegalStateException("Trip can only be dispatched from DRAFT status. Current: " + trip.getStatus());
        }

        Vehicle vehicle = trip.getVehicle();
        Driver driver = trip.getDriver();

        if (vehicle.getStatus() != VehicleStatus.AVAILABLE) {
            throw new IllegalStateException("Vehicle is no longer available. Status: " + vehicle.getStatus());
        }
        if (!driver.isEligibleForTrip()) {
            throw new IllegalStateException("Driver is no longer eligible for dispatch.");
        }

        // Mandatory Business Rule 4: Dispatching automatically changes both vehicle and driver to ON_TRIP
        vehicle.setStatus(VehicleStatus.ON_TRIP);
        driver.setStatus(DriverStatus.ON_TRIP);

        trip.setStatus(TripStatus.DISPATCHED);
        trip.setStartOdometer(vehicle.getOdometer());
        trip.setDispatchedAt(LocalDateTime.now());

        log.info("Dispatched trip {} with Vehicle {} and Driver {}", trip.getTripCode(), vehicle.getRegistrationNumber(), driver.getName());
        return tripRepository.save(trip);
    }

    @Transactional
    public Trip completeTrip(Long tripId, TripCompleteRequest request) {
        Trip trip = getTripById(tripId);

        if (trip.getStatus() != TripStatus.DISPATCHED) {
            throw new IllegalStateException("Only DISPATCHED trips can be completed. Current: " + trip.getStatus());
        }

        Vehicle vehicle = trip.getVehicle();
        Driver driver = trip.getDriver();

        if (request.getFinalOdometer() < vehicle.getOdometer()) {
            throw new IllegalArgumentException("Final odometer reading (" + request.getFinalOdometer() +
                    ") cannot be less than initial odometer (" + vehicle.getOdometer() + ")");
        }

        double distanceTraveled = request.getActualDistance() != null
                ? request.getActualDistance()
                : (request.getFinalOdometer() - trip.getStartOdometer());

        // Mandatory Business Rule 5: Completing a trip automatically changes both vehicle and driver back to AVAILABLE
        vehicle.setOdometer(request.getFinalOdometer());
        vehicle.setStatus(VehicleStatus.AVAILABLE);
        driver.setStatus(DriverStatus.AVAILABLE);

        trip.setStatus(TripStatus.COMPLETED);
        trip.setFinalOdometer(request.getFinalOdometer());
        trip.setActualDistance(distanceTraveled);
        trip.setFuelConsumed(request.getFuelConsumed());
        trip.setCompletedAt(LocalDateTime.now());

        // Auto-create fuel log if fuel consumed was entered
        if (request.getFuelConsumed() != null && request.getFuelConsumed() > 0) {
            double cost = request.getFuelCost() != null ? request.getFuelCost() : request.getFuelConsumed() * 1.6;
            FuelLog fuelLog = FuelLog.builder()
                    .vehicle(vehicle)
                    .trip(trip)
                    .liters(request.getFuelConsumed())
                    .cost(cost)
                    .logDate(LocalDate.now())
                    .odometerReading(request.getFinalOdometer())
                    .build();
            fuelLogRepository.save(fuelLog);
        }

        log.info("Completed trip {}. Vehicle and Driver restored to AVAILABLE.", trip.getTripCode());
        return tripRepository.save(trip);
    }

    @Transactional
    public Trip cancelTrip(Long tripId) {
        Trip trip = getTripById(tripId);

        if (trip.getStatus() == TripStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel an already COMPLETED trip.");
        }

        // Mandatory Business Rule 6: Cancelling a dispatched trip restores vehicle and driver to AVAILABLE
        if (trip.getStatus() == TripStatus.DISPATCHED) {
            trip.getVehicle().setStatus(VehicleStatus.AVAILABLE);
            trip.getDriver().setStatus(DriverStatus.AVAILABLE);
        }

        trip.setStatus(TripStatus.CANCELLED);
        log.info("Cancelled trip {}. Restored asset availability if previously dispatched.", trip.getTripCode());
        return tripRepository.save(trip);
    }
}
