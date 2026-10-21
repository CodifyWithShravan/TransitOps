package com.example.transitops_backend.repository;

import com.example.transitops_backend.entity.FuelLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FuelLogRepository extends JpaRepository<FuelLog, Long> {
    List<FuelLog> findByVehicleId(Long vehicleId);
    List<FuelLog> findByTripId(Long tripId);

    @Query("SELECT COALESCE(SUM(f.cost), 0.0) FROM FuelLog f WHERE f.vehicle.id = :vehicleId")
    Double sumFuelCostByVehicleId(@Param("vehicleId") Long vehicleId);

    @Query("SELECT COALESCE(SUM(f.liters), 0.0) FROM FuelLog f WHERE f.vehicle.id = :vehicleId")
    Double sumFuelLitersByVehicleId(@Param("vehicleId") Long vehicleId);
}
