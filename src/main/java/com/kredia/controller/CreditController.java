package com.kredia.controller;

import com.kredia.entity.credit.Credit;
import com.kredia.service.CreditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/credits")
public class CreditController {

    private final CreditService creditService;

    @Autowired
    public CreditController(CreditService creditService) {
        this.creditService = creditService;
    }

    @PostMapping
    public ResponseEntity<Credit> createCredit(@RequestBody Credit credit) {
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

    @PutMapping("/{id}")
    public ResponseEntity<Credit> updateCredit(@PathVariable Long id, @RequestBody Credit creditDetails) {
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
}
