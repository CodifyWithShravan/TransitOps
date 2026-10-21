package com.example.transitops_backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fuel_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuelLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id", nullable = false)
    @NotNull(message = "Vehicle is required")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip; // Optional: associates fuel consumed on a specific trip

    @NotNull(message = "Fuel quantity in liters is required")
    @Positive(message = "Liters must be positive")
    @Column(nullable = false)
    private Double liters;

    @NotNull(message = "Fuel cost is required")
    @Positive(message = "Cost must be positive")
    @Column(nullable = false)
    private Double cost;

    @NotNull(message = "Log date is required")
    @Column(nullable = false)
    @Builder.Default
    private LocalDate logDate = LocalDate.now();

    private Double odometerReading;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
