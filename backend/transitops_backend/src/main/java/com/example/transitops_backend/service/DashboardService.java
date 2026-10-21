package com.example.transitops_backend.service;

import com.example.transitops_backend.entity.*;
import com.example.transitops_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final TripRepository tripRepository;
    private final FuelLogRepository fuelLogRepository;
    private final ExpenseRepository expenseRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardKPIs(String type, VehicleStatus status, String region) {
        List<Vehicle> allVehicles = vehicleRepository.findAll();

        // Apply filters if provided
        List<Vehicle> filteredVehicles = allVehicles.stream()
                .filter(v -> type == null || type.isBlank() || v.getType().equalsIgnoreCase(type.trim()))
                .filter(v -> status == null || v.getStatus() == status)
                .filter(v -> region == null || region.isBlank() || (v.getRegion() != null && v.getRegion().equalsIgnoreCase(region.trim())))
                .collect(Collectors.toList());

        long totalVehicles = filteredVehicles.size();
        long activeVehicles = filteredVehicles.stream().filter(v -> v.getStatus() == VehicleStatus.ON_TRIP).count();
        long availableVehicles = filteredVehicles.stream().filter(v -> v.getStatus() == VehicleStatus.AVAILABLE).count();
        long inShopVehicles = filteredVehicles.stream().filter(v -> v.getStatus() == VehicleStatus.IN_SHOP).count();
        long retiredVehicles = filteredVehicles.stream().filter(v -> v.getStatus() == VehicleStatus.RETIRED).count();

        // Active, Pending, and Completed trips
        long activeTrips = tripRepository.countByStatus(TripStatus.DISPATCHED);
        long pendingTrips = tripRepository.countByStatus(TripStatus.DRAFT);
        long completedTrips = tripRepository.countByStatus(TripStatus.COMPLETED);

        // Drivers roster
        long driversAvailable = driverRepository.countByStatus(DriverStatus.AVAILABLE);
        long driversOnTrip = driverRepository.countByStatus(DriverStatus.ON_TRIP);
        long driversOnDuty = driversAvailable + driversOnTrip;
        long totalDrivers = driverRepository.count();

        // Fleet Utilization (%) = [Active Vehicles / (Total Fleet - Retired)] * 100
        long activeDenominator = totalVehicles - retiredVehicles;
        double fleetUtilization = activeDenominator > 0
                ? ((double) activeVehicles / activeDenominator) * 100.0
                : 0.0;

        // Global Financial Costs & Revenue
        double totalFuelCost = 0.0;
        double totalFuelLiters = 0.0;
        double totalMaintenanceCost = 0.0;
        double totalOtherExpenses = 0.0;
        double totalRevenue = 0.0;
        double totalDistance = 0.0;

        for (Vehicle v : filteredVehicles) {
            Double fCost = fuelLogRepository.sumFuelCostByVehicleId(v.getId());
            Double fLiters = fuelLogRepository.sumFuelLitersByVehicleId(v.getId());
            Double mCost = expenseRepository.sumExpensesByVehicleIdAndType(v.getId(), ExpenseType.MAINTENANCE);
            Double allExp = expenseRepository.sumExpensesByVehicleId(v.getId());

            if (fCost != null) totalFuelCost += fCost;
            if (fLiters != null) totalFuelLiters += fLiters;
            if (mCost != null) totalMaintenanceCost += mCost;
            if (allExp != null && fCost != null && mCost != null) {
                double diff = allExp - fCost - mCost;
                if (diff > 0) totalOtherExpenses += diff;
            }

            List<Trip> vTrips = tripRepository.findByVehicleId(v.getId());
            for (Trip t : vTrips) {
                if (t.getRevenue() != null) totalRevenue += t.getRevenue();
                if (t.getStatus() == TripStatus.COMPLETED && t.getActualDistance() != null) {
                    totalDistance += t.getActualDistance();
                }
            }
        }

        double totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalOtherExpenses;
        double avgFuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters) : 0.0;

        Map<String, Object> kpis = new HashMap<>();
        kpis.put("totalVehicles", totalVehicles);
        kpis.put("activeVehicles", activeVehicles);
        kpis.put("availableVehicles", availableVehicles);
        kpis.put("vehiclesInMaintenance", inShopVehicles);
        kpis.put("vehiclesInShop", inShopVehicles); // Alias for frontend compatibility
        kpis.put("retiredVehicles", retiredVehicles);

        kpis.put("activeTrips", activeTrips);
        kpis.put("pendingTrips", pendingTrips);
        kpis.put("completedTrips", completedTrips);

        kpis.put("driversOnDuty", driversOnDuty);
        kpis.put("availableDrivers", driversAvailable);
        kpis.put("totalDrivers", totalDrivers);

        kpis.put("fleetUtilization", Math.round(fleetUtilization * 10.0) / 10.0);
        kpis.put("totalFuelCost", Math.round(totalFuelCost * 100.0) / 100.0);
        kpis.put("totalMaintenanceCost", Math.round(totalMaintenanceCost * 100.0) / 100.0);
        kpis.put("totalOperationalCost", Math.round(totalOperationalCost * 100.0) / 100.0);
        kpis.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);
        kpis.put("avgFuelEfficiency", Math.round(avgFuelEfficiency * 100.0) / 100.0);

        return kpis;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getVehicleAnalytics(String type, VehicleStatus status, String region) {
        List<Vehicle> vehicles = vehicleRepository.findAll().stream()
                .filter(v -> type == null || type.isBlank() || v.getType().equalsIgnoreCase(type.trim()))
                .filter(v -> status == null || v.getStatus() == status)
                .filter(v -> region == null || region.isBlank() || (v.getRegion() != null && v.getRegion().equalsIgnoreCase(region.trim())))
                .collect(Collectors.toList());

        List<Map<String, Object>> analyticsList = new ArrayList<>();

        for (Vehicle v : vehicles) {
            Map<String, Object> stats = new HashMap<>();
            stats.put("vehicleId", v.getId());
            stats.put("registrationNumber", v.getRegistrationNumber());
            stats.put("model", v.getModel());
            stats.put("type", v.getType());
            stats.put("region", v.getRegion() != null ? v.getRegion() : "Central");
            stats.put("status", v.getStatus().name());
            stats.put("odometer", v.getOdometer());
            stats.put("acquisitionCost", v.getAcquisitionCost());

            // Trips by this vehicle
            List<Trip> trips = tripRepository.findByVehicleId(v.getId());
            double totalRevenue = trips.stream()
                    .filter(t -> t.getRevenue() != null)
                    .mapToDouble(Trip::getRevenue)
                    .sum();

            double totalDistance = trips.stream()
                    .filter(t -> t.getStatus() == TripStatus.COMPLETED && t.getActualDistance() != null)
                    .mapToDouble(Trip::getActualDistance)
                    .sum();

            long completedTrips = trips.stream()
                    .filter(t -> t.getStatus() == TripStatus.COMPLETED)
                    .count();

            // Fuel stats
            Double totalFuelLiters = fuelLogRepository.sumFuelLitersByVehicleId(v.getId());
            Double totalFuelCost = fuelLogRepository.sumFuelCostByVehicleId(v.getId());

            // Maintenance cost
            Double maintenanceCost = expenseRepository.sumExpensesByVehicleIdAndType(v.getId(), ExpenseType.MAINTENANCE);
            Double totalOperationalCost = (totalFuelCost != null ? totalFuelCost : 0.0) +
                    (maintenanceCost != null ? maintenanceCost : 0.0);

            // Fuel Efficiency = Distance / Fuel
            double fuelEfficiency = (totalFuelLiters != null && totalFuelLiters > 0)
                    ? totalDistance / totalFuelLiters
                    : 0.0;

            // Vehicle ROI = [Revenue - (Maintenance + Fuel)] / Acquisition Cost
            double roi = (v.getAcquisitionCost() != null && v.getAcquisitionCost() > 0)
                    ? ((totalRevenue - totalOperationalCost) / v.getAcquisitionCost()) * 100.0
                    : 0.0;

            stats.put("totalTrips", trips.size());
            stats.put("completedTrips", completedTrips);
            stats.put("totalDistance", Math.round(totalDistance * 10.0) / 10.0);
            stats.put("fuelLiters", Math.round((totalFuelLiters != null ? totalFuelLiters : 0.0) * 10.0) / 10.0);
            stats.put("fuelCost", Math.round((totalFuelCost != null ? totalFuelCost : 0.0) * 100.0) / 100.0);
            stats.put("maintenanceCost", Math.round((maintenanceCost != null ? maintenanceCost : 0.0) * 100.0) / 100.0);
            stats.put("totalCost", Math.round(totalOperationalCost * 100.0) / 100.0);
            stats.put("totalOperationalCost", Math.round(totalOperationalCost * 100.0) / 100.0);
            stats.put("revenue", Math.round(totalRevenue * 100.0) / 100.0);
            stats.put("fuelEfficiency", Math.round(fuelEfficiency * 100.0) / 100.0);
            stats.put("roiPercentage", Math.round(roi * 100.0) / 100.0);

            analyticsList.add(stats);
        }

        return analyticsList;
    }

    public ByteArrayInputStream generateAnalyticsCsv() {
        List<Map<String, Object>> data = getVehicleAnalytics(null, null, null);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8)) {
            // CSV Header
            writer.println("Registration Number,Model,Type,Region,Status,Odometer (km),Acquisition Cost ($),Distance Traveled (km),Fuel Consumed (L),Fuel Cost ($),Maintenance Cost ($),Total Operational Cost ($),Revenue ($),Fuel Efficiency (km/L),ROI (%)");

            for (Map<String, Object> row : data) {
                writer.printf("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s%n",
                        row.get("registrationNumber"),
                        row.get("model"),
                        row.get("type"),
                        row.get("region"),
                        row.get("status"),
                        row.get("odometer"),
                        row.get("acquisitionCost"),
                        row.get("totalDistance"),
                        row.get("fuelLiters"),
                        row.get("fuelCost"),
                        row.get("maintenanceCost"),
                        row.get("totalOperationalCost"),
                        row.get("revenue"),
                        row.get("fuelEfficiency"),
                        row.get("roiPercentage")
                );
            }
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    public ByteArrayInputStream generateAnalyticsPdf() {
        List<Map<String, Object>> data = getVehicleAnalytics(null, null, null);
        Map<String, Object> kpis = getDashboardKPIs(null, null, null);

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                PDType1Font boldFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                PDType1Font regularFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

                float y = 790;

                // Header Title
                content.beginText();
                content.setFont(boldFont, 20);
                content.newLineAtOffset(40, y);
                content.showText("TransitOps - Fleet Performance & Analytics");
                content.endText();

                y -= 20;
                content.beginText();
                content.setFont(regularFont, 10);
                content.newLineAtOffset(40, y);
                content.showText("Generated: " + LocalDate.now().format(DateTimeFormatter.ISO_DATE) +
                        " | Smart Transport Operations Official Executive Report");
                content.endText();

                // Separator Line
                y -= 12;
                content.moveTo(40, y);
                content.lineTo(555, y);
                content.stroke();

                // KPI Summary Section
                y -= 25;
                content.beginText();
                content.setFont(boldFont, 13);
                content.newLineAtOffset(40, y);
                content.showText("Operations Executive KPI Snapshot");
                content.endText();

                y -= 18;
                content.beginText();
                content.setFont(regularFont, 10);
                content.newLineAtOffset(40, y);
                content.showText(String.format("Total Fleet: %s  |  Active Trips: %s  |  Fleet Utilization: %s%%  |  Drivers On Duty: %s",
                        kpis.get("totalVehicles"), kpis.get("activeTrips"), kpis.get("fleetUtilization"), kpis.get("driversOnDuty")));
                content.endText();

                y -= 15;
                content.beginText();
                content.setFont(regularFont, 10);
                content.newLineAtOffset(40, y);
                content.showText(String.format("Total Fuel Cost: $%s  |  Maintenance Cost: $%s  |  Total Operations: $%s",
                        kpis.get("totalFuelCost"), kpis.get("totalMaintenanceCost"), kpis.get("totalOperationalCost")));
                content.endText();

                // Table Title
                y -= 30;
                content.beginText();
                content.setFont(boldFont, 12);
                content.newLineAtOffset(40, y);
                content.showText("Vehicle Fleet Registry & ROI Performance Ledger");
                content.endText();

                y -= 15;
                // Table Headers
                content.beginText();
                content.setFont(boldFont, 8);
                content.newLineAtOffset(40, y);
                content.showText(String.format("%-12s %-20s %-8s %-10s %-12s %-12s %-12s %-10s",
                        "REG #", "MODEL", "TYPE", "STATUS", "OP COST ($)", "REVENUE ($)", "EFF (km/L)", "ROI (%)"));
                content.endText();

                y -= 6;
                content.moveTo(40, y);
                content.lineTo(555, y);
                content.stroke();

                // Table Rows
                content.setFont(regularFont, 8);
                for (Map<String, Object> v : data) {
                    y -= 16;
                    if (y < 50) break; // Keep within printable page area

                    String reg = String.valueOf(v.get("registrationNumber"));
                    String model = String.valueOf(v.get("model"));
                    if (model.length() > 18) model = model.substring(0, 16) + "..";
                    String type = String.valueOf(v.get("type"));
                    String status = String.valueOf(v.get("status"));
                    String opCost = String.format("$%.2f", ((Number) v.get("totalOperationalCost")).doubleValue());
                    String rev = String.format("$%.2f", ((Number) v.get("revenue")).doubleValue());
                    String eff = String.format("%.1f", ((Number) v.get("fuelEfficiency")).doubleValue());
                    String roi = String.format("%.1f%%", ((Number) v.get("roiPercentage")).doubleValue());

                    content.beginText();
                    content.newLineAtOffset(40, y);
                    content.showText(String.format("%-12s %-20s %-8s %-10s %-12s %-12s %-12s %-10s",
                            reg, model, type, status, opCost, rev, eff, roi));
                    content.endText();
                }

                // Footer
                y = 35;
                content.moveTo(40, y);
                content.lineTo(555, y);
                content.stroke();

                content.beginText();
                content.setFont(regularFont, 8);
                content.newLineAtOffset(40, 25);
                content.showText("TransitOps Automated Compliance & Asset Optimization Platform • Confidential Internal Report");
                content.endText();
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (Exception e) {
            log.error("Failed to generate PDF analytics report", e);
            throw new RuntimeException("Error generating PDF analytics: " + e.getMessage(), e);
        }
    }
}
