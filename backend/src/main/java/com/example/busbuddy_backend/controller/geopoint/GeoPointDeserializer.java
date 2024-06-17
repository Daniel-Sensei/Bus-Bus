package com.example.busbuddy_backend.controller.geopoint;

import java.io.IOException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.google.cloud.firestore.GeoPoint;

public class GeoPointDeserializer extends JsonDeserializer<GeoPoint> {

    /**
     * Deserializes a GeoPoint from a JSON string.
     * 
     * @param  p   The JsonParser used to parse the JSON string.
     * @param  ctxt   The DeserializationContext used for deserialization.
     * @return      The deserialized GeoPoint.
     * @throws IOException   If an I/O error occurs while parsing the JSON string.
     */
    @Override
    public GeoPoint deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        // Skip START_OBJECT
        p.nextToken();
        // Skip Field name "latitude"
        p.nextToken();
        // Get latitude value
        double latitude = p.getDoubleValue();
        // Skip Field name "longitude"
        p.nextToken();
        // Skip longitude value
        p.nextToken();
        // Get longitude value
        double longitude = p.getDoubleValue();
        // Skip END_OBJECT
        p.nextToken();
        // Return the deserialized GeoPoint
        return new GeoPoint(latitude, longitude);
    }
}