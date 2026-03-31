package com.kredia.controller;

import com.kredia.controller.user.UserController;
import com.kredia.exception.GlobalExceptionHandler;
import com.kredia.service.user.UserService;
import com.kredia.service.user.KycDocumentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.kredia.entity.user.User;

@WebMvcTest(controllers = UserController.class)
@Import(GlobalExceptionHandler.class)
class UserControllerOptimisticLockTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private KycDocumentService kycDocumentService;

    @Test
    void updateProfile_shouldReturn409_whenOptimisticLockOccurs() throws Exception {
        when(userService.updateProfile(anyLong(), anyLong(), any()))
                .thenThrow(new ObjectOptimisticLockingFailureException(User.class, 1L));

        String requestJson = """
            {
                "email": "optimistic@example.com",
                "firstName": "John",
                "lastName": "Doe",
                "phoneNumber": "1234567890"
            }
        """;

        mockMvc.perform(
                        put("/api/user/1/profile")
                                .header("X-Actor-Id", 1L)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Concurrency Error"));
    }
}
