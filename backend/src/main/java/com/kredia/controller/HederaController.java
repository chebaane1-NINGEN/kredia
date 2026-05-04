package com.kredia.controller;

import com.kredia.service.HederaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hedera")
public class HederaController {

    @Autowired
    private HederaService hederaService;

    @GetMapping("/create-topic")
    public String createTopic() {
        String topicId = hederaService.createNewTopic();
        if (topicId != null) {
            return "Successfully created new public topic: " + topicId + ". Use this ID in your application.properties!";
        } else {
            return "Failed to create topic. Check your console logs!";
        }
    }
}
