package com.smartsupply;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the Spring Boot application.
 * 
 * @SpringBootApplication combines:
 * - @Configuration: This class can define beans
 * - @EnableAutoConfiguration: Auto-configure based on dependencies
 * - @ComponentScan: Scan for @Component, @Service, @Controller, etc.
 * 
 * This is similar to NestJS's main.ts + AppModule combined.
 */
@SpringBootApplication
public class SmartSupplyApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartSupplyApplication.class, args);
    }
}
