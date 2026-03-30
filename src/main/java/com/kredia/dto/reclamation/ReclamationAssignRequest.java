package com.kredia.dto.reclamation;

import jakarta.validation.constraints.NotNull;

public record ReclamationAssignRequest(
        @NotNull Long actorUserId,
        @NotNull Long agentUserId,
        String note
) {}
