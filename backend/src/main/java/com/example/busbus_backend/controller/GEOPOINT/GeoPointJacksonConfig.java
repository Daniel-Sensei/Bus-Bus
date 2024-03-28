package com.example.busbus_backend.controller.GEOPOINT;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.google.cloud.firestore.GeoPoint;

@Configuration
public class GeoPointJacksonConfig {

    @Bean
    public Module customSerializerModule() {
        SimpleModule module = new SimpleModule();
        module.addSerializer(GeoPoint.class, new GeoPointSerializer());
        module.addDeserializer(GeoPoint.class, new GeoPointDeserializer());
        return module;
    }
}