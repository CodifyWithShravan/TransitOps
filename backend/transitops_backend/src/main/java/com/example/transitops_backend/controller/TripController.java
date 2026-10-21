package com.example.transitops_backend.controller;

import com.example.transitops_backend.dto.TripCompleteRequest;
import com.example.transitops_backend.dto.TripCreateRequest;
import com.example.transitops_backend.entity.Trip;
import com.example.transitops_backend.entity.TripStatus;
import com.example.transitops_backend.service.TripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @GetMapping
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<List<Trip>> getAllTrips(@RequestParam(required = false) TripStatus status) {
        return ResponseEntity.ok(tripService.getAllTrips(status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST')")
    public ResponseEntity<Trip> getTripById(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTripById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER')")
    public ResponseEntity<Trip> createTrip(@Valid @RequestBody TripCreateRequest request) {
        return new ResponseEntity<>(tripService.createTrip(request), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/dispatch")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER')")
    public ResponseEntity<Trip> dispatchTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.dispatchTrip(id));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER')")
    public ResponseEntity<Trip> completeTrip(@PathVariable Long id, @Valid @RequestBody TripCompleteRequest request) {
        return ResponseEntity.ok(tripService.completeTrip(id, request));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'DISPATCHER')")
    public ResponseEntity<Trip> cancelTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.cancelTrip(id));
    }
}
