# 🐦 Twittetec - Twitter Clone for Schools

Red social educativa construida para instituciones académicas con autenticación Google Workspace, sistema de posts, chat en tiempo real, notificaciones push y más.

---

## 📋 Tabla de Contenidos

- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración Local](#-configuración-local)
- [Ejecución](#-ejecución)
- [Características](#-características)
- [Deploy](#-deploy)

---

## 🛠 Tecnologías

### Backend (.NET)
- **.NET 9.0** - Framework principal
- **ASP.NET Core Web API** - Arquitectura REST
- **Entity Framework Core** - ORM para MySQL
- **MySQL 8.0** - Base de datos relacional
- **SignalR** - WebSockets para chat y notificaciones en tiempo real
- **JWT** - Autenticación basada en tokens
- **BCrypt.Net** - Hash de contraseñas
- **Google OAuth 2.0** - Login con cuentas institucionales
- **Firebase Admin SDK** - Push notifications (FCM)
- **Google Cloud Storage** - Almacenamiento de media
- **Brevo API** - Envío de emails transaccionales

### Frontend Web (React)
- **React 19** - Biblioteca UI
- **Vite** - Build tool y dev server
- **React Router v6** - Navegación SPA
- **Redux Toolkit** - State management
- **@microsoft/signalr** - Cliente SignalR
- **Axios** - Cliente HTTP
- **PWA** - Progressive Web App con service workers

### Mobile (React Native)
- **React Native 0.81.5** - Framework mobile
- **Expo SDK 54** - Toolchain y libraries
- **Expo Notifications** - Push notifications
- **React Navigation** - Navegación móvil
- **Redux Toolkit** - State management
- **@microsoft/signalr** - Cliente SignalR
- **expo-image-picker** - Selección de media

---

## 📁 Estructura del Proyecto

```
Twitter-clone-for-schools/
├── MyNetApp/                # Backend .NET API
│   ├── Controllers/         # Endpoints REST
│   ├── Models/             # Entidades del dominio
│   ├── DTOs/               # Data Transfer Objects
│   ├── Services/           # Lógica de negocio
│   ├── Hubs/               # SignalR hubs (chat, notificaciones)
│   ├── Middleware/         # Middleware personalizado
│   ├── Migrations/         # Migraciones EF Core
│   └── appsettings.json    # Configuración
│
├── frontend/               # Frontend Web React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas/rutas
│   │   ├── context/        # Context API
│   │   ├── store/          # Redux store y slices
│   │   ├── services/       # API clients
│   │   └── layouts/        # Layout components
│   ├── public/             # Assets estáticos + PWA
│   └── vite.config.js      # Configuración Vite
│
├── ReactNativeFrontend/    # Mobile App React Native
│   ├── src/
│   │   ├── components/     # Componentes móviles
│   │   ├── screens/        # Pantallas de navegación
│   │   ├── context/        # Auth context
│   │   ├── store/          # Redux store
│   │   ├── services/       # API clients
│   │   └── utils/          # Utilidades
│   ├── app.json            # Configuración Expo
│   └── eas.json            # EAS Build config
│
└── PostmanStuff/           # Colecciones Postman para testing
```

---

## ✅ Requisitos Previos

### Para Backend
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [MySQL 8.0](https://dev.mysql.com/downloads/mysql/) o [MariaDB](https://mariadb.org/download/)
- Visual Studio 2022 / VS Code / Rider (opcional pero recomendado)

### Para Frontend Web
- [Node.js 20+](https://nodejs.org/) (LTS recomendado)
- npm o yarn

### Para Mobile App
- [Node.js 20+](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- **Expo Go** app en tu teléfono ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- (Opcional) Android Studio / Xcode para emuladores

---

## 📦 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/Twitter-clone-for-schools.git
cd Twitter-clone-for-schools
```

### 2. Backend (.NET)

```bash
cd MyNetApp
dotnet restore
```

### 3. Frontend Web (React)

```bash
cd frontend
npm install
# o
yarn install
```

### 4. Mobile App (React Native)

```bash
cd ReactNativeFrontend
npm install
# o
yarn install
```

---

## ⚙️ Configuración Local

### 🔧 Backend - `MyNetApp/appsettings.json`

#### **Base de Datos MySQL** (⚠️ REQUERIDO)

Crea una base de datos MySQL local:

```sql
CREATE DATABASE TwittetecDb;
```

Actualiza la cadena de conexión:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "server=localhost;port=3306;database=TwittetecDb;user=root;password=TU_PASSWORD;"
  }
}
```

Aplica las migraciones:

```bash
cd MyNetApp
dotnet ef database update
```

#### **Google OAuth** (⚠️ REQUERIDO para login con Google)

Si quieres probar el login con Google:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo
3. Habilita la API de Google+
4. Crea credenciales OAuth 2.0
5. Agrega `http://localhost:5173/callback` a URIs de redirección autorizadas

Actualiza en `appsettings.json`:

```json
{
  "GoogleAuth": {
    "ClientId": "TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    "ClientSecret": "TU_GOOGLE_CLIENT_SECRET",
    "RedirectUri": "http://localhost:5094/api/auth/google/exchange",
    "FrontendUrl": "http://localhost:5173",
    "AllowedEmailDomains": ["gmail.com", "tudominio.com"]
  }
}
```

#### **Google Cloud Storage** (⚠️ OPCIONAL - puede funcionar sin esto)

Para subir imágenes/videos:

1. Crea un bucket en [Google Cloud Storage](https://console.cloud.google.com/storage)
2. Crea una cuenta de servicio con permisos de Storage Admin
3. Descarga el JSON de credenciales
4. Colócalo en `MyNetApp/gcs-credentials.json`

```json
{
  "GoogleCloudStorage": {
    "BucketName": "tu-bucket-name",
    "PublicBaseUrl": "https://storage.googleapis.com/tu-bucket-name",
    "GoogleCredentialsJson": "gcs-credentials.json",
    "TrySetPublicReadAcl": true
  }
}
```

**⚠️ SIN CONFIGURAR**: Los archivos se guardarán localmente en `MyNetApp/wwwroot/uploads/`

#### **Firebase Push Notifications** (⚠️ OPCIONAL)

Para notificaciones push en mobile:

1. Crea un proyecto en [Firebase Console](https://console.firebase.com/)
2. Descarga el archivo `google-services.json` (Android)
3. Colócalo en `ReactNativeFrontend/android/app/google-services.json`
4. Descarga la clave privada de Service Account
5. Colócala en `MyNetApp/firebase-service-account.json`

```json
{
  "Firebase": {
    "ProjectId": "tu-proyecto-firebase",
    "ServiceAccountFilePath": "firebase-service-account.json"
  }
}
```

**⚠️ SIN CONFIGURAR**: Las notificaciones push no funcionarán, pero el resto de la app sí.

#### **Email (Brevo API)** (⚠️ OPCIONAL)

Para emails de verificación:

1. Crea cuenta en [Brevo](https://www.brevo.com/)
2. Genera una API Key
3. Crea una plantilla de email de verificación

```json
{
  "Brevo": {
    "ApiKey": "TU_BREVO_API_KEY",
    "SenderEmail": "noreply@tudominio.com",
    "SenderName": "Tu App",
    "FrontendUrl": "http://localhost:5173",
    "VerificationEmailTemplateId": 1
  }
}
```

**⚠️ SIN CONFIGURAR**: Los usuarios se crearán sin verificación de email.

---

### 🌐 URLs para Desarrollo Local

#### **Frontend Web - `frontend/vite.config.js`**

Cambia el proxy para apuntar a tu backend local:

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5094',  // Puerto de tu backend local
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://localhost:5094',
        changeOrigin: true,
        ws: true,
      }
    }
  }
})
```

#### **Mobile App - `ReactNativeFrontend/src/config/config.js`**

Cambia la URL del API:

```javascript
// Para desarrollo local, usa la IP de tu PC en la red local
// NO uses "localhost" porque el celular no reconoce ese host

const getApiUrl = () => {
  // Opción 1: Hardcodeado
  return 'http://192.168.1.100:5094/api';  // Reemplaza con tu IP local
  
  // Opción 2: Usar configuración de Expo
  // const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://192.168.1.100:5094/api';
  // return apiUrl;
};
```

**🔍 Cómo obtener tu IP local:**

Windows:
```powershell
ipconfig
# Busca "IPv4 Address" en tu adaptador de red activo
```

macOS/Linux:
```bash
ifconfig
# Busca "inet" en tu interfaz activa (en0, wlan0, etc.)
```

#### **Frontend Web - Variables de Entorno** (opcional)

Crea `frontend/.env`:

```env
VITE_API_URL=http://localhost:5094/api
```

---

## 🚀 Ejecución

### 1️⃣ Iniciar Backend

```bash
cd MyNetApp
dotnet run
```

El backend estará disponible en: **http://localhost:5094**

Swagger UI: **http://localhost:5094/swagger**

### 2️⃣ Iniciar Frontend Web

```bash
cd frontend
npm run dev
# o
yarn dev
```

La aplicación web estará disponible en: **http://localhost:5173**

### 3️⃣ Iniciar Mobile App

#### Opción A: Expo Go (Recomendado para desarrollo)

```bash
cd ReactNativeFrontend
npx expo start
# o
npm start
```

Luego:
- **Android**: Escanea el QR con la app Expo Go
- **iOS**: Escanea el QR con la cámara nativa

**Ventajas:**
- ✅ Sin necesidad de builds
- ✅ Fast Refresh instantáneo
- ✅ Fácil para probar rápido

**Desventajas:**
- ❌ No incluye código nativo personalizado (pero este proyecto no lo necesita)

#### Opción B: Emulador Android

```bash
cd ReactNativeFrontend
npm run android
```

Requiere Android Studio y un emulador configurado.

#### Opción C: Build APK para Testing

```bash
cd ReactNativeFrontend
eas build --profile preview --platform android
```

Requiere cuenta de Expo y [EAS CLI](https://docs.expo.dev/build/setup/).

---

## 🎯 Características

### ✅ Funcionan sin configuración externa:
- ✅ Registro y login con email/password
- ✅ Sistema de posts (crear, editar, eliminar)
- ✅ Likes, reposts, quotes
- ✅ Comentarios/replies
- ✅ Sistema de seguimiento (follow/unfollow)
- ✅ Feed personalizado
- ✅ Perfiles de usuario
- ✅ Chat en tiempo real (SignalR)
- ✅ Notificaciones en tiempo real (SignalR)
- ✅ Subida de imágenes (guardadas localmente si no hay GCS)

### ⚠️ Requieren configuración externa:
- ⚠️ Login con Google OAuth
- ⚠️ Subida de imágenes a la nube (Google Cloud Storage)
- ⚠️ Emails de verificación (Brevo API)
- ⚠️ Push notifications en mobile (Firebase FCM)

### 🔐 Roles y Permisos:
- **Usuario Normal**: Puede crear posts, chatear, seguir usuarios
- **Administrador**: Puede banear usuarios, eliminar contenido de cualquiera
  - Para hacer un usuario admin, edita directamente la base de datos:
    ```sql
    UPDATE Users SET Role = 'Admin' WHERE Email = 'tu@email.com';
    ```

---

## 🌐 Deploy

### Backend
El backend está desplegado en: **https://io.twittetec.com**

Stack de producción:
- Azure App Service / VPS con Docker
- MySQL 8.0 en db.twittetec.com
- Google Cloud Storage para media
- Firebase FCM para push notifications

### Frontend Web
El frontend web está desplegado en: **https://app.twittetec.com**

Stack de producción:
- Docker con Nginx
- Proxy reverso a backend para `/api` y `/hubs`

### Mobile App
Build con EAS Build:

```bash
cd ReactNativeFrontend

# Preview (APK para testing)
eas build --profile preview --platform android

# Production (AAB para Play Store)
eas build --profile production --platform android
```

---

## 📝 Variables de Entorno por Componente

### Backend (`appsettings.json`)
```json
{
  "ConnectionStrings:DefaultConnection": "REQUERIDO",
  "Jwt:Key": "REQUERIDO (auto-generado)",
  "Jwt:Issuer": "REQUERIDO",
  "Jwt:Audience": "REQUERIDO",
  "GoogleAuth:ClientId": "OPCIONAL",
  "GoogleAuth:ClientSecret": "OPCIONAL",
  "GoogleCloudStorage:BucketName": "OPCIONAL",
  "GoogleCloudStorage:GoogleCredentialsJson": "OPCIONAL",
  "Firebase:ProjectId": "OPCIONAL",
  "Firebase:ServiceAccountFilePath": "OPCIONAL",
  "Brevo:ApiKey": "OPCIONAL"
}
```

### Frontend Web (`.env`)
```env
VITE_API_URL=http://localhost:5094/api  # Opcional
```

### Mobile App (`app.config.js`)
```javascript
extra: {
  apiUrl: "http://192.168.1.100:5094/api"  // IP local para desarrollo
}
```

---

## 🐛 Troubleshooting

### Backend no conecta a MySQL
- Verifica que MySQL esté corriendo: `mysql -u root -p`
- Asegúrate de que el puerto 3306 esté abierto
- Confirma las credenciales en `appsettings.json`

### Frontend web no se comunica con backend
- Verifica que el backend esté corriendo en el puerto correcto
- Revisa la configuración del proxy en `vite.config.js`
- Abre la consola del navegador para ver errores CORS

### Mobile app no conecta al backend
- **NO USES `localhost`** - usa tu IP local (ej: `192.168.1.100`)
- Verifica que el celular y la PC estén en la misma red WiFi
- Desactiva el firewall temporalmente para probar
- Revisa los logs en la terminal de Expo

### Error de migraciones EF Core
```bash
cd MyNetApp
dotnet ef database drop --force
dotnet ef database update
```

### Expo Go no conecta
- Asegúrate de que estés en la misma red
- Prueba con `npx expo start --tunnel` (más lento pero más confiable)
- Verifica que el firewall no bloquee el puerto

---

## 👥 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

## 🙏 Créditos

Desarrollado para la **Escuela Técnica ORT** como proyecto educativo.

**Stack Principal:**
- .NET 9.0 por Microsoft
- React 19 por Meta
- React Native por Meta
- Expo por Expo Team

---

## 📞 Soporte

Para reportar bugs o solicitar features, abre un issue en GitHub.

---

**Happy Coding! 🚀**
