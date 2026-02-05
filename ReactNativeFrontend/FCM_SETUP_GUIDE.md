# 🔥 Guía de Configuración FCM para Play Store

## ✅ Paso 1: Archivo google-services.json - COMPLETADO

```
✓ google-services.json copiado a android/app/
✓ app.json actualizado con el package correcto: com.twittetec.mobile
✓ googleServicesFile configurado en app.json
```

---

## 🔧 Paso 2: Configurar Credenciales FCM en EAS

### Opción A: Usando google-services.json (RECOMENDADO)

Ejecuta en la terminal:

```bash
cd C:\Users\teoba\Twitter-clone-for-schools\ReactNativeFrontend
eas credentials
```

Cuando te pregunte, selecciona:
1. **Platform**: `Android`
2. **Profile**: `production` (o `preview` si solo quieres probar)
3. **Select platform**: `Android`
4. **What do you want to do?**: `Set up credentials for push notifications`
5. **Method**: `Upload google-services.json`
6. **File path**: `android/app/google-services.json`

### Opción B: Subida manual a través del comando específico

```bash
eas credentials -p android
```

Luego:
- Selecciona `production` profile
- Choose: `Push Notifications: Setup FCM`
- Upload: `android/app/google-services.json`

---

## 📱 Paso 3: Verificar Configuración

Una vez subido, verifica con:

```bash
eas credentials -p android
```

Deberías ver:
```
✓ Push Notifications: FCM Server Key [configured]
✓ Push Notifications: FCM V1 Service Account [configured]
```

---

## 🏗️ Paso 4: Reconstruir la App

Para que los cambios surtan efecto, necesitas hacer un nuevo build:

### Para Testing (APK):
```bash
eas build --profile preview --platform android
```

### Para Play Store (AAB):
```bash
eas build --profile production --platform android
```

---

## ⚠️ IMPORTANTE: Cambio de Package Name

**ANTES**: `com.mynetapp`  
**AHORA**: `com.twittetec.mobile`

Esto significa que necesitarás:
1. ✅ Desinstalar la app antigua del dispositivo (si existe)
2. ✅ Instalar la nueva versión con el nuevo package
3. ⚠️ Si ya tienes usuarios, considera mantener el package antiguo y crear una nueva app en Firebase

---

## 🧪 Paso 5: Probar Notificaciones

Después del build, instala y prueba:

```bash
# Ver logs en tiempo real
cd $env:LOCALAPPDATA\Android\Sdk\platform-tools
.\adb.exe logcat | Select-String -Pattern "Expo|FCM|Notification"
```

Desde el backend .NET, envía una notificación de prueba a través de:
```
POST /api/push/test-expo
```

---

## 🎯 Checklist Final

- [x] google-services.json en android/app/
- [x] app.json actualizado con package correcto
- [x] googleServicesFile configurado
- [ ] Credenciales FCM subidas a EAS
- [ ] Build nuevo generado
- [ ] Notificaciones probadas en dispositivo físico

---

## 🐛 Troubleshooting

### Error: "Package name mismatch"
- Verifica que el package en app.json coincida con el de google-services.json
- Actualmente: `com.twittetec.mobile`

### Error: "FCM token not registered"
- Asegúrate de que el build nuevo esté instalado
- Verifica que los permisos de notificación estén otorgados
- Revisa logs con: `adb logcat | Select-String Expo`

### Notificaciones no llegan
1. Verifica que el token se registre en el backend: `GET /api/push/expo-tokens`
2. Verifica logs del ExpoPushService en el backend
3. Prueba con: `POST /api/push/test-expo`

---

## 📚 Referencias

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Firebase Console](https://console.firebase.google.com)
- [EAS Credentials](https://docs.expo.dev/app-signing/managed-credentials/)
