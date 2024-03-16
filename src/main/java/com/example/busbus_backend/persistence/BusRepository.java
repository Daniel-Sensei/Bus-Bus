package com.example.busbus_backend.persistence;

import com.example.busbus_backend.persistence.model.Bus;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.function.Consumer;

@Repository
public class BusRepository {

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

        return busList;
    }

    public void addSnapshotListener(Consumer<List<Bus>> listener) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference buses = db.collection(COLLECTION_NAME);

        // Aggiungi un listener di snapshot per rilevare eventuali modifiche nel database
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
            listener.accept(updatedBusList);
        });
    }

    public Bus getBusById(String id) {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(COLLECTION_NAME).document(id);
        ApiFuture<DocumentSnapshot> query = docRef.get();

        try {
            DocumentSnapshot document = query.get();
            if (document.exists()) {
                return document.toObject(Bus.class);
            } else {
                // Handle case where bus with given id doesn't exist
                return null;
            }
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            // Handle exceptions as needed
            return null;
        }
    }

    // Aggiungi altri metodi per le operazioni CRUD se necessario
}
