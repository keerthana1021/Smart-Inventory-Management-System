package com.example.demo.service;

import com.example.demo.dto.ReportsDto;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportsPdfService {

    private final ReportsService reportsService;

    private static final float MARGIN = 50;
    private static final float LINE_HEIGHT = 14;
    private static final float TITLE_FONT_SIZE = 18;
    private static final float HEADING_FONT_SIZE = 12;
    private static final float BODY_FONT_SIZE = 10;

    public byte[] exportPdf(LocalDate from, LocalDate to) throws IOException {
        ReportsDto dto = reportsService.getReports(from, to);

        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            float pageHeight = page.getMediaBox().getHeight();

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float y = pageHeight - MARGIN;

                // Title
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), TITLE_FONT_SIZE);
                cs.newLineAtOffset(MARGIN, y);
                cs.showText("Sales Report");
                cs.endText();
                y -= LINE_HEIGHT * 1.5f;

                // Date range
                String period = (from != null ? from.format(DateTimeFormatter.ISO_LOCAL_DATE) : "All time")
                        + " to " + (to != null ? to.format(DateTimeFormatter.ISO_LOCAL_DATE) : "Today");
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), BODY_FONT_SIZE);
                cs.newLineAtOffset(MARGIN, y);
                cs.showText("Period: " + period);
                cs.endText();
                y -= LINE_HEIGHT * 2;

                // Summary
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), HEADING_FONT_SIZE);
                cs.newLineAtOffset(MARGIN, y);
                cs.showText("Summary");
                cs.endText();
                y -= LINE_HEIGHT;

                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), BODY_FONT_SIZE);
                cs.newLineAtOffset(MARGIN, y);
                cs.showText("Total Revenue: INR " + formatDecimal(dto.getTotalRevenue()));
                cs.endText();
                y -= LINE_HEIGHT;

                cs.beginText();
                cs.newLineAtOffset(MARGIN, y);
                cs.showText("Order Count: " + dto.getOrderCount());
                cs.endText();
                y -= LINE_HEIGHT * 2;

                // Revenue by Date table
                List<ReportsDto.RevenueByDate> revenueByDate = dto.getRevenueByDate();
                if (revenueByDate != null && !revenueByDate.isEmpty()) {
                    cs.beginText();
                    cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), HEADING_FONT_SIZE);
                    cs.newLineAtOffset(MARGIN, y);
                    cs.showText("Revenue by Date");
                    cs.endText();
                    y -= LINE_HEIGHT;

                    cs.beginText();
                    cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), BODY_FONT_SIZE);
                    cs.newLineAtOffset(MARGIN, y);
                    cs.showText(String.format("%-12s %12s %8s", "Date", "Revenue", "Orders"));
                    cs.endText();
                    y -= LINE_HEIGHT;

                    for (ReportsDto.RevenueByDate r : revenueByDate) {
                        cs.beginText();
                        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), BODY_FONT_SIZE);
                        cs.newLineAtOffset(MARGIN, y);
                        cs.showText(String.format("%-12s %12s %8d", r.getDate(), formatDecimal(r.getRevenue()), r.getOrderCount()));
                        cs.endText();
                        y -= LINE_HEIGHT;
                    }
                    y -= LINE_HEIGHT;
                }

                // Sales by Category table
                List<ReportsDto.SalesByCategory> salesByCategory = dto.getSalesByCategory();
                if (salesByCategory != null && !salesByCategory.isEmpty()) {
                    cs.beginText();
                    cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), HEADING_FONT_SIZE);
                    cs.newLineAtOffset(MARGIN, y);
                    cs.showText("Sales by Category");
                    cs.endText();
                    y -= LINE_HEIGHT;

                    cs.beginText();
                    cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), BODY_FONT_SIZE);
                    cs.newLineAtOffset(MARGIN, y);
                    cs.showText(String.format("%-30s %10s %12s", "Category", "Qty Sold", "Revenue"));
                    cs.endText();
                    y -= LINE_HEIGHT;

                    for (ReportsDto.SalesByCategory s : salesByCategory) {
                        String catName = s.getCategoryName();
                        if (catName != null && catName.length() > 28) catName = catName.substring(0, 25) + "...";
                        cs.beginText();
                        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), BODY_FONT_SIZE);
                        cs.newLineAtOffset(MARGIN, y);
                        cs.showText(String.format("%-30s %10d %12s", catName != null ? catName : "-", s.getQuantitySold(), formatDecimal(s.getRevenue())));
                        cs.endText();
                        y -= LINE_HEIGHT;
                    }
                }
            }

            doc.save(out);
            return out.toByteArray();
        }
    }

    private static String formatDecimal(BigDecimal bd) {
        return bd != null ? bd.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "0.00";
    }
}
