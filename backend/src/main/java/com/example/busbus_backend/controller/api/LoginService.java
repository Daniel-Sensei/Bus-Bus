package com.example.busbus_backend.controller.api;

import com.example.busbus_backend.persistence.TokenManager;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;

@RestController
@CrossOrigin("*")
public class LoginService {
    @GetMapping("generate-custom-token")
    public ResponseEntity<String> generateCustomToken(@RequestParam String uid) {
        try {
            // Verifica che lo UID esista nelle autenticazioni di Firebase
            FirebaseAuth.getInstance().getUser(uid);

            // Se lo UID esiste, genera il token
            Date now = new Date();
            Date expiration = new Date(now.getTime() + TokenManager.getExpirationTimeMs());

            String token = Jwts.builder()
                    .setSubject(uid)
                    .setIssuedAt(now)
                    .setExpiration(expiration)
                    .signWith(SignatureAlgorithm.HS256, TokenManager.getSecretKey())
                    .compact();
            return ResponseEntity.ok(token);
        } catch (FirebaseAuthException e) {
            // Se lo UID non esiste, restituisci un errore 404
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("verify-custom-token")
    public ResponseEntity<Boolean> verifyCustomToken(@RequestHeader("Authorization") String token){
        try {
            //il token è preceduto dalla stringa "Bearer ", quindi la rimuoviamo
            token = token.substring(7);
            Jwts.parser().setSigningKey(TokenManager.getSecretKey()).parseClaimsJws(token);
            //stampa data di scadenza del token
            System.out.println("Scadenza: " + Jwts.parser().setSigningKey(TokenManager.getSecretKey()).parseClaimsJws(token).getBody().getExpiration());
            return new ResponseEntity<>(true, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(false, HttpStatus.UNAUTHORIZED);
        }
    }
}
