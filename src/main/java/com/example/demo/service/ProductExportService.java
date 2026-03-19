package com.example.demo.service;

import com.example.demo.dto.ProductResponse;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductExportService {

    private final ProductService productService;

    public byte[] exportCsv() throws IOException {
        List<ProductResponse> products = productService.findAllForExport();
        StringWriter sw = new StringWriter();
        sw.write("ID,SKU,Name,Description,Category,Supplier,Unit Price,Quantity,Reorder Level,Stock Status,Warehouse,Active,Created\n");
        for (ProductResponse p : products) {
            sw.write(csvEscape(p.getId()) + ",");
            sw.write(csvEscape(p.getSku()) + ",");
            sw.write(csvEscape(p.getName()) + ",");
            sw.write(csvEscape(p.getDescription()) + ",");
            sw.write(csvEscape(p.getCategoryName()) + ",");
            sw.write(csvEscape(p.getSupplierName()) + ",");
            sw.write(p.getUnitPrice() != null ? p.getUnitPrice().toString() : "");
            sw.write(",");
            sw.write(p.getCurrentQuantity() != null ? p.getCurrentQuantity().toString() : "");
            sw.write(",");
            sw.write(p.getReorderLevel() != null ? p.getReorderLevel().toString() : "");
            sw.write(",");
            sw.write(csvEscape(p.getStockStatus()) + ",");
            sw.write(csvEscape(p.getWarehouseLocation()) + ",");
            sw.write(p.isActive() ? "Yes" : "No");
            sw.write(",");
            sw.write(p.getCreatedAt() != null ? p.getCreatedAt().toString() : "");
            sw.write("\n");
        }
        return sw.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    public byte[] exportExcel() throws IOException {
        List<ProductResponse> products = productService.findAllForExport();
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Products");
            Row header = sheet.createRow(0);
            String[] headers = {"ID", "SKU", "Name", "Description", "Category", "Supplier", "Unit Price", "Quantity", "Reorder Level", "Stock Status", "Warehouse", "Active", "Created"};
            for (int i = 0; i < headers.length; i++)
                header.createCell(i).setCellValue(headers[i]);
            int rowNum = 1;
            for (ProductResponse p : products) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(p.getId() != null ? p.getId() : "");
                row.createCell(1).setCellValue(p.getSku());
                row.createCell(2).setCellValue(p.getName());
                row.createCell(3).setCellValue(p.getDescription());
                row.createCell(4).setCellValue(p.getCategoryName());
                row.createCell(5).setCellValue(p.getSupplierName());
                row.createCell(6).setCellValue(p.getUnitPrice() != null ? p.getUnitPrice().doubleValue() : 0);
                row.createCell(7).setCellValue(p.getCurrentQuantity() != null ? p.getCurrentQuantity() : 0);
                row.createCell(8).setCellValue(p.getReorderLevel() != null ? p.getReorderLevel() : 0);
                row.createCell(9).setCellValue(p.getStockStatus());
                row.createCell(10).setCellValue(p.getWarehouseLocation());
                row.createCell(11).setCellValue(p.isActive() ? "Yes" : "No");
                row.createCell(12).setCellValue(p.getCreatedAt() != null ? p.getCreatedAt().toString() : "");
            }
            for (int i = 0; i < headers.length; i++)
                sheet.autoSizeColumn(i);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private static String csvEscape(Object o) {
        if (o == null) return "";
        String s = o.toString();
        if (s.contains(",") || s.contains("\"") || s.contains("\n"))
            return "\"" + s.replace("\"", "\"\"") + "\"";
        return s;
    }
}
