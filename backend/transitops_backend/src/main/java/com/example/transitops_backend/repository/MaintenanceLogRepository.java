package com.example.transitops_backend.repository;

import com.example.transitops_backend.entity.MaintenanceLog;
import com.example.transitops_backend.entity.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceLogRepository extends JpaRepository<MaintenanceLog, Long> {
    List<MaintenanceLog> findByVehicleId(Long vehicleId);
    List<MaintenanceLog> findByStatus(MaintenanceStatus status);
}
