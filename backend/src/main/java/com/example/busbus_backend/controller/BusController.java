package com.example.busbus_backend.controller;

import com.example.busbus_backend.controller.service.BusService;
import com.example.busbus_backend.persistence.model.Bus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@CrossOrigin("*") // Consentire tutte le origini
@RequestMapping("/api/buses")
public class BusController {

    private final BusService busService;
    //private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public BusController(BusService busService
                         //SimpMessagingTemplate messagingTemplate
    ) {
        this.busService = busService;
        //this.messagingTemplate = messagingTemplate;
    }

    @GetMapping
    public List<Bus> getAllBuses() {
        System.out.println("GET allBuses");
        return busService.getAllBuses();
    }

    @GetMapping("/{id}")
    public Bus getBusById(@PathVariable String id) {
        return busService.getBusById(id);
    }

    // Add more mapping methods for other CRUD operations as needed

    // WebSocket endpoint per inviare aggiornamenti sui bus

    /*
    @MessageMapping("/updateBus")
    public void updateBus(Bus updatedBus) {
        // Qui puoi eseguire eventuali operazioni di validazione o elaborazione sui dati aggiornati
        messagingTemplate.convertAndSend("/topic/busUpdates", updatedBus);
    }

     */
}
