package com.kredia.dto;

import com.kredia.enums.WalletStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class WalletResponseDTO {
    private Long walletId;
    private BigDecimal balance;
    private BigDecimal frozenBalance;
    private WalletStatus status;
    private LocalDateTime createdAt;

    public WalletResponseDTO() {}

    public Long getWalletId() { return walletId; }
    public void setWalletId(Long walletId) { this.walletId = walletId; }
    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
    public BigDecimal getFrozenBalance() { return frozenBalance; }
    public void setFrozenBalance(BigDecimal frozenBalance) { this.frozenBalance = frozenBalance; }
    public WalletStatus getStatus() { return status; }
    public void setStatus(WalletStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static WalletResponseDTOBuilder builder() {
        return new WalletResponseDTOBuilder();
    }

    public static class WalletResponseDTOBuilder {
        private WalletResponseDTO dto = new WalletResponseDTO();
        public WalletResponseDTOBuilder walletId(Long id) { dto.setWalletId(id); return this; }
        public WalletResponseDTOBuilder balance(BigDecimal b) { dto.setBalance(b); return this; }
        public WalletResponseDTOBuilder frozenBalance(BigDecimal fb) { dto.setFrozenBalance(fb); return this; }
        public WalletResponseDTOBuilder status(WalletStatus s) { dto.setStatus(s); return this; }
        public WalletResponseDTOBuilder createdAt(LocalDateTime c) { dto.setCreatedAt(c); return this; }
        public WalletResponseDTO build() { return dto; }
    }
}
