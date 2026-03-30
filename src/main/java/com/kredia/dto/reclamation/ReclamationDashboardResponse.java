package com.kredia.dto.reclamation;

import java.util.List;

public record ReclamationDashboardResponse(
        long totalReclamations,
        long openReclamations,
        long inProgressReclamations,
        long waitingCustomerReclamations,
        long escalatedReclamations,
        long resolvedReclamations,
        long rejectedReclamations,
        long overdueFirstResponses,
        long overdueResolutions,
        double averageResolutionHours,
        double averageCustomerSatisfaction,
        double resolutionRate,
        List<ReclamationCategoryStatResponse> categoryBreakdown
) {}
