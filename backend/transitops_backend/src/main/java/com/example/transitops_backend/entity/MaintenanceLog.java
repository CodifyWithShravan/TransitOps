package com.example.transitops_backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id", nullable = false)
    @NotNull(message = "Vehicle is required")
    private Vehicle vehicle;

    @NotBlank(message = "Service type is required (e.g., Oil Change, Brake Overhaul)")
    @Column(nullable = false)
    private String serviceType;

    private String description;

    @NotNull(message = "Cost is required")
    @PositiveOrZero(message = "Cost cannot be negative")
    @Column(nullable = false)
    private Double cost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MaintenanceStatus status = MaintenanceStatus.IN_PROGRESS;

    @NotNull(message = "Start date is required")
    @Column(nullable = false)
    @Builder.Default
    private LocalDate startDate = LocalDate.now();

    private LocalDate completedDate;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
