package com.example.demo.controller;

import com.example.demo.service.CsvSeedService;
import com.example.demo.service.SeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/seed")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SeedController {

    private final SeedService seedService;
    private final CsvSeedService csvSeedService;

    @PostMapping
    public ResponseEntity<SeedService.SeedResult> loadSeed() {
        return ResponseEntity.ok(seedService.loadSeedData());
    }

    /**
     * Seed from retail_store_inventory.csv (project root or current dir).
     * Optional query param: filename (default: retail_store_inventory.csv)
     * Creates: Categories (unique), Suppliers (by Region, Indian phone), Products (unique by Product ID + Category). Prices converted to INR.
     */
    @PostMapping("/csv")
    public ResponseEntity<CsvSeedService.CsvSeedResult> loadCsv(
            @RequestParam(required = false) String filename) throws IOException {
        return ResponseEntity.ok(csvSeedService.loadFromCsv(filename));
    }
}
