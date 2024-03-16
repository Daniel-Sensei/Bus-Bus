package com.example.busbus_backend.controller;

import com.example.busbus_backend.persistence.model.Bus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutionException;

@Controller
public class BusWebSocketController extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("Nuova connessione: " + session.getId());

        // Aggiungi la sessione WebSocket alla lista delle sessioni
        sessions.add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // Ricevi il messaggio dal client WebSocket
        String payload = message.getPayload();

        System.out.println("Messaggio ricevuto: " + payload);

        // Analizza il payload JSON per estrarre le coordinate
        ObjectMapper mapper = new ObjectMapper();
        JsonNode jsonNode = mapper.readTree(payload);

        // Verifica se il messaggio contiene le coordinate
        if (jsonNode.has("latitude") && jsonNode.has("longitude")) {
            double latitude = jsonNode.get("latitude").asDouble();
            double longitude = jsonNode.get("longitude").asDouble();

            // Ora puoi eseguire getAllBuses con le coordinate ricevute
            List<Bus> initialBusList = getAllBuses(latitude, longitude);
            //List<Bus> initialBusList = getAllBuses(latitude, longitude);

            // Invia l'elenco iniziale di bus al client appena connesso
            try {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(initialBusList)));
            } catch (IOException e) {
                e.printStackTrace();
                // Gestisci eccezione come necessario
            }
        } else {
            // Il messaggio non contiene le coordinate necessarie
            // Gestisci l'errore come appropriato
        }
    }

    // Modifica questo metodo per inviare aggiornamenti dei bus a tutti i client WebSocket
    public void sendUpdatedBusList(List<Bus> updatedBusList) throws IOException {
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(updatedBusList)));
            }
        }
    }

    private final String COLLECTION_NAME = "buses"; // Nome della collezione in Firestore

    public List<Bus> getAllBuses(double latitude, double longitude) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference buses = db.collection(COLLECTION_NAME);

        // Calcola la distanza geografica in gradi corrispondente a 5 km
        double distanceInDegrees = 5 / 111.12; // 1 grado di latitudine è approssimativamente 111.12 km //stima approssimativa per eccesso

        // Calcola i limiti della latitudine e della longitudine per la query
        double minLatitude = latitude - distanceInDegrees;
        double maxLatitude = latitude + distanceInDegrees;
        double minLongitude = longitude - distanceInDegrees;
        double maxLongitude = longitude + distanceInDegrees;

        // Esegui la query per i bus entro il raggio specificato
        Query query = buses.whereGreaterThanOrEqualTo("coords", new GeoPoint(minLatitude, minLongitude))
                .whereLessThanOrEqualTo("coords", new GeoPoint(maxLatitude, maxLongitude));

        // Ottieni l'elenco di bus che soddisfano i criteri di query
        List<Bus> busList = new ArrayList<>();
        /*
        try {
            ApiFuture<QuerySnapshot> querySnapshot = query.get();
            for (QueryDocumentSnapshot document : querySnapshot.get().getDocuments()) {
                Bus bus = document.toObject(Bus.class);
                bus.setId(document.getId());
                busList.add(bus);
            }
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            // Gestisci eccezione come necessario
        }
         */

        buses.addSnapshotListener((snapshots, error) -> {
            if (error != null) {
                System.err.println("Errore durante il recupero degli aggiornamenti: " + error);
                return;
            }

            busList.clear();
            try {
                ApiFuture<QuerySnapshot> querySnapshot = query.get();
                for (QueryDocumentSnapshot document : querySnapshot.get().getDocuments()) {
                    Bus bus = document.toObject(Bus.class);
                    bus.setId(document.getId());
                    busList.add(bus);
                }
                System.out.println("Numero pullman 5KM= " + busList.size());
            } catch (InterruptedException | ExecutionException e) {
                e.printStackTrace();
                // Gestisci eccezione come necessario
            }

            System.out.println("Rilevata una modifica nel database");
            try {
                sendUpdatedBusList(busList);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });

        return busList;
    }
}
