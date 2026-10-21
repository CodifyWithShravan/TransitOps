package com.example.transitops_backend.dto;

import com.example.transitops_backend.entity.DriverStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverRequest {

    @NotBlank(message = "Driver name is required")
    private String name;

    @NotBlank(message = "License number is required")
    private String licenseNumber;

    @NotBlank(message = "License category is required (e.g., Commercial, Heavy, Light)")
    private String licenseCategory;

    @NotNull(message = "License expiry date is required")
    private LocalDate licenseExpiryDate;

    @NotBlank(message = "Contact number is required")
    private String contactNumber;

    private Double safetyScore;

    private DriverStatus status;
}
