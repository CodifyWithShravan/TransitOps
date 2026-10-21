package com.example.transitops_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRequest {

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotBlank(message = "Service type is required (e.g. Brake Replacement, Oil Change)")
    private String serviceType;

    private String description;

    @NotNull(message = "Cost is required")
    @PositiveOrZero(message = "Cost cannot be negative")
    private Double cost;

    private LocalDate startDate;
}
