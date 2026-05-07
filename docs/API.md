# Documentation API - Vita Express

## Vue d'ensemble

Cette documentation décrit l'architecture API de Vita Express, une plateforme de livraison moderne construite avec React, TypeScript et Supabase.

## Base URL

```
Production: https://vitaexpress.com/api
Développement: http://localhost:8080/api
```

## Authentification

### Endpoints

#### POST /auth/login
Connecte un utilisateur et retourne un token JWT.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["client"]
    },
    "session": {
      "token": "jwt_token",
      "expiresAt": "2024-12-31T23:59:59Z"
    }
  }
}
```

#### POST /auth/register
Crée un nouveau compte utilisateur.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+243812345678"
}
```

#### POST /auth/logout
Déconnecte l'utilisateur courant.

**Headers:**
```
Authorization: Bearer jwt_token
```

## Gestion des Commandes

### GET /orders
Récupère la liste des commandes de l'utilisateur.

**Headers:**
```
Authorization: Bearer jwt_token
```

**Query Parameters:**
- `status`: Filtrer par statut (pending, confirmed, in_delivery, delivered)
- `limit`: Nombre de résultats par page (défaut: 20)
- `offset`: Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "trackingCode": "VIT-2024-001234",
        "status": "in_delivery",
        "pickupAddress": "Gombe, Avenue du Commerce N°45",
        "deliveryAddress": "Limete, Résidentiel Bloc A N°12",
        "recipientName": "Jane Doe",
        "recipientPhone": "+243812345678",
        "packageType": "colis",
        "packageWeight": 2.5,
        "deliveryType": "express",
        "price": 3500,
        "createdAt": "2024-01-15T10:30:00Z",
        "estimatedDelivery": "2024-01-15T15:30:00Z"
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### POST /orders
Crée une nouvelle commande.

**Request Body:**
```json
{
  "pickupAddress": "Gombe, Avenue du Commerce N°45",
  "deliveryAddress": "Limete, Résidentiel Bloc A N°12",
  "recipientName": "Jane Doe",
  "recipientPhone": "+243812345678",
  "packageType": "colis",
  "packageWeight": 2.5,
  "packageDescription": "Documents importants",
  "deliveryType": "express",
  "specialInstructions": "Sonner à l'interphone"
}
```

### GET /orders/:id
Récupère les détails d'une commande spécifique.

### PUT /orders/:id/cancel
Annule une commande (si elle n'est pas encore en cours de livraison).

## Suivi en Temps Réel

### GET /tracking/:code
Récupère les informations de suivi pour un code de suivi.

**Response:**
```json
{
  "success": true,
  "data": {
    "trackingCode": "VIT-2024-001234",
    "status": "in_delivery",
    "estimatedDelivery": "2024-01-15T15:30:00Z",
    "currentLocation": "Avenue des Huileries, Gombe",
    "driver": {
      "name": "Jean Mukendi",
      "phone": "+243812345678",
      "photo": "https://example.com/driver.jpg",
      "rating": 4.8
    },
    "timeline": [
      {
        "time": "14:15",
        "status": "commande_confirmée",
        "title": "Commande confirmée",
        "description": "Votre commande a été confirmée"
      }
    ]
  }
}
```

### WebSocket /ws/tracking/:code
Connexion WebSocket pour le suivi en temps réel.

**Message de mise à jour:**
```json
{
  "type": "location_update",
  "data": {
    "location": {
      "lat": -4.4419,
      "lng": 15.2663,
      "address": "Avenue des Huileries, Gombe"
    },
    "timestamp": "2024-01-15T14:30:00Z"
  }
}
```

## Gestion des Utilisateurs (Admin)

### GET /admin/users
Récupère la liste des utilisateurs (admin uniquement).

### PUT /admin/users/:id/roles
Modifie les rôles d'un utilisateur.

**Request Body:**
```json
{
  "roles": ["client", "livreur"]
}
```

### GET /admin/users/:id/activity
Récupère l'historique d'activité d'un utilisateur.

## Gestion des Livreurs

### GET /drivers/disponible
Récupère la liste des livreurs disponibles.

### POST /drivers/assign
Assigne un livreur à une commande.

**Request Body:**
```json
{
  "orderId": "uuid",
  "driverId": "uuid"
}
```

### GET /drivers/:id/location
Récupère la position actuelle d'un livreur.

## Erreurs

### Format des erreurs
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Données invalides",
    "details": {
      "field": "email",
      "reason": "Email invalide"
    }
  }
}
```

### Codes d'erreur
- `VALIDATION_ERROR`: Données de formulaire invalides
- `AUTHENTICATION_REQUIRED`: Authentification requise
- `AUTHORIZATION_DENIED`: Permissions insuffisantes
- `RESOURCE_NOT_FOUND`: Ressource introuvable
- `RATE_LIMIT_EXCEEDED`: Trop de tentatives
- `INTERNAL_ERROR`: Erreur serveur

## Rate Limiting

- **Login**: 5 tentatives par 15 minutes
- **Register**: 3 tentatives par heure
- **Order Creation**: 10 commandes par heure
- **API générale**: 1000 requêtes par heure

## Sécurité

### Headers de sécurité
Toutes les réponses incluent les headers de sécurité suivants:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### Validation des entrées
Toutes les entrées utilisateur sont validées et nettoyées pour prévenir les attaques XSS et injection SQL.

### Tokens CSRF
Les formulaires POST incluent une protection CSRF.

## Webhooks

### POST /webhooks/payment
Reçoit les notifications de paiement des services tiers.

**Request Body:**
```json
{
  "eventId": "evt_123",
  "type": "payment.succeeded",
  "data": {
    "orderId": "uuid",
    "amount": 3500,
    "currency": "CDF",
    "status": "succeeded"
  }
}
```

## SDK Client

### Installation
```bash
npm install @vitaexpress/client
```

### Utilisation
```typescript
import { VitaExpressClient } from '@vitaexpress/client';

const client = new VitaExpressClient({
  baseURL: 'https://api.vitaexpress.com',
  apiKey: 'your_api_key'
});

// Créer une commande
const order = await client.orders.create({
  pickupAddress: '...',
  deliveryAddress: '...',
  // ...
});

// Suivre en temps réel
const tracking = client.tracking.subscribe('VIT-2024-001234');
tracking.on('location_update', (location) => {
  console.log('Nouvelle position:', location);
});
```

## Support

Pour toute question technique ou problème avec l'API:
- Email: tech@vitaexpress.com
- Documentation: https://docs.vitaexpress.com
- Statut de l'API: https://status.vitaexpress.com
