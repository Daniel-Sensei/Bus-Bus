package com.example.busbus_backend.persistence;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;

@Component
public class FirestoreInitializer {

    @PostConstruct
    public void initialize() {
        try {
            // Carica il file serviceAccountKey.json dalla classpath del progetto
            InputStream serviceAccount =
                    new ClassPathResource("serviceAccountKey.json").getInputStream();

            // Configura le opzioni di Firebase utilizzando le credenziali caricate
            FirebaseOptions options = new FirebaseOptions.Builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            // Inizializza FirebaseApp con le opzioni configurate
            FirebaseApp.initializeApp(options);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
