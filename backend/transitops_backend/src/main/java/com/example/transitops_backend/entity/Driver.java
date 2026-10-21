package com.example.transitops_backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "drivers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Driver name is required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "License number is required")
    @Column(unique = true, nullable = false)
    private String licenseNumber;

    @NotBlank(message = "License category is required")
    @Column(nullable = false)
    private String licenseCategory; // e.g. Commercial, Heavy, Light

    @NotNull(message = "License expiry date is required")
    @Column(nullable = false)
    private LocalDate licenseExpiryDate;

    @NotBlank(message = "Contact number is required")
    @Column(nullable = false)
    private String contactNumber;

    @Builder.Default
    private Double safetyScore = 100.0; // 0.0 to 100.0

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DriverStatus status = DriverStatus.AVAILABLE;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    public boolean isLicenseExpired() {
        return licenseExpiryDate != null && licenseExpiryDate.isBefore(LocalDate.now());
    }

    public boolean isEligibleForTrip() {
        return status == DriverStatus.AVAILABLE && !isLicenseExpired();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
