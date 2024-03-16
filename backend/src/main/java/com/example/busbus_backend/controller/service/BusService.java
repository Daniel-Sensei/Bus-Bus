package com.example.busbus_backend.controller.service;

import com.example.busbus_backend.persistence.BusRepository;
import com.example.busbus_backend.persistence.model.Bus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BusService {

    private final BusRepository busRepository;

    @Autowired
    public BusService(BusRepository busRepository) {
        this.busRepository = busRepository;
    }

    public List<Bus> getAllBuses() {
        return busRepository.getAllBuses();
    }

    public Bus getBusById(String id) {
        return busRepository.getBusById(id);
    }

    // Add more methods for CRUD operations as needed
}
