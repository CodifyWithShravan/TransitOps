package com.example.transitops_backend.repository;

import com.example.transitops_backend.entity.Expense;
import com.example.transitops_backend.entity.ExpenseType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByVehicleId(Long vehicleId);
    List<Expense> findByTripId(Long tripId);
    List<Expense> findByExpenseType(ExpenseType expenseType);

    @Query("SELECT COALESCE(SUM(e.amount), 0.0) FROM Expense e WHERE e.vehicle.id = :vehicleId")
    Double sumExpensesByVehicleId(@Param("vehicleId") Long vehicleId);

    @Query("SELECT COALESCE(SUM(e.amount), 0.0) FROM Expense e WHERE e.vehicle.id = :vehicleId AND e.expenseType = :expenseType")
    Double sumExpensesByVehicleIdAndType(@Param("vehicleId") Long vehicleId, @Param("expenseType") ExpenseType expenseType);
}
