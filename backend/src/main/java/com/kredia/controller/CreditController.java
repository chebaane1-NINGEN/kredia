package com.kredia.controller;

import com.kredia.entity.credit.Credit;
import jakarta.validation.Valid;
import com.kredia.service.CreditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/credits")
public class CreditController {

    private final CreditService creditService;
    private final com.kredia.service.CreditExcelExportService creditExcelExportService;
    private final com.kredia.service.StatisticsPdfExportService statisticsPdfExportService;
    private final com.kredia.service.DefaultPredictionService defaultPredictionService;

    @Autowired
    public CreditController(CreditService creditService,
            com.kredia.service.CreditExcelExportService creditExcelExportService,
            com.kredia.service.StatisticsPdfExportService statisticsPdfExportService,
            com.kredia.service.DefaultPredictionService defaultPredictionService) {
        this.creditService = creditService;
        this.creditExcelExportService = creditExcelExportService;
        this.statisticsPdfExportService = statisticsPdfExportService;
        this.defaultPredictionService = defaultPredictionService;
    }

    @PostMapping
    public ResponseEntity<Credit> createCredit(@Valid @RequestBody Credit credit) {
        Credit createdCredit = creditService.createCredit(credit);
        return new ResponseEntity<>(createdCredit, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Credit> getCreditById(@PathVariable Long id) {
        return creditService.getCreditById(id)
                .map(credit -> new ResponseEntity<>(credit, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping
    public ResponseEntity<List<Credit>> getAllCredits() {
        List<Credit> credits = creditService.getAllCredits();
        return new ResponseEntity<>(credits, HttpStatus.OK);
    }

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<List<Credit>> getCreditsByUserId(@PathVariable Long userId) {
        List<Credit> credits = creditService.getCreditsByUserId(userId);
        return new ResponseEntity<>(credits, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Credit> updateCredit(@PathVariable Long id, @Valid @RequestBody Credit creditDetails) {
        try {
            Credit updatedCredit = creditService.updateCredit(id, creditDetails);
            return new ResponseEntity<>(updatedCredit, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCredit(@PathVariable Long id) {
        creditService.deleteCredit(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportCreditToExcel(@PathVariable Long id) {
        try {
            byte[] excelData = creditExcelExportService.generateCreditExcel(id);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(
                    MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=credit_" + id + ".xlsx");
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelData);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/{id}/statistics/pdf")
    public ResponseEntity<byte[]> exportStatisticsPdf(@PathVariable Long id) {
        try {
            byte[] pdfData = statisticsPdfExportService.generateStatisticsPdf(id);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=statistiques_credit_" + id + ".pdf");
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfData);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping("/{id}/predict-default")
    public ResponseEntity<?> predictDefault(@PathVariable Long id) {
        try {
            com.kredia.dto.ml.DefaultPredictionResponse response = defaultPredictionService.predictForCredit(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
