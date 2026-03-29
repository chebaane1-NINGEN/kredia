package com.kredia.controller;

import com.kredia.controller.user.UserController;
import com.kredia.exception.GlobalExceptionHandler;
import com.kredia.service.user.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserController.class)
@Import(GlobalExceptionHandler.class)
class UserControllerOptimisticLockTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    void update_shouldReturn409_whenOptimisticLockOccurs() throws Exception {
        when(userService.update(org.mockito.ArgumentMatchers.eq(1L), org.mockito.ArgumentMatchers.any()))
                .thenThrow(new ObjectOptimisticLockingFailureException("User", 1L));

        mockMvc.perform(
                        put("/api/user/1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"email\":\"a@kredia.com\",\"firstName\":\"A\",\"lastName\":\"B\",\"phoneNumber\":\"060\"}")
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Concurrency Error"));
    }
}
