package com.example.transitops_backend.repository;

import com.example.transitops_backend.entity.Trip;
import com.example.transitops_backend.entity.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    Optional<Trip> findByTripCode(String tripCode);
    List<Trip> findByStatus(TripStatus status);
    List<Trip> findByVehicleId(Long vehicleId);
    List<Trip> findByDriverId(Long driverId);
    long countByStatus(TripStatus status);
}
