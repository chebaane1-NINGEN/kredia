package com.kredia.kyc.dto;

import com.kredia.enums.KycDocumentType;
import com.kredia.enums.KycStatus;
import com.kredia.enums.KycStatus;

import java.time.LocalDateTime;

public class KycDocumentDTO {
    private Long kycId;
    private Long userId;
    private KycDocumentType documentType;
    private String filePath;
    private KycStatus status;
    private LocalDateTime uploadedAt;
    private LocalDateTime verifiedAt;
    private Long verifiedBy;

    public KycDocumentDTO() {}

    public Long getKycId() { return kycId; }
    public void setKycId(Long v) { this.kycId = v; }
    public Long getUserId() { return userId; }
    public void setUserId(Long v) { this.userId = v; }
    public KycDocumentType getDocumentType() { return documentType; }
    public void setDocumentType(KycDocumentType v) { this.documentType = v; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String v) { this.filePath = v; }
    public KycStatus getStatus() { return status; }
    public void setStatus(KycStatus v) { this.status = v; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime v) { this.uploadedAt = v; }
    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime v) { this.verifiedAt = v; }
    public Long getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(Long v) { this.verifiedBy = v; }

    public static KycDocumentDTOBuilder builder() { return new KycDocumentDTOBuilder(); }

    public static class KycDocumentDTOBuilder {
        private KycDocumentDTO dto = new KycDocumentDTO();
        public KycDocumentDTOBuilder kycId(Long v) { dto.setKycId(v); return this; }
        public KycDocumentDTOBuilder userId(Long v) { dto.setUserId(v); return this; }
        public KycDocumentDTOBuilder documentType(KycDocumentType v) { dto.setDocumentType(v); return this; }
        public KycDocumentDTOBuilder filePath(String v) { dto.setFilePath(v); return this; }
        public KycDocumentDTOBuilder status(KycStatus v) { dto.setStatus(v); return this; }
        public KycDocumentDTOBuilder uploadedAt(LocalDateTime v) { dto.setUploadedAt(v); return this; }
        public KycDocumentDTOBuilder verifiedAt(LocalDateTime v) { dto.setVerifiedAt(v); return this; }
        public KycDocumentDTOBuilder verifiedBy(Long v) { dto.setVerifiedBy(v); return this; }
        public KycDocumentDTO build() { return dto; }
    }
}
