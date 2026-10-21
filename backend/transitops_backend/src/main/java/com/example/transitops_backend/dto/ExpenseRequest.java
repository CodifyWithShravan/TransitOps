package com.example.transitops_backend.dto;

import com.example.transitops_backend.entity.ExpenseType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseRequest {

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    private Long tripId;

    @NotNull(message = "Expense type is required")
    private ExpenseType expenseType;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private Double amount;

    private LocalDate expenseDate;

    private String description;
}
