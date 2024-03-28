package com.example.busbus_backend.controller.GEOPOINT;

import java.io.IOException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.google.cloud.firestore.GeoPoint;

public class GeoPointDeserializer extends JsonDeserializer<GeoPoint> {

    @Override
    public GeoPoint deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        p.nextToken(); // Skip START_OBJECT
        p.nextToken(); // Field name "latitude"
        double latitude = p.getDoubleValue();
        p.nextToken(); // Field name "longitude"
        p.nextToken(); // Longitude value
        double longitude = p.getDoubleValue();
        p.nextToken(); // Skip END_OBJECT
        return new GeoPoint(latitude, longitude);
    }
}