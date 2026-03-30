package com.kredia.service;

import com.kredia.dto.reclamation.RiskFeatures;

public interface RiskFeatureExtractor {
    RiskFeatures extractForNewComplaint(Long userId, String description);
}
