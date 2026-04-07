package com.kredia.service.ml;

import com.kredia.dto.ml.RiskFeaturesDto;

public interface RiskFeatureExtractorService {
    RiskFeaturesDto extract(Long userId, String subject, String description, String status, String priority);
}
