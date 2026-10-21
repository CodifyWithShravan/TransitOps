package com.example.transitops_backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Registration number is required")
    @Column(unique = true, nullable = false)
    private String registrationNumber;

    @NotBlank(message = "Model is required")
    @Column(nullable = false)
    private String model;

    @NotBlank(message = "Vehicle type is required")
    @Column(nullable = false)
    private String type; // e.g., Van, Truck, Trailer, Reefer

    @NotNull(message = "Maximum load capacity is required")
    @Positive(message = "Max capacity must be greater than 0")
    @Column(nullable = false)
    private Double maxCapacity; // in kg

    @NotNull(message = "Odometer reading is required")
    @PositiveOrZero(message = "Odometer cannot be negative")
    @Column(nullable = false)
    @Builder.Default
    private Double odometer = 0.0; // in km

    @NotNull(message = "Acquisition cost is required")
    @Positive(message = "Acquisition cost must be positive")
    @Column(nullable = false)
    private Double acquisitionCost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private VehicleStatus status = VehicleStatus.AVAILABLE;

    @Column(nullable = false)
    @Builder.Default
    private String region = "Central"; // e.g. North, South, Central, East, West

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
