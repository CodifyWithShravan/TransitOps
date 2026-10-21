package com.example.transitops_backend.dto;

import com.example.transitops_backend.entity.VehicleStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleRequest {

    @NotBlank(message = "Registration number is required")
    private String registrationNumber;

    @NotBlank(message = "Model is required")
    private String model;

    @NotBlank(message = "Vehicle type is required (e.g., Van, Truck, Trailer)")
    private String type;

    @NotNull(message = "Maximum load capacity is required")
    @Positive(message = "Max capacity must be greater than 0")
    private Double maxCapacity;

    @NotNull(message = "Odometer reading is required")
    @PositiveOrZero(message = "Odometer cannot be negative")
    private Double odometer;

    @NotNull(message = "Acquisition cost is required")
    @Positive(message = "Acquisition cost must be positive")
    private Double acquisitionCost;

    private VehicleStatus status;

    private String region;
}
