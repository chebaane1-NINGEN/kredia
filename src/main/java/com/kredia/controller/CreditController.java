package com.kredia.controller;

import com.kredia.common.Role;
import com.kredia.entity.credit.Credit;
import com.kredia.service.CreditService;
import com.kredia.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    public ResponseEntity<Credit> createCredit(@RequestBody Credit credit, @AuthenticationPrincipal User user) {
        credit.setUser(user);
        Credit createdCredit = creditService.createCredit(credit);
        return new ResponseEntity<>(createdCredit, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Credit> getCreditById(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return creditService.getCreditById(id)
                .map(credit -> {
                    if (user.getRole() == Role.ADMIN || user.getRole() == Role.AGENT || credit.getUser().getUserId().equals(user.getUserId())) {
                        return new ResponseEntity<>(credit, HttpStatus.OK);
                    }
                    return new ResponseEntity<Credit>(HttpStatus.FORBIDDEN);
                })
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping
    public ResponseEntity<List<Credit>> getAllCredits(@AuthenticationPrincipal User user) {
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.AGENT) {
            return new ResponseEntity<>(creditService.getAllCredits(), HttpStatus.OK);
        }
        return new ResponseEntity<>(creditService.getCreditsByUser(user.getUserId()), HttpStatus.OK);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
    public ResponseEntity<Credit> updateCredit(@PathVariable Long id,
            @RequestBody Credit creditDetails,
            @AuthenticationPrincipal User user) {
        try {
            Credit updatedCredit = creditService.updateCredit(id, creditDetails, user.getUserId());
            return new ResponseEntity<>(updatedCredit, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
    public ResponseEntity<Void> deleteCredit(@PathVariable Long id) {
        creditService.deleteCredit(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
