package com.example.busbus_backend.controller;

import com.example.busbus_backend.persistence.BusRepository;
import com.example.busbus_backend.persistence.model.Bus;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.beans.factory.annotation.Autowired;
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
public class BusesWebSocketController extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    /*
    @Autowired
    private BusRepository busRepository;

     */

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("Nuova connessione: " + session.getId());

        // Ottieni l'elenco iniziale di bus
        List<Bus> initialBusList = getAllBuses();

        // Invia l'elenco iniziale di bus al client appena connesso
        try {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(initialBusList)));
        } catch (IOException e) {
            e.printStackTrace();
            // Gestisci eccezione come necessario
        }

        // Aggiungi la sessione WebSocket alla lista delle sessioni
        sessions.add(session);
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

    public List<Bus> getAllBuses() {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference buses = db.collection(COLLECTION_NAME);

        // Ottieni l'elenco iniziale di bus
        List<Bus> busList = new ArrayList<>();
        try {
            QuerySnapshot initialSnapshot = buses.get().get();
            for (DocumentSnapshot document : initialSnapshot.getDocuments()) {
                Bus bus = document.toObject(Bus.class);
                bus.setId(document.getId()); // Imposta manualmente l'ID del bus
                busList.add(bus);
            }
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            // Gestisci eccezione come necessario
        }

        buses.addSnapshotListener((snapshots, error) -> {
            if (error != null) {
                System.err.println("Errore durante il recupero degli aggiornamenti: " + error);
                return;
            }

            List<Bus> updatedBusList = new ArrayList<>();
            for (DocumentChange change : snapshots.getDocumentChanges()) {
                DocumentSnapshot document = change.getDocument();
                String busId = document.getId();
                switch (change.getType()) {
                    case ADDED:
                        // Aggiungi un nuovo bus all'elenco
                        Bus newBus = document.toObject(Bus.class);
                        newBus.setId(busId);
                        updatedBusList.add(newBus);
                        break;
                    case MODIFIED:
                        // Aggiorna i dettagli del bus nell'elenco
                        Bus updatedBus = document.toObject(Bus.class);
                        updatedBus.setId(busId);
                        updatedBusList.add(updatedBus);
                        break;
                    case REMOVED:
                        // Rimuovi il bus dall'elenco
                        updatedBusList.removeIf(bus -> bus.getId().equals(busId)); 
                        break;
                    default:
                        break;
                }
            }

            System.out.println("Rilevata una modifica nel database");
            try {
                sendUpdatedBusList(updatedBusList);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });

        return busList;
    }
}
