package com.example.transitops_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripCreateRequest {

    @NotBlank(message = "Source is required")
    private String source;

    @NotBlank(message = "Destination is required")
    private String destination;

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotNull(message = "Driver ID is required")
    private Long driverId;

    @NotNull(message = "Cargo weight is required")
    @Positive(message = "Cargo weight must be positive")
    private Double cargoWeight; // in kg

    @NotNull(message = "Planned distance is required")
    @Positive(message = "Planned distance must be positive")
    private Double plannedDistance; // in km

    private Double revenue; // optional revenue earned for the trip

    @Builder.Default
    private Boolean autoDispatch = false; // if true, immediately dispatches after validation
}
