package com.kredia.controller;

import com.kredia.entity.investment.InvestmentAsset;
import com.kredia.entity.investment.InvestmentOrder;
import com.kredia.entity.investment.InvestmentStrategy;
import com.kredia.entity.support.ReclamationAttachment;
import com.kredia.entity.support.ReclamationHistory;
import com.kredia.entity.user.KycDocument;
import com.kredia.entity.wallet.Transaction;
import com.kredia.entity.wallet.TransactionAuditLog;
import com.kredia.entity.wallet.TransactionLoan;
import com.kredia.entity.wallet.VirtualCard;
import com.kredia.entity.wallet.Wallet;
import com.kredia.enums.KycStatus;
import com.kredia.enums.OrderStatus;
import com.kredia.repository.InvestmentOrderRepository;
import com.kredia.repository.ReclamationAttachmentRepository;
import com.kredia.repository.ReclamationHistoryRepository;
import com.kredia.repository.TransactionAuditLogRepository;
import com.kredia.repository.TransactionRepository;
import com.kredia.repository.VirtualCardRepository;
import com.kredia.repository.WalletRepository;
import com.kredia.repository.user.KycDocumentRepository;
import com.kredia.service.InvestmentService;
import com.kredia.service.WalletService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
public class LegacyApiCompatibilityController {

    private final InvestmentService investmentService;
    private final InvestmentOrderRepository investmentOrderRepository;
    private final WalletRepository walletRepository;
    private final WalletService walletService;
    private final VirtualCardRepository virtualCardRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionAuditLogRepository transactionAuditLogRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final ReclamationHistoryRepository reclamationHistoryRepository;
    private final ReclamationAttachmentRepository reclamationAttachmentRepository;

    public LegacyApiCompatibilityController(
            InvestmentService investmentService,
            InvestmentOrderRepository investmentOrderRepository,
            WalletRepository walletRepository,
            WalletService walletService,
            VirtualCardRepository virtualCardRepository,
            TransactionRepository transactionRepository,
            TransactionAuditLogRepository transactionAuditLogRepository,
            KycDocumentRepository kycDocumentRepository,
            ReclamationHistoryRepository reclamationHistoryRepository,
            ReclamationAttachmentRepository reclamationAttachmentRepository
    ) {
        this.investmentService = investmentService;
        this.investmentOrderRepository = investmentOrderRepository;
        this.walletRepository = walletRepository;
        this.walletService = walletService;
        this.virtualCardRepository = virtualCardRepository;
        this.transactionRepository = transactionRepository;
        this.transactionAuditLogRepository = transactionAuditLogRepository;
        this.kycDocumentRepository = kycDocumentRepository;
        this.reclamationHistoryRepository = reclamationHistoryRepository;
        this.reclamationAttachmentRepository = reclamationAttachmentRepository;
    }

    @GetMapping("/api/investment-assets")
    public List<InvestmentAsset> getLegacyAssets() {
        return investmentService.getAllAssets();
    }

    @GetMapping("/api/investment-assets/{id}")
    public ResponseEntity<InvestmentAsset> getLegacyAsset(@PathVariable Long id) {
        return investmentService.getAssetById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/api/investment-orders")
    public List<InvestmentOrder> getLegacyOrders() {
        return investmentService.getAllOrders();
    }

    @GetMapping("/api/investment-orders/user/{userId}")
    public List<InvestmentOrder> getLegacyOrdersByUser(@PathVariable Long userId) {
        return investmentService.getOrdersByUserId(userId);
    }

    @PatchMapping("/api/investment-orders/{id}/cancel")
    public ResponseEntity<InvestmentOrder> cancelLegacyOrder(@PathVariable Long id) {
        return investmentOrderRepository.findById(id)
                .map(order -> {
                    order.setOrderStatus(OrderStatus.CANCELLED);
                    return ResponseEntity.ok(investmentOrderRepository.save(order));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/api/investment-strategies")
    public List<InvestmentStrategy> getLegacyStrategies() {
        return investmentService.getAllStrategies();
    }

    @GetMapping("/api/investment-strategies/{id}")
    public ResponseEntity<InvestmentStrategy> getLegacyStrategy(@PathVariable Long id) {
        return investmentService.getStrategyById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/api/portfolio-positions")
    public List<?> getLegacyPositions() {
        return investmentService.getAllPositionsWithProfit();
    }

    @GetMapping("/api/portfolio-positions/user/{userId}")
    public List<?> getLegacyPositionsByUser(@PathVariable Long userId) {
        return investmentService.getPositionsWithProfitByUserId(userId);
    }

    @GetMapping("/api/wallets")
    public List<Wallet> getLegacyWallets() {
        return walletRepository.findAll();
    }

    @GetMapping("/api/wallets/user/{userId}")
    public ResponseEntity<Wallet> getLegacyWalletByUser(@PathVariable Long userId) {
        return walletRepository.findByUser_Id(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/api/wallets/{id}/freeze")
    public ResponseEntity<Wallet> freezeLegacyWallet(@PathVariable Long id) {
        walletService.freezeWallet(id);
        return walletRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/api/wallets/{id}/unfreeze")
    public ResponseEntity<Wallet> unfreezeLegacyWallet(@PathVariable Long id) {
        walletService.unfreezeWallet(id);
        return walletRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/api/virtual-cards")
    public List<VirtualCard> getLegacyVirtualCards() {
        return virtualCardRepository.findAll();
    }

    @GetMapping("/api/virtual-cards/user/{userId}")
    public List<VirtualCard> getLegacyVirtualCardsByUser(@PathVariable Long userId) {
        return walletRepository.findByUser_Id(userId)
                .map(wallet -> virtualCardRepository.findByWallet_WalletId(wallet.getWalletId()))
                .orElseGet(List::of);
    }

    @PatchMapping("/api/virtual-cards/{id}/block")
    public ResponseEntity<VirtualCard> blockLegacyVirtualCard(@PathVariable Long id) {
        return updateVirtualCardStatus(id, "BLOCKED");
    }

    @PatchMapping("/api/virtual-cards/{id}/unblock")
    public ResponseEntity<VirtualCard> unblockLegacyVirtualCard(@PathVariable Long id) {
        return updateVirtualCardStatus(id, "ACTIVE");
    }

    @GetMapping("/api/transactions/wallet/{walletId}")
    public List<Transaction> getLegacyTransactionsByWallet(@PathVariable Long walletId) {
        List<Transaction> transactions = new java.util.ArrayList<>(transactionRepository.findBySourceWallet_WalletId(walletId));
        transactions.addAll(transactionRepository.findByDestinationWallet_WalletId(walletId));
        transactions.sort(Comparator.comparing(Transaction::getTransactionDate, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        return transactions;
    }

    @GetMapping("/api/transaction-audit-logs")
    public List<TransactionAuditLog> getLegacyTransactionAuditLogs() {
        return transactionAuditLogRepository.findAll();
    }

    @GetMapping("/api/transaction-audit-logs/transaction/{transactionId}")
    public List<TransactionAuditLog> getLegacyTransactionAuditLogsByTransaction(@PathVariable Long transactionId) {
        return transactionAuditLogRepository.findByTransaction_TransactionId(transactionId);
    }

    @GetMapping("/api/transaction-loans")
    public List<TransactionLoan> getLegacyTransactionLoans() {
        return transactionRepository.findAll().stream()
                .filter(TransactionLoan.class::isInstance)
                .map(TransactionLoan.class::cast)
                .toList();
    }

    @GetMapping("/api/transaction-loans/credit/{creditId}")
    public List<TransactionLoan> getLegacyTransactionLoansByCredit(@PathVariable Long creditId) {
        return getLegacyTransactionLoans().stream()
                .filter(transaction -> transaction.getEcheance() != null)
                .filter(transaction -> transaction.getEcheance().getCredit() != null)
                .filter(transaction -> creditId.equals(transaction.getEcheance().getCredit().getCreditId()))
                .toList();
    }

    @GetMapping("/api/kyc-documents")
    public List<KycDocument> getLegacyKycDocuments() {
        return kycDocumentRepository.findAll();
    }

    @GetMapping("/api/kyc-documents/user/{userId}")
    public List<KycDocument> getLegacyKycDocumentsByUser(@PathVariable Long userId) {
        return kycDocumentRepository.findByUser_Id(userId);
    }

    @PatchMapping("/api/kyc-documents/{id}/approve")
    public ResponseEntity<KycDocument> approveLegacyKycDocument(@PathVariable Long id) {
        return updateKycStatus(id, KycStatus.APPROVED);
    }

    @PatchMapping("/api/kyc-documents/{id}/reject")
    public ResponseEntity<KycDocument> rejectLegacyKycDocument(@PathVariable Long id) {
        return updateKycStatus(id, KycStatus.REJECTED);
    }

    @GetMapping("/api/reclamation-history")
    public List<ReclamationHistory> getLegacyReclamationHistory() {
        return reclamationHistoryRepository.findAll();
    }

    @GetMapping("/api/reclamation-history/reclamation/{reclamationId}")
    public List<ReclamationHistory> getLegacyReclamationHistoryByReclamation(@PathVariable Long reclamationId) {
        return reclamationHistoryRepository.findByReclamation_ReclamationIdOrderByChangedAtDesc(reclamationId);
    }

    @GetMapping("/api/reclamation-attachments")
    public List<ReclamationAttachment> getLegacyReclamationAttachments() {
        return reclamationAttachmentRepository.findAll();
    }

    @GetMapping("/api/reclamation-attachments/reclamation/{reclamationId}")
    public List<ReclamationAttachment> getLegacyReclamationAttachmentsByReclamation(@PathVariable Long reclamationId) {
        return reclamationAttachmentRepository.findByReclamation_ReclamationIdOrderByUploadedAtDesc(reclamationId);
    }

    @DeleteMapping("/api/reclamation-attachments/{id}")
    public ResponseEntity<Void> deleteLegacyReclamationAttachment(@PathVariable Long id) {
        if (!reclamationAttachmentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        reclamationAttachmentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<VirtualCard> updateVirtualCardStatus(Long id, String status) {
        return virtualCardRepository.findById(id)
                .map(card -> {
                    card.setStatus(status);
                    return ResponseEntity.ok(virtualCardRepository.save(card));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private ResponseEntity<KycDocument> updateKycStatus(Long id, KycStatus status) {
        return kycDocumentRepository.findById(id)
                .map(document -> {
                    document.setStatus(status);
                    return ResponseEntity.ok(kycDocumentRepository.save(document));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
