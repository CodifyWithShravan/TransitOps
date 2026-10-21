package com.example.transitops_backend.dto;

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
public class FuelLogRequest {

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    private Long tripId;

    @NotNull(message = "Liters consumed is required")
    @Positive(message = "Liters must be positive")
    private Double liters;

    @NotNull(message = "Cost is required")
    @Positive(message = "Cost must be positive")
    private Double cost;

    private LocalDate logDate;

    private Double odometerReading;
}
