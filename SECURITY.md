# 🔒 Configuración de Credenciales

Este proyecto requiere varios archivos de configuración con credenciales sensibles que **NO están incluidos en el repositorio** por seguridad.

## 📋 Archivos Requeridos

### Backend (MyNetApp)

1. **`appsettings.json`**
   - Copia `appsettings.example.json` y renómbralo a `appsettings.json`
   - Configura las siguientes secciones:
     - `ConnectionStrings.DefaultConnection`: Credenciales de MySQL
     - `Jwt.Key`: Clave secreta para JWT (mínimo 32 caracteres)
     - `GoogleAuth.ClientId` y `ClientSecret`: OAuth de Google Cloud Console
     - `Brevo.ApiKey`: API key de Brevo (email service)
     - `VapidKeys`: Genera con `dotnet run` en la carpeta `VapidKeyGen`
     
2. **`firebase-service-account.json`**
   - Copia `firebase-service-account.example.json` y renómbralo
   - Descarga tu Service Account desde Firebase Console
   - Más info: https://firebase.google.com/docs/admin/setup

### Mobile App (ReactNativeFrontend)

1. **`google-services.json`**
   - Copia `google-services.example.json` y renómbralo
   - Descarga desde Firebase Console → Project Settings → Android App
   - Coloca en la raíz de ReactNativeFrontend

2. **`credentials.json`**
   - Copia `credentials.example.json` y renómbralo
   - Configura las credenciales del Android Keystore para firma de APKs
   - Solo necesario para builds de producción con EAS

## ⚠️ Importante

- **NUNCA** subas estos archivos al repositorio
- **NUNCA** compartas tus credenciales en chats, issues o PRs
- Usa variables de entorno en producción (Azure App Settings, etc.)
- Rota las credenciales regularmente

## 🔐 Variables de Entorno (Producción)

En lugar de archivos, usa variables de entorno en tu servidor de producción:

```bash
# Azure App Service → Configuration → Application Settings
CONNECTION_STRING=server=...
JWT_KEY=...
GOOGLE_CLIENT_SECRET=...
BREVO_API_KEY=...
```

## 📞 Soporte

Si necesitas ayuda configurando las credenciales, contacta al equipo de desarrollo.
