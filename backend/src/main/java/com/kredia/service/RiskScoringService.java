package com.kredia.service;

import com.kredia.dto.reclamation.RiskFeatures;

public interface RiskScoringService {
    double score(RiskFeatures features); // returns 0..100
}
