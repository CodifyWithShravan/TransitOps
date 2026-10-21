package com.example.transitops_backend.repository;

import com.example.transitops_backend.entity.Driver;
import com.example.transitops_backend.entity.DriverStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
    Optional<Driver> findByLicenseNumber(String licenseNumber);
    Boolean existsByLicenseNumber(String licenseNumber);
    List<Driver> findByStatus(DriverStatus status);
    long countByStatus(DriverStatus status);
}
