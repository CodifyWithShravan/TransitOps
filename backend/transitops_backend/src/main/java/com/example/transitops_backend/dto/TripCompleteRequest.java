package com.example.transitops_backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripCompleteRequest {

    @NotNull(message = "Final odometer reading is required")
    @PositiveOrZero(message = "Final odometer cannot be negative")
    private Double finalOdometer;

    @PositiveOrZero(message = "Fuel consumed cannot be negative")
    private Double fuelConsumed; // in Liters

    private Double fuelCost; // total cost for fuel consumed on trip

    private Double actualDistance; // in km
}
