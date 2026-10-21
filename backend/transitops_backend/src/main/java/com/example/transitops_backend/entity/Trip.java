package com.example.transitops_backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "trips")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String tripCode; // e.g. TRIP-2026-001

    @NotBlank(message = "Source location is required")
    @Column(nullable = false)
    private String source;

    @NotBlank(message = "Destination is required")
    @Column(nullable = false)
    private String destination;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id", nullable = false)
    @NotNull(message = "Vehicle must be assigned")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "driver_id", nullable = false)
    @NotNull(message = "Driver must be assigned")
    private Driver driver;

    @NotNull(message = "Cargo weight is required")
    @Positive(message = "Cargo weight must be positive")
    @Column(nullable = false)
    private Double cargoWeight; // in kg

    @NotNull(message = "Planned distance is required")
    @Positive(message = "Planned distance must be positive")
    @Column(nullable = false)
    private Double plannedDistance; // in km

    private Double actualDistance; // in km (recorded on completion)

    private Double startOdometer; // recorded on dispatch

    private Double finalOdometer; // recorded on completion

    private Double fuelConsumed; // in Liters (recorded on completion)

    @Builder.Default
    private Double revenue = 0.0; // Earned from trip for ROI tracking

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TripStatus status = TripStatus.DRAFT;

    private LocalDateTime dispatchedAt;

    private LocalDateTime completedAt;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
