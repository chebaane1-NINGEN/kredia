package com.kredia.service;

import com.kredia.entity.credit.Credit;
import com.kredia.entity.credit.Echeance;
import com.kredia.entity.credit.KycLoan;
import com.kredia.repository.CreditRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class CreditExcelExportService {

    private final CreditRepository creditRepository;

    @Autowired
    public CreditExcelExportService(CreditRepository creditRepository) {
        this.creditRepository = creditRepository;
    }

    public byte[] generateCreditExcel(Long creditId) throws IOException {
        Credit credit = creditRepository.findById(creditId)
                .orElseThrow(() -> new RuntimeException("Crédit non trouvé : " + creditId));

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            createCreditInfoSheet(workbook, credit, headerStyle);

            createEcheancierSheet(workbook, credit.getEcheances(), headerStyle);

            createKycLoanSheet(workbook, credit.getKycLoanDocuments(), headerStyle);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void createCreditInfoSheet(Workbook workbook, Credit credit, CellStyle headerStyle) {
        Sheet sheet = workbook.createSheet("Informations Crédit");
        int rowIdx = 0;

        String[][] creditData = {
                { "ID Crédit", String.valueOf(credit.getCreditId()) },
                { "Montant", credit.getAmount() != null ? credit.getAmount().toString() : "" },
                { "Taux d'intérêt (%)", credit.getInterestRate() != null ? credit.getInterestRate().toString() : "" },
                { "Date de début", credit.getStartDate() != null ? credit.getStartDate().toString() : "" },
                { "Date de fin", credit.getEndDate() != null ? credit.getEndDate().toString() : "" },
                { "Durée (mois)", credit.getTermMonths() != null ? String.valueOf(credit.getTermMonths()) : "" },
                { "Type de remboursement", credit.getRepaymentType() != null ? credit.getRepaymentType().name() : "" },
                { "Mensualité", credit.getMonthlyPayment() != null ? credit.getMonthlyPayment().toString() : "" },
                { "Statut", credit.getStatus() != null ? credit.getStatus().name() : "" },
                { "Income", credit.getIncome() != null ? credit.getIncome().toString() : "" },
                { "Dependents", credit.getDependents() != null ? String.valueOf(credit.getDependents()) : "" },
                { "Date de création", credit.getCreatedAt() != null ? credit.getCreatedAt().toString() : "" }
        };

        for (String[] data : creditData) {
            Row row = sheet.createRow(rowIdx++);
            Cell cellLabel = row.createCell(0);
            cellLabel.setCellValue(data[0]);
            cellLabel.setCellStyle(headerStyle);

            Cell cellValue = row.createCell(1);
            cellValue.setCellValue(data[1]);
        }
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }

    private void createEcheancierSheet(Workbook workbook, List<Echeance> echeances, CellStyle headerStyle) {
        Sheet sheet = workbook.createSheet("Échéancier");

        Row headerRow = sheet.createRow(0);
        String[] columns = { "Numéro", "Date", "Capital Début", "Mensualité", "Amortissement", "Intérêt",
                "Solde Restant", "Statut", "Montant Payé", "Date de Paiement" };
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowIdx = 1;
        int lastDataRow = rowIdx;
        if (echeances != null) {
            for (Echeance e : echeances) {
                Row row = sheet.createRow(rowIdx++);
                lastDataRow = rowIdx - 1;
                
                String status = e.getStatus() != null ? e.getStatus().name() : "";
                IndexedColors bgColor = null;
                
                if ("PAID".equals(status)) {
                    bgColor = IndexedColors.LIGHT_GREEN;
                } else if ("PARTIALLY_PAID".equals(status)) {
                    bgColor = IndexedColors.YELLOW;
                } else if ("OVERDUE".equals(status)) {
                    bgColor = IndexedColors.RED;
                } else if ("PENDING".equals(status)) {
                    bgColor = IndexedColors.LIGHT_BLUE;
                }
                
                for (int i = 0; i < 10; i++) {
                    Cell cell = row.createCell(i);
                    
                    switch (i) {
                        case 0:
                            cell.setCellValue(e.getEcheanceNumber() != null ? e.getEcheanceNumber() : 0);
                            break;
                        case 1:
                            cell.setCellValue(e.getDueDate() != null ? e.getDueDate().toString() : "");
                            break;
                        case 2:
                            cell.setCellValue(e.getCapitalDebut() != null ? e.getCapitalDebut().doubleValue() : 0.0);
                            break;
                        case 3:
                            cell.setCellValue(e.getAmountDue() != null ? e.getAmountDue().doubleValue() : 0.0);
                            break;
                        case 4:
                            cell.setCellValue(e.getPrincipalDue() != null ? e.getPrincipalDue().doubleValue() : 0.0);
                            break;
                        case 5:
                            cell.setCellValue(e.getInterestDue() != null ? e.getInterestDue().doubleValue() : 0.0);
                            break;
                        case 6:
                            cell.setCellValue(e.getRemainingBalance() != null ? e.getRemainingBalance().doubleValue() : 0.0);
                            break;
                        case 7:
                            cell.setCellValue(status);
                            break;
                        case 8:
                            cell.setCellValue(e.getAmountPaid() != null ? e.getAmountPaid().doubleValue() : 0.0);
                            break;
                        case 9:
                            cell.setCellValue(e.getPaidAt() != null ? e.getPaidAt().toString() : "");
                            break;
                    }
                    
                    if (bgColor != null) {
                        CellStyle cellStyle = workbook.createCellStyle();
                        cellStyle.setFillForegroundColor(bgColor.getIndex());
                        cellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                        cell.setCellStyle(cellStyle);
                    }
                }
            }
        }

        if (echeances != null && !echeances.isEmpty()) {
            sheet.setAutoFilter(new org.apache.poi.ss.util.CellRangeAddress(0, lastDataRow, 0, columns.length - 1));
        }

        rowIdx++;
        Row legendRow1 = sheet.createRow(rowIdx++);
        legendRow1.createCell(0).setCellValue("Légende des couleurs:");
        
        CellStyle greenLegendStyle = workbook.createCellStyle();
        greenLegendStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        greenLegendStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        Row legendRow2 = sheet.createRow(rowIdx++);
        Cell greenCell = legendRow2.createCell(0);
        greenCell.setCellValue("PAID");
        greenCell.setCellStyle(greenLegendStyle);
        legendRow2.createCell(1).setCellValue("= Échéance payée intégralement");
        
        CellStyle yellowLegendStyle = workbook.createCellStyle();
        yellowLegendStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
        yellowLegendStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        Row legendRow3 = sheet.createRow(rowIdx++);
        Cell yellowCell = legendRow3.createCell(0);
        yellowCell.setCellValue("PARTIALLY_PAID");
        yellowCell.setCellStyle(yellowLegendStyle);
        legendRow3.createCell(1).setCellValue("= Échéance partiellement payée");
        
        CellStyle redLegendStyle = workbook.createCellStyle();
        redLegendStyle.setFillForegroundColor(IndexedColors.RED.getIndex());
        redLegendStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        Row legendRow4 = sheet.createRow(rowIdx++);
        Cell redCell = legendRow4.createCell(0);
        redCell.setCellValue("OVERDUE");
        redCell.setCellStyle(redLegendStyle);
        legendRow4.createCell(1).setCellValue("= Échéance en retard");

        CellStyle blueLegendStyle = workbook.createCellStyle();
        blueLegendStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        blueLegendStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        Row legendRow5 = sheet.createRow(rowIdx++);
        Cell blueCell = legendRow5.createCell(0);
        blueCell.setCellValue("PENDING");
        blueCell.setCellStyle(blueLegendStyle);
        legendRow5.createCell(1).setCellValue("= Échéance en attente");

        for (int i = 0; i < columns.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private void createKycLoanSheet(Workbook workbook, List<KycLoan> kycLoans, CellStyle headerStyle) {
        Sheet sheet = workbook.createSheet("Documents KYC");

        Row headerRow = sheet.createRow(0);
        String[] columns = { "ID Document", "Type", "Chemin d'accès", "Statut", "Date de soumission" };
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowIdx = 1;
        int lastDataRow = rowIdx;
        if (kycLoans != null) {
            for (KycLoan kyc : kycLoans) {
                Row row = sheet.createRow(rowIdx++);
                lastDataRow = rowIdx - 1;
                
                String status = kyc.getVerifiedStatus() != null ? kyc.getVerifiedStatus().name() : "";
                IndexedColors bgColor = null;
                
                if ("APPROVED".equals(status)) {
                    bgColor = IndexedColors.LIGHT_GREEN;
                } else if ("REJECTED".equals(status)) {
                    bgColor = IndexedColors.RED;
                }
                
                for (int i = 0; i < 5; i++) {
                    Cell cell = row.createCell(i);
                    
                    switch (i) {
                        case 0:
                            cell.setCellValue(kyc.getKycLoanId() != null ? String.valueOf(kyc.getKycLoanId()) : "");
                            break;
                        case 1:
                            cell.setCellValue(kyc.getDocumentType() != null ? kyc.getDocumentType().name() : "");
                            break;
                        case 2:
                            cell.setCellValue(kyc.getDocumentPath() != null ? kyc.getDocumentPath() : "");
                            break;
                        case 3:
                            cell.setCellValue(status);
                            break;
                        case 4:
                            cell.setCellValue(kyc.getSubmittedAt() != null ? kyc.getSubmittedAt().toString() : "");
                            break;
                    }
                    
                    if (bgColor != null) {
                        CellStyle cellStyle = workbook.createCellStyle();
                        cellStyle.setFillForegroundColor(bgColor.getIndex());
                        cellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                        cell.setCellStyle(cellStyle);
                    }
                }
            }
        }

        if (kycLoans != null && !kycLoans.isEmpty()) {
            sheet.setAutoFilter(new org.apache.poi.ss.util.CellRangeAddress(0, lastDataRow, 0, columns.length - 1));
        }

        rowIdx++;
        Row legendRow1 = sheet.createRow(rowIdx++);
        legendRow1.createCell(0).setCellValue("Légende des couleurs:");
        
        CellStyle greenLegendStyle = workbook.createCellStyle();
        greenLegendStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        greenLegendStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        Row legendRow2 = sheet.createRow(rowIdx++);
        Cell greenCell = legendRow2.createCell(0);
        greenCell.setCellValue("APPROVED");
        greenCell.setCellStyle(greenLegendStyle);
        legendRow2.createCell(1).setCellValue("= Document approuvé");
        
        CellStyle redLegendStyle = workbook.createCellStyle();
        redLegendStyle.setFillForegroundColor(IndexedColors.RED.getIndex());
        redLegendStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        Row legendRow3 = sheet.createRow(rowIdx++);
        Cell redCell = legendRow3.createCell(0);
        redCell.setCellValue("REJECTED");
        redCell.setCellStyle(redLegendStyle);
        legendRow3.createCell(1).setCellValue("= Document rejeté");

        for (int i = 0; i < columns.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }
}