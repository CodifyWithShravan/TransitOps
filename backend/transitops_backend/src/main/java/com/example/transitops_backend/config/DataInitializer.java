package com.example.transitops_backend.config;

import com.example.transitops_backend.entity.*;
import com.example.transitops_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final MaintenanceLogRepository maintenanceLogRepository;
    private final FuelLogRepository fuelLogRepository;
    private final ExpenseRepository expenseRepository;
    private final TripRepository tripRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsers();
        seedFleetAndDrivers();
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            log.info("Seeding initial users with default credentials...");
            String encodedPassword = passwordEncoder.encode("password123");

            User fleetManager = User.builder()
                    .name("Marcus Vance (Fleet Manager)")
                    .email("manager@transitops.com")
                    .password(encodedPassword)
                    .role(Role.FLEET_MANAGER)
                    .build();

            User dispatcher = User.builder()
                    .name("Sarah Connor (Dispatcher)")
                    .email("dispatcher@transitops.com")
                    .password(encodedPassword)
                    .role(Role.DISPATCHER)
                    .build();

            User safetyOfficer = User.builder()
                    .name("Officer John Reynolds (Safety)")
                    .email("safety@transitops.com")
                    .password(encodedPassword)
                    .role(Role.SAFETY_OFFICER)
                    .build();

            User financialAnalyst = User.builder()
                    .name("Diana Prince (Finance)")
                    .email("finance@transitops.com")
                    .password(encodedPassword)
                    .role(Role.FINANCIAL_ANALYST)
                    .build();

            userRepository.saveAll(List.of(fleetManager, dispatcher, safetyOfficer, financialAnalyst));
            log.info("Successfully seeded 4 role users. Default password for all: password123");
        }
    }

    private void seedFleetAndDrivers() {
        if (vehicleRepository.count() == 0) {
            log.info("Seeding initial vehicles...");

            Vehicle v1 = Vehicle.builder()
                    .registrationNumber("Van-05")
                    .model("Ford Transit Custom")
                    .type("Van")
                    .maxCapacity(500.0)
                    .odometer(14200.0)
                    .acquisitionCost(42000.0)
                    .status(VehicleStatus.AVAILABLE)
                    .region("North")
                    .build();

            Vehicle v2 = Vehicle.builder()
                    .registrationNumber("Van-02")
                    .model("Mercedes-Benz Sprinter")
                    .type("Van")
                    .maxCapacity(850.0)
                    .odometer(31500.0)
                    .acquisitionCost(56000.0)
                    .status(VehicleStatus.AVAILABLE)
                    .region("Central")
                    .build();

            Vehicle v3 = Vehicle.builder()
                    .registrationNumber("Truck-01")
                    .model("Volvo FH16 Globetrotter")
                    .type("Truck")
                    .maxCapacity(5000.0)
                    .odometer(68500.0)
                    .acquisitionCost(125000.0)
                    .status(VehicleStatus.AVAILABLE)
                    .region("South")
                    .build();

            Vehicle v4 = Vehicle.builder()
                    .registrationNumber("Truck-02")
                    .model("Scania R500 V8")
                    .type("Truck")
                    .maxCapacity(8000.0)
                    .odometer(102000.0)
                    .acquisitionCost(145000.0)
                    .status(VehicleStatus.IN_SHOP)
                    .region("East")
                    .build();

            Vehicle v5 = Vehicle.builder()
                    .registrationNumber("Trailer-01")
                    .model("Freightliner Cascadia Heavy")
                    .type("Trailer")
                    .maxCapacity(15000.0)
                    .odometer(215000.0)
                    .acquisitionCost(160000.0)
                    .status(VehicleStatus.RETIRED)
                    .region("West")
                    .build();

            vehicleRepository.saveAll(List.of(v1, v2, v3, v4, v5));

            // Seed Maintenance Log for Truck-02 (In Shop)
            MaintenanceLog maintenanceLog = MaintenanceLog.builder()
                    .vehicle(v4)
                    .serviceType("Engine Overhaul & Brake Service")
                    .description("Routine 100,000 km comprehensive inspection and brake pad replacement.")
                    .cost(1850.0)
                    .status(MaintenanceStatus.IN_PROGRESS)
                    .startDate(LocalDate.now().minusDays(2))
                    .build();
            maintenanceLogRepository.save(maintenanceLog);

            // Seed Fuel Log & Expense for v1 & v3
            FuelLog fuel1 = FuelLog.builder()
                    .vehicle(v1)
                    .liters(60.0)
                    .cost(96.0)
                    .logDate(LocalDate.now().minusDays(5))
                    .odometerReading(14140.0)
                    .build();
            fuelLogRepository.save(fuel1);

            Expense exp1 = Expense.builder()
                    .vehicle(v1)
                    .expenseType(ExpenseType.TOLL)
                    .amount(45.0)
                    .expenseDate(LocalDate.now().minusDays(5))
                    .description("Highway interstate toll pass")
                    .build();
            expenseRepository.save(exp1);
        }

        if (driverRepository.count() == 0) {
            log.info("Seeding initial drivers...");

            Driver d1 = Driver.builder()
                    .name("Alex Morgan")
                    .licenseNumber("DL-NY-98214")
                    .licenseCategory("Commercial")
                    .licenseExpiryDate(LocalDate.now().plusYears(3))
                    .contactNumber("+1 555-0145")
                    .safetyScore(96.5)
                    .status(DriverStatus.AVAILABLE)
                    .build();

            Driver d2 = Driver.builder()
                    .name("David Miller")
                    .licenseNumber("DL-CA-44912")
                    .licenseCategory("Heavy")
                    .licenseExpiryDate(LocalDate.now().plusYears(2))
                    .contactNumber("+1 555-0182")
                    .safetyScore(99.0)
                    .status(DriverStatus.AVAILABLE)
                    .build();

            // Expired License Driver (to test license validation!)
            Driver d3 = Driver.builder()
                    .name("Carlos Ramos (Expired License)")
                    .licenseNumber("DL-TX-11893")
                    .licenseCategory("Commercial")
                    .licenseExpiryDate(LocalDate.now().minusMonths(2))
                    .contactNumber("+1 555-0199")
                    .safetyScore(78.0)
                    .status(DriverStatus.AVAILABLE)
                    .build();

            // Suspended Driver (to test suspension validation!)
            Driver d4 = Driver.builder()
                    .name("Emma Watson (Suspended)")
                    .licenseNumber("DL-IL-78321")
                    .licenseCategory("Heavy")
                    .licenseExpiryDate(LocalDate.now().plusYears(1))
                    .contactNumber("+1 555-0163")
                    .safetyScore(55.0)
                    .status(DriverStatus.SUSPENDED)
                    .build();

            driverRepository.saveAll(List.of(d1, d2, d3, d4));
            log.info("Successfully seeded initial drivers.");
        }
    }
}
