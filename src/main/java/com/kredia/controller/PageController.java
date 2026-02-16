package com.kredia.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping("/")
    public String home() {
        return "forward:/index.html";
    }

    @GetMapping("/auth/login")
    public String login() {
        return "forward:/login.html";
    }

    @GetMapping("/auth/register")
    public String register() {
        return "forward:/register.html";
    }

    @GetMapping("/dashboard/client")
    public String clientDashboard() {
        return "forward:/dashboard/client.html";
    }

    @GetMapping("/dashboard/admin")
    public String adminDashboard() {
        return "forward:/dashboard/admin.html";
    }

    @GetMapping("/dashboard/employee")
    public String employeeDashboard() {
        return "forward:/dashboard/employee.html";
    }
}
