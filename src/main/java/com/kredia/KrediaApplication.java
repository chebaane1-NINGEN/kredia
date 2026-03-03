package com.kredia;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class KrediaApplication {

    public static void main(String[] args) {
        SpringApplication.run(KrediaApplication.class, args);
    }

}
