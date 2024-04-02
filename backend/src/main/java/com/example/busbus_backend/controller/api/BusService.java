package com.example.busbus_backend.controller.api;

import com.example.busbus_backend.persistence.model.*;
import com.google.cloud.firestore.*;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import org.springframework.web.bind.annotation.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.UserRecord.CreateRequest;




import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ExecutionException;

@RestController
@CrossOrigin("*")
public class BusService {
    private final String BUSES_COLLECTION = "buses"; // Nome della collezione in Firestore
    private final String ROUTES_COLLECTION = "routes";
    private final String COMPANIES_COLLECTION = "companies";

    @GetMapping("/bus")
    public ResponseEntity<Bus> getBus(@RequestParam String id) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference buses = db.collection(BUSES_COLLECTION);

        try {
            DocumentSnapshot document = getDocumentById(buses, id);
            if (document.exists()) {
                DocumentReference routeRef = (DocumentReference) document.get("route");
                //get document of route
                DocumentSnapshot routeDocument = routeRef.get().get();
                Route route = routeDocument.toObject(Route.class);
                ForwardBackStops stops = route.buildStopOutboundReturn(routeDocument);
                route.setStops(stops);

                //set bus field individually
                Bus bus = new Bus();
                bus.setId(document.getId());
                bus.setCode(document.getString("code"));
                bus.setRoute(route);

                return new ResponseEntity<>(bus, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

        @PostMapping("/signupCompany")
    public ResponseEntity<String> signupCompany(@RequestBody BusSignupRequest requestBody) {
        String email = requestBody.getEmail();
        String password = requestBody.getPassword();
        String company = requestBody.getCompany();

        if(company == null || company.isEmpty() || email == null || email.isEmpty() || password == null || password.isEmpty()){
            return new ResponseEntity<>("I campi email, password e company sono obbligatori", HttpStatus.BAD_REQUEST);
        }

        CreateRequest request = new CreateRequest()
                .setEmail(email)
                .setPassword(password)
                .setDisabled(false);

        UserRecord companyRecord;
        try {
            companyRecord = FirebaseAuth.getInstance().createUser(request);
            // Salva ulteriori dettagli dell'azienda del bus nel tuo database qui, se necessario.
            // Le companies sono salvate nella collezione "companies" in Firestore
            Firestore db = FirestoreClient.getFirestore();
            CollectionReference companies = db.collection(COMPANIES_COLLECTION);
            Map<String, Object> data = new HashMap<>();
            data.put("name", company);
            data.put("email", email);
            db.collection(COMPANIES_COLLECTION).document(companyRecord.getUid()).set(data);
        } catch (Exception e) {
            return new ResponseEntity<>("Errore durante la registrazione dell'azienda: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }

        return new ResponseEntity<>("Azienda registrata con successo con ID: " + companyRecord.getUid(), HttpStatus.OK);

    }

    @PostMapping("/verifyTokenIntegrity")
    public ResponseEntity<Boolean> verifyTokenIntegrity(@RequestBody Map<String, String> bodyRequest) {
        String token = bodyRequest.get("token");
        try {
            System.out.println("token: " + token);
            FirebaseAuth.getInstance().verifyIdToken(token);
            return new ResponseEntity<>(true, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(false, HttpStatus.UNAUTHORIZED);
        }
    }

    @PostMapping("/busByCode")
    public ResponseEntity<Bus> getBusByCode (@RequestBody Map<String, String> bodyRequest){
        // check if bodyRequest.token is a valid Firebase token
        String token = bodyRequest.get("token");
        String code = bodyRequest.get("code");
        System.out.println("code: " + code);
        System.out.println("token: " + token);
        try {
            FirebaseAuth.getInstance().verifyIdToken(token);

            Firestore db = FirestoreClient.getFirestore();
            CollectionReference buses = db.collection(BUSES_COLLECTION);
            Query query = buses.whereEqualTo("code", code);
            QuerySnapshot querySnapshot = query.get().get();
            if (querySnapshot.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
            DocumentSnapshot document = querySnapshot.getDocuments().get(0);
            DocumentReference routeRef = (DocumentReference) document.get("route");
            //get document of route
            DocumentSnapshot routeDocument = routeRef.get().get();
            Route route = routeDocument.toObject(Route.class);
            ForwardBackStops stops = route.buildStopOutboundReturn(routeDocument);
            route.setStops(stops);
            route.setTimetable(null);
            route.setHistory(null);

            //set bus field individually
            Bus bus = new Bus();
            bus.setId(document.getId());
            bus.setRoute(route);
            bus.setCode(code);
            GeoPoint coords = new GeoPoint(0, 0);
            bus.setCoords(coords);
            return new ResponseEntity<>(bus, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
    }

    @GetMapping("/stopsByBus")
    public ResponseEntity<ForwardBackStops> getStopsByBus(@RequestParam String busId) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference buses = db.collection(BUSES_COLLECTION);

        try {
            DocumentSnapshot document = getDocumentById(buses, busId);
            if (document.exists()) {
                DocumentReference routeRef = (DocumentReference) document.get("route");
                //get document of route
                DocumentSnapshot routeDocument = routeRef.get().get();
                Route route = routeDocument.toObject(Route.class);
                ForwardBackStops stops = route.buildStopOutboundReturn(routeDocument);
                //route.setStops(stops);

                return new ResponseEntity<>(stops, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    @PostMapping("/stopReached")
    public ResponseEntity<Boolean> updateStopReached(@RequestParam String routeId, @RequestParam String stopIndex, @RequestParam String direction) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            DocumentReference routeRef = routes.document(routeId);
            DocumentSnapshot routeSnapshot = routeRef.get().get();
            if (routeSnapshot.exists()) {
                // Ottenere l'orario attuale (hh:mm)
                String currentTime = getCurrentTime();

                // Ottenere il campo "history" dal documento del percorso
                Map<String, Schedule> history = routeSnapshot.toObject(Route.class).getHistory();

                // Verificare se l'oggetto history esiste
                if (history != null) {
                    // Ottenere l'oggetto Data per la data odierna
                    String today = getCurrentDate();
                    Schedule todayData = history.get(today);

                    // Verificare se l'oggetto Data per la data odierna esiste
                    if (todayData != null) {
                        // Ottenere l'oggetto Timetable per la direzione specificata (forward o back)
                        Map<String, List<String>> timetable = direction.equals("forward") ? todayData.getForward() : todayData.getBack();

                        // Verificare se il campo timetable per la direzione specificata esiste
                        if (timetable != null) {
                            // Aggiornare il valore per lo stopIndex specificato nell'oggetto Timetable con l'orario attuale
                            List<String> stopTimes = timetable.get(stopIndex);
                            if (stopTimes != null) {
                                for(int i = 0; i < stopTimes.size(); i++){
                                    System.out.println("stopTimes.get(i): " + stopTimes.get(i));
                                    if(stopTimes.get(i) != null && stopTimes.get(i).equals("-")){
                                        System.out.println("stopTimes.get(i) == '-'");
                                        stopTimes.set(i, currentTime);
                                        break;
                                    }
                                }
                            } else {
                                stopTimes = new ArrayList<>();
                                stopTimes.add(currentTime);
                                timetable.put(stopIndex, stopTimes);
                            }

                            // Aggiornare il campo "history" nel documento del percorso
                            db.runTransaction(transaction -> {
                                DocumentSnapshot routeSnapshotAgain = transaction.get(routeRef).get();
                                Route route = routeSnapshotAgain.toObject(Route.class);
                                if (route != null) {
                                    route.getHistory().put(today, todayData);
                                    transaction.update(routeRef, "history", route.getHistory());
                                }
                                return true;
                            });

                            return new ResponseEntity<>(true, HttpStatus.OK);
                        }
                    }
                    else{
                        // Inizializza l'oggetto "history" per la data odierna
                        ResponseEntity<Boolean> initializationResult = initializeTodayHistory(routeId);

                        // Controlla se l'inizializzazione ha avuto successo
                        if (Boolean.TRUE.equals(initializationResult.getBody())) {
                            // L'inizializzazione è avvenuta con successo, ora esegui l'aggiornamento dello stopReached
                            ResponseEntity<Boolean> updateResult = updateStopReached(routeId, stopIndex, direction);

                            // Controlla se l'aggiornamento ha avuto successo
                            if (Boolean.TRUE.equals(updateResult.getBody())) {
                                // L'aggiornamento è avvenuto con successo
                                return new ResponseEntity<>(true, HttpStatus.OK);
                            } else {
                                // Gestisci eventuali errori nell'aggiornamento dello stopReached
                                return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
                            }
                        } else {
                            // Gestisci eventuali errori nell'inizializzazione della history
                            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
                        }
                    }
                }
            }
            return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    private ResponseEntity<Boolean> initializeTodayHistory(String routeId) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            DocumentReference routeRef = routes.document(routeId);
            DocumentSnapshot routeSnapshot = routeRef.get().get();
            if (routeSnapshot.exists()) {
                // Ottenere il campo "history" dal documento del percorso
                Map<String, Schedule> history = routeSnapshot.toObject(Route.class).getHistory();

                // Verificare se l'oggetto history esiste
                if (history != null) {
                    // Creare un nuovo oggetto "history" con un oggetto "Data" vuoto per la data odierna
                    Map<String, Schedule> newHistory = new HashMap<>();
                    newHistory.put(getCurrentDate(), new Schedule());
                    System.out.println("newHistory: " + newHistory);

                    // prendi il campo timetable dal documento del percorso
                    Schedule timetable = routeSnapshot.toObject(Route.class).getTimetable();
                    System.out.println("timetable: " + timetable);

                    // per ogni mappa di timetable, crea una mappa con il segnaposto "-" per ogni valore non null dell'array
                    // crea solo week o solo sunday a seconda del giorno della settimana

                    // Utilizzo del metodo per sostituire i valori non nulli con il segnaposto per entrambe le direzioni (forward e back)
                    Map<String, List<String>> forwardDay = timetable.getForward();
                    replaceNonNullValuesWithPlaceholder(forwardDay);
                    System.out.println("Forward day: " + forwardDay);

                    Map<String, List<String>> backDay = timetable.getBack();
                    replaceNonNullValuesWithPlaceholder(backDay);
                    System.out.println("Back day: " + backDay);

                    // Aggiungi a newHistory l'oggetto Data con le mappe appena create
                    newHistory.get(getCurrentDate()).setBack(backDay);
                    newHistory.get(getCurrentDate()).setForward(forwardDay);
                    System.out.println("newHistory: " + newHistory);





                    // Aggiornare il campo "history" nel documento del percorso
                    // Se ci sono piu di 7 giorni di history, rimuovere la data piu vecchia
                    db.runTransaction(transaction -> {
                        DocumentSnapshot routeSnapshotAgain = transaction.get(routeRef).get();
                        Route route = routeSnapshotAgain.toObject(Route.class);
                        if (route != null) {
                            route.getHistory().putAll(newHistory);

                            if(route.getHistory().size() > 7){
                                // Ordina le chiavi delle date in ordine ascendente
                                List<String> dates = new ArrayList<>(route.getHistory().keySet());
                                Collections.sort(dates, new Comparator<String>() {
                                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

                                    @Override
                                    public int compare(String date1, String date2) {
                                        LocalDate localDate1 = LocalDate.parse(date1, formatter);
                                        LocalDate localDate2 = LocalDate.parse(date2, formatter);
                                        return localDate1.compareTo(localDate2);
                                    }
                                });
                                route.getHistory().remove(dates.get(0));
                            }

                            transaction.update(routeRef, "history", route.getHistory());
                        }
                        return true;
                    });


                    return new ResponseEntity<>(true, HttpStatus.OK);
                }
            }
            return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    private void replaceNonNullValuesWithPlaceholder(Map<String, List<String>> day) {
        for (Map.Entry<String, List<String>> entry : day.entrySet()) {
            List<String> times = new ArrayList<>();
            for (String time : entry.getValue()) {
                if (time != null)
                    times.add("-");
                else
                    times.add(null);
            }
            day.put(entry.getKey(), times);
        }
    }

    //viene richiamata solo quaqndo c'è cambio di direzione tra froward e back
    @PostMapping("/fixHistoryGaps")
    public ResponseEntity<Boolean> fixHistoryGaps(@RequestParam String routeId, @RequestParam String direction) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            DocumentReference routeRef = routes.document(routeId);
            DocumentSnapshot routeSnapshot = routeRef.get().get();
            if (routeSnapshot.exists()) {
                // Ottenere il campo "history" dal documento del percorso
                Map<String, Schedule> history = routeSnapshot.toObject(Route.class).getHistory();

                // Verificare se l'oggetto history esiste
                if (history != null) {
                    // Ottenere l'oggetto Data per la data odierna
                    String today = getCurrentDate();
                    Schedule todayData = history.get(today);

                    // Verificare se l'oggetto Data per la data odierna esiste
                    if (todayData != null) {
                        // Ottenere l'oggetto Timetable per la direzione specificata (forward o back)
                        Map<String, List<String>> timetable = direction.equals("forward") ? todayData.getForward() : todayData.getBack();

                        // Verificare se il campo timetable per la direzione specificata esiste
                        if (timetable != null) {
                            // Per ogni stop, controlla se ci sono buchi nella history e riempi con il valore precedente

                            Map<String,List<String>> day = timetable;
                            //scorro come una matrice in verticale
                            int numCols = day.get("0").size();
                            boolean fixed = false; //faccio solo una colonna alla volta
                            for(int i = 0; i < numCols && !fixed; i++){
                                int cont = 0;
                                for(int j = 0; j < day.size(); j++){
                                    if(day.get(String.valueOf(j)).get(i) != null && day.get(String.valueOf(j)).get(i).equals("-")){
                                        cont++;
                                    }
                                }
                                if(cont > 0 && cont < day.size()){
                                    System.out.println("Devo fixare");
                                    for(int j = 0; j < day.size(); j++){
                                        if(day.get(String.valueOf(j)).get(i) != null &&  day.get(String.valueOf(j)).get(i).equals("-")){
                                            day.get(String.valueOf(j)).set(i, null);
                                        }
                                    }
                                    fixed = true;
                                }

                            }

                            // Aggiornare il campo "history" nel documento del percorso

                            db.runTransaction(transaction -> {
                                DocumentSnapshot routeSnapshotAgain = transaction.get(routeRef).get();
                                Route route = routeSnapshotAgain.toObject(Route.class);
                                if (route != null) {
                                    route.getHistory().put(today, todayData);
                                    transaction.update(routeRef, "history", route.getHistory());
                                }
                                return true;
                            });

                            return new ResponseEntity<>(true, HttpStatus.OK);
                        }
                    }
                }
            }
            return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    @PostMapping("/addBus")
    public ResponseEntity<Boolean> addBus(@RequestParam String busCode, @RequestParam String routeId){
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference buses = db.collection(BUSES_COLLECTION);
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            DocumentReference routeRef = routes.document(routeId);
            DocumentSnapshot routeSnapshot = routeRef.get().get();
            if (routeSnapshot.exists()) {
                // Creare un nuovo bus con il codice specificato e il riferimento al percorso
                Map<String, Object> data = new HashMap<>();
                data.put("code", busCode);
                data.put("route", routeRef);

                //get company from routeSnapshot
                String company = routeSnapshot.getString("company");
                data.put("company", company);


                // Aggiungere il bus alla collezione "buses" in Firestore
                DocumentReference newBusRef = buses.add(data).get();

                // Ottieni l'ID del nuovo bus generato da Firestore
                String busId = newBusRef.getId();

                // Aggiungi il bus al Realtime Database
                DatabaseReference database = FirebaseDatabase.getInstance().getReference();
                System.out.println("database: " + database);
                DatabaseReference busesRef = database.child("buses").child(busId);
                System.out.println("busesRef: " + busesRef);

                //sostituisci route di data con routeId del parametro
                Map<String,Double> coords = new HashMap<>();
                coords.put("latitude", 0.0);
                coords.put("longitude", 0.0);
                data.put("coords", coords);
                data.put("routeId", routeId);
                data.put("direction", "");
                data.put("lastStop", 0);
                data.put("speed", 0);

                data.remove("code");
                data.remove("route");

                System.out.println("data: " + data);
                busesRef.setValue(data, new DatabaseReference.CompletionListener() {
                    @Override
                    public void onComplete(DatabaseError databaseError, DatabaseReference databaseReference) {
                        if (databaseError != null) {
                            // Gestione degli errori
                            System.out.println("Data could not be saved: " + databaseError.getMessage());
                        } else {
                            System.out.println("Bus added to Realtime Database successfully!");
                        }
                    }
                });

                return new ResponseEntity<>(true, HttpStatus.OK);
            }
            return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
        } catch (InterruptedException | ExecutionException e) {
            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/routesByBusCode")
    public ResponseEntity<List<Route>> getRoutesByBusCode(@RequestParam String busCode) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference buses = db.collection(BUSES_COLLECTION);
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            Query query = buses.whereEqualTo("code", busCode);
            QuerySnapshot querySnapshot = query.get().get();
            if (querySnapshot.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
            DocumentSnapshot busDocument = querySnapshot.getDocuments().get(0);
            String company = busDocument.getString("company");

            //get all routes of the company
            Query queryRoutes = routes.whereEqualTo("company", company);
            QuerySnapshot querySnapshotRoutes = queryRoutes.get().get();
            List<Route> routesList = new ArrayList<>();
            for (DocumentSnapshot document : querySnapshotRoutes.getDocuments()) {
                Route route = document.toObject(Route.class);
                route.setStops(null);
                route.setTimetable(null);
                route.setHistory(null);
                routesList.add(route);
            }
            System.out.println("routesList: " + routesList);
            return new ResponseEntity<>(routesList, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/updateBusRoute")
    public ResponseEntity<Boolean> updateBusRoute(@RequestParam String busCode, @RequestParam String routeId){
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference buses = db.collection(BUSES_COLLECTION);
        CollectionReference routes = db.collection(ROUTES_COLLECTION);

        try {
            Query query = buses.whereEqualTo("code", busCode);
            QuerySnapshot querySnapshot = query.get().get();
            if (querySnapshot.isEmpty()) {
                return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
            }

            //get the bus document
            DocumentSnapshot busDocument = querySnapshot.getDocuments().get(0);
            //aggiorna il campo route (che è di tipo DocumentReference) con il nuovo routeId
            DocumentReference routeRef = routes.document(routeId);
            busDocument.getReference().update("route", routeRef);

            //aggiorna anche il RealTime Database
            DatabaseReference database = FirebaseDatabase.getInstance().getReference();
            DatabaseReference busesRef = database.child("buses").child(busDocument.getId());
            //update the value routeId
            // Crea una mappa di valori per il nuovo valore di "routeId"
            Map<String, Object> update = new HashMap<>();
            update.put("routeId", routeId);

            // Esegui l'aggiornamento nel Realtime Database
            busesRef.updateChildren(update, new DatabaseReference.CompletionListener() {
                @Override
                public void onComplete(DatabaseError databaseError, DatabaseReference databaseReference) {
                    if (databaseError != null) {
                        // Gestione degli errori
                        System.out.println("Data could not be saved: " + databaseError.getMessage());
                    } else {
                        System.out.println("Bus route updated in Realtime Database successfully!");
                    }
                }
            });

            return new ResponseEntity<>(true, HttpStatus.OK);
        } catch (InterruptedException | ExecutionException e) {
            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/companyByEmail")
    public ResponseEntity<String> getCompanyByEmail(@RequestParam String email) {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference companies = db.collection(COMPANIES_COLLECTION);

        try {
            Query query = companies.whereEqualTo("email", email);
            QuerySnapshot querySnapshot = query.get().get();
            if (querySnapshot.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
            DocumentSnapshot companyDocument = querySnapshot.getDocuments().get(0);
            String company = companyDocument.getString("name");
            return new ResponseEntity<>(company, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Restituisce true se oggi è domenica, altrimenti false
    private boolean isSunday() {
        return LocalDate.now().getDayOfWeek().toString().equals("SUNDAY");
    }

    // Restituisce la data odierna nel formato "dd-MM-yyyy"
    // Non prendere la data dal client, ma calcolala lato server
    private String getCurrentDate() {
        return LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
    }

    // Restituisce l'orario attuale nel formato "HH:mm"
    // Non prendere l'orario dal client, ma calcolalo lato server
    private String getCurrentTime() {
        return LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    private DocumentSnapshot getDocumentById(CollectionReference collectionReference, String id) throws InterruptedException, ExecutionException {
        return collectionReference.document(id).get().get();
    }

}