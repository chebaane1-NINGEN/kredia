package com.kredia.dto.reclamation;

import com.kredia.enums.ReclamationCategory;

public record ReclamationCategoryStatResponse(
        ReclamationCategory category,
        long count
) {}
