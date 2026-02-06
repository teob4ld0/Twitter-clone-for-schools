# ✅ Arreglo de FCM Push Notifications

## 🔧 Cambios Realizados

### Backend (.NET)
1. **FcmService.cs**: Eliminado método de conversión falso `ConvertExpoTokenToFcmToken()`
2. **FcmService.cs**: Ahora usa tokens FCM nativos directamente
3. **ExpoPushService.cs**: Actualizado documentación para aclarar que espera FCM tokens

### Frontend (React Native)
1. **pushNotificationService.js**: Cambiado de `getExpoPushTokenAsync()` a `getDevicePushTokenAsync()`
2. Ahora obtiene **FCM device tokens nativos** en lugar de Expo tokens
3. Fallback a Expo token solo para desarrollo en Expo Go

## 📋 Diferencias de Tokens

| Tipo | Formato | Funciona con |
|------|---------|-------------|
| **Expo Token** | `ExponentPushToken[xxxxxx]` | Solo servicio de Expo |
| **FCM Token** | String largo sin prefijo | Firebase FCM directo ✅ |

## 🚀 Pasos para Probar

### 1. Rebuild de la App Móvil
```bash
cd ReactNativeFrontend
eas build --profile preview --platform android
```

### 2. Deploy del Backend
```bash
cd MyNetApp
docker build -t teosaez/twittetec-backend:0.0.85 .
docker push teosaez/twittetec-backend:0.0.85
kubectl set image deployment/backend backend=teosaez/twittetec-backend:0.0.85
```

### 3. Limpiar tokens viejos de la BD (opcional pero recomendado)
```sql
-- Los tokens que empiezan con "Exponent" son viejos e inválidos
DELETE FROM ExpoPushTokens WHERE Token LIKE 'ExponentPushToken%';
```

### 4. Probar
1. Instalar el nuevo APK
2. Hacer login
3. Verificar en logs que diga: `📱 FCM Device Token obtenido:` (sin "ExponentPushToken")
4. Enviar notificación de prueba
5. Debe llegar en 2-5 segundos

## 🔍 Debugging

### Ver tokens en la BD
```sql
SELECT 
    Id,
    UserId, 
    SUBSTRING(Token, 1, 50) as TokenPreview,
    CASE 
        WHEN Token LIKE 'ExponentPushToken%' THEN '❌ Expo (inválido)'
        ELSE '✅ FCM (válido)'
    END as TokenType,
    CreatedAt,
    LastUsedAt
FROM ExpoPushTokens 
ORDER BY CreatedAt DESC 
LIMIT 10;
```

### Logs del frontend
Buscar en consola de React Native:
- `✅ Token final registrado:` → debe ser un string largo sin "Exponent"
- `📱 FCM Device Token obtenido:` → confirmación de token nativo

### Logs del backend
Buscar en logs de .NET:
- `FCM notification sent successfully` → notificación enviada
- `FCM notification failed: 400` → token inválido (probablemente Expo token viejo)

## ⚠️ Importante

- Los **tokens antiguos** en la BD (formato `ExponentPushToken[xxx]`) **NO funcionarán**
- Los usuarios deben hacer **logout/login** o reinstalar app para obtener tokens FCM nuevos
- Si aparece error `INVALID_ARGUMENT` en logs de FCM = token es Expo, no FCM
