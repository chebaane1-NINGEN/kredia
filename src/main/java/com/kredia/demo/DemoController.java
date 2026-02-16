package com.kredia.demo;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DemoController {

    @GetMapping("/client/hello")
    public ResponseEntity<String> sayHelloClient() {
        return ResponseEntity.ok("Hello from Client endpoint");
    }

    @GetMapping("/admin/hello")
    public ResponseEntity<String> sayHelloAdmin() {
        return ResponseEntity.ok("Hello from Admin endpoint");
    }

    @GetMapping("/employee/hello")
    public ResponseEntity<String> sayHelloEmployee() {
        return ResponseEntity.ok("Hello from Employee endpoint");
    }
}
