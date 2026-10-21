package com.example.transitops_backend.repository;

import com.example.transitops_backend.entity.Vehicle;
import com.example.transitops_backend.entity.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);
    Boolean existsByRegistrationNumber(String registrationNumber);
    List<Vehicle> findByStatus(VehicleStatus status);
    List<Vehicle> findByType(String type);
    List<Vehicle> findByRegion(String region);
    long countByStatus(VehicleStatus status);
}
