package com.example.busbus_backend.persistence;
public class TokenManager {
    private static final String SECRET_KEY = "532c183a85342d98ec5f85a6e19e9f9dfe277c3ee03899f241ef34ffe60f74ba"; // Cambia con una chiave segreta sicura
    private static final long EXPIRATION_TIME_MS = 24 * 7 * 60 * 60 * 1000; // 7 giorni

    public static String getSecretKey() {
        return SECRET_KEY;
    }

    public static long getExpirationTimeMs() {
        return EXPIRATION_TIME_MS;
    }
}
