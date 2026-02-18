package com.kredia.controller;

import com.kredia.entity.credit.Echeance;
import com.kredia.service.EcheanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/echeances")
public class EcheanceController {

    private final EcheanceService echeanceService;

    @Autowired
    public EcheanceController(EcheanceService echeanceService) {
        this.echeanceService = echeanceService;
    }

    @PutMapping("/{echeanceId}/pay")
    public ResponseEntity<?> payEcheance(@PathVariable Long echeanceId) {
        try {
            return new ResponseEntity<>(echeanceService.payEcheance(echeanceId), HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Echeance> getEcheanceById(@PathVariable Long id) {
        return echeanceService.getEcheanceById(id)
                .map(echeance -> new ResponseEntity<>(echeance, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping
    public ResponseEntity<List<Echeance>> getAllEcheances() {
        return new ResponseEntity<>(echeanceService.getAllEcheances(), HttpStatus.OK);
    }
}
