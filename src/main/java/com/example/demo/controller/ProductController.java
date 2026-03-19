package com.example.demo.controller;

import com.example.demo.dto.PageResponse;
import com.example.demo.dto.ProductRequest;
import com.example.demo.dto.ProductResponse;
import com.example.demo.dto.BulkStockUpdateRequest;
import com.example.demo.service.BulkProductService;
import com.example.demo.service.ProductExportService;
import com.example.demo.service.ProductService;
import com.example.demo.service.ReorderSuggestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final ProductExportService productExportService;
    private final BulkProductService bulkProductService;
    private final ReorderSuggestionService reorderSuggestionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(request));
    }

    @GetMapping
    public PageResponse<ProductResponse> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String warehouseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        var sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        var pageable = PageRequest.of(page, size, sort);
        var result = productService.findAll(search, categoryId, warehouseId, pageable);
        return new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isFirst(), result.isLast());
    }

    @GetMapping("/scan")
    public ResponseEntity<ProductResponse> scan(@RequestParam String barcode) {
        return ResponseEntity.ok(productService.scanByBarcodeOrSku(barcode));
    }

    @GetMapping("/low-stock")
    public List<ProductResponse> lowStock() {
        return productService.getLowStock();
    }

    @GetMapping(value = "/export/csv", produces = "text/csv")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<byte[]> exportCsv() throws java.io.IOException {
        byte[] body = productExportService.exportCsv();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "products.csv");
        return ResponseEntity.ok().headers(headers).body(body);
    }

    @GetMapping(value = "/export/excel", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<byte[]> exportExcel() throws java.io.IOException {
        byte[] body = productExportService.exportExcel();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "products.xlsx");
        return ResponseEntity.ok().headers(headers).body(body);
    }

    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable String id) {
        return productService.getById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ProductResponse update(@PathVariable String id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @PostMapping(value = "/bulk/import", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<?> bulkImport(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        var result = bulkProductService.importFromCsv(file);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/reorder-suggestions")
    public List<com.example.demo.dto.ReorderSuggestionDto> reorderSuggestions() {
        return reorderSuggestionService.getSuggestions();
    }

    @PostMapping("/bulk/stock-update")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<?> bulkStockUpdate(@Valid @RequestBody BulkStockUpdateRequest request) {
        var result = bulkProductService.bulkStockUpdate(request);
        return ResponseEntity.ok(result);
    }
}
