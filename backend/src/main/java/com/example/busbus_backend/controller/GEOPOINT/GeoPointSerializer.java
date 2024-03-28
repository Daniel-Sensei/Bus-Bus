package com.example.busbus_backend.controller.GEOPOINT;

import java.io.IOException;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.google.cloud.firestore.GeoPoint;

public class GeoPointSerializer extends JsonSerializer<GeoPoint> {

    @Override
    public void serialize(GeoPoint value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        gen.writeStartObject();
        gen.writeFieldName("latitude");
        gen.writeNumber(value.getLatitude());
        gen.writeFieldName("longitude");
        gen.writeNumber(value.getLongitude());
        gen.writeEndObject();
    }
}
