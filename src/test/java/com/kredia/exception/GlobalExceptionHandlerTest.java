package com.kredia.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    @Test
    void optimisticLock_shouldReturn409() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getRequestURI()).thenReturn("/api/users/1");

        ObjectOptimisticLockingFailureException ex = new ObjectOptimisticLockingFailureException("User", 1L);
        ResponseEntity<ApiErrorResponse> res = handler.handleOptimisticLock(ex, req);

        assertEquals(409, res.getStatusCode().value());
        assertNotNull(res.getBody());
        assertEquals("Concurrency Error", res.getBody().getError());
        assertEquals("/api/users/1", res.getBody().getPath());
    }
}
