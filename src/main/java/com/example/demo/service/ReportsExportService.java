package com.example.demo.service;

import com.example.demo.dto.ReportsDto;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportsExportService {

    private final ReportsService reportsService;

    public byte[] exportCsv(LocalDate from, LocalDate to) throws IOException {
        ReportsDto dto = reportsService.getReports(from, to);
        StringWriter sw = new StringWriter();
        sw.write("Report Summary\n");
        sw.write("Total Revenue," + (dto.getTotalRevenue() != null ? dto.getTotalRevenue() : BigDecimal.ZERO) + "\n");
        sw.write("Order Count," + dto.getOrderCount() + "\n\n");

        sw.write("Revenue by Date\n");
        sw.write("Date,Revenue,Order Count\n");
        for (ReportsDto.RevenueByDate r : dto.getRevenueByDate() != null ? dto.getRevenueByDate() : List.<ReportsDto.RevenueByDate>of()) {
            sw.write(csvEscape(r.getDate()) + ",");
            sw.write(r.getRevenue() != null ? r.getRevenue().toString() : "0");
            sw.write(",");
            sw.write(String.valueOf(r.getOrderCount()));
            sw.write("\n");
        }

        sw.write("\nSales by Category\n");
        sw.write("Category,Quantity Sold,Revenue\n");
        for (ReportsDto.SalesByCategory s : dto.getSalesByCategory() != null ? dto.getSalesByCategory() : List.<ReportsDto.SalesByCategory>of()) {
            sw.write(csvEscape(s.getCategoryName()) + ",");
            sw.write(String.valueOf(s.getQuantitySold()));
            sw.write(",");
            sw.write(s.getRevenue() != null ? s.getRevenue().toString() : "0");
            sw.write("\n");
        }
        return sw.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportExcel(LocalDate from, LocalDate to) throws IOException {
        ReportsDto dto = reportsService.getReports(from, to);
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet summarySheet = workbook.createSheet("Summary");
            int rowNum = 0;
            summarySheet.createRow(rowNum++).createCell(0).setCellValue("Total Revenue");
            summarySheet.getRow(rowNum - 1).createCell(1).setCellValue(dto.getTotalRevenue() != null ? dto.getTotalRevenue().doubleValue() : 0);
            summarySheet.createRow(rowNum++).createCell(0).setCellValue("Order Count");
            summarySheet.getRow(rowNum - 1).createCell(1).setCellValue(dto.getOrderCount());

            Sheet revenueSheet = workbook.createSheet("Revenue by Date");
            Row revHeader = revenueSheet.createRow(0);
            revHeader.createCell(0).setCellValue("Date");
            revHeader.createCell(1).setCellValue("Revenue");
            revHeader.createCell(2).setCellValue("Order Count");
            int revRow = 1;
            for (ReportsDto.RevenueByDate r : dto.getRevenueByDate() != null ? dto.getRevenueByDate() : List.<ReportsDto.RevenueByDate>of()) {
                Row row = revenueSheet.createRow(revRow++);
                row.createCell(0).setCellValue(r.getDate());
                row.createCell(1).setCellValue(r.getRevenue() != null ? r.getRevenue().doubleValue() : 0);
                row.createCell(2).setCellValue(r.getOrderCount());
            }
            revenueSheet.autoSizeColumn(0);
            revenueSheet.autoSizeColumn(1);
            revenueSheet.autoSizeColumn(2);

            Sheet categorySheet = workbook.createSheet("Sales by Category");
            Row catHeader = categorySheet.createRow(0);
            catHeader.createCell(0).setCellValue("Category");
            catHeader.createCell(1).setCellValue("Quantity Sold");
            catHeader.createCell(2).setCellValue("Revenue");
            int catRow = 1;
            for (ReportsDto.SalesByCategory s : dto.getSalesByCategory() != null ? dto.getSalesByCategory() : List.<ReportsDto.SalesByCategory>of()) {
                Row row = categorySheet.createRow(catRow++);
                row.createCell(0).setCellValue(s.getCategoryName());
                row.createCell(1).setCellValue(s.getQuantitySold());
                row.createCell(2).setCellValue(s.getRevenue() != null ? s.getRevenue().doubleValue() : 0);
            }
            categorySheet.autoSizeColumn(0);
            categorySheet.autoSizeColumn(1);
            categorySheet.autoSizeColumn(2);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private static String csvEscape(String s) {
        if (s == null) return "";
        if (s.contains(",") || s.contains("\"") || s.contains("\n"))
            return "\"" + s.replace("\"", "\"\"") + "\"";
        return s;
    }
}
