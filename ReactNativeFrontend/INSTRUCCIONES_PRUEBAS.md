# 📱 Instrucciones para Probar los Cambios

## ⚠️ IMPORTANTE: Los cambios NO están en tu build actual

Los fixes que hice están en el código fuente pero **NO en el APK que tienes instalado**.

---

## 🔧 Cambios Realizados (en código)

### 1. ✅ Fix Minimización de App (Notificaciones)
**Archivo**: `PushNotificationProvider.jsx`
- Agregado `AppState` listener para detectar cuando vuelves del diálogo de permisos
- La app ahora reintenta obtener el token cuando regresa al foreground
- Logging mejorado para debug

### 2. ✅ Fix Subida de Archivos
**Archivo**: `app.json`
- Configurado plugin `expo-image-picker` con `mediaTypes`
- Los permisos ya estaban correctos (Android 13+)

---

## 🚀 Cómo Probar (cuando tengas el celular)

### Opción A: Modo Desarrollo (Recomendado para pruebas)

```powershell
# Terminal 1: Iniciar Metro Bundler
cd C:\Users\teoba\Twitter-clone-for-schools\ReactNativeFrontend
npx expo start

# Presiona 'a' para Android
# O escanea el QR con Expo Go
```

**Ventajas:**
- ✅ Fast Refresh - Los cambios se aplican al instante
- ✅ Ver logs en tiempo real en la terminal
- ✅ Debugging fácil
- ✅ No necesitas rebuild

**Requisitos:**
- Celular conectado por USB con depuración USB activada, O
- Celular en la misma red WiFi

---

### Opción B: Build de Producción

```powershell
cd C:\Users\teoba\Twitter-clone-for-schools\ReactNativeFrontend
eas build --profile preview --platform android
```

Espera 5-15 minutos → Descarga el APK → Instala

---

## 🧪 Tests a Realizar

### Test 1: Notificaciones Push
1. Abre la app
2. Inicia sesión
3. **OBSERVA**: Se abrirá el diálogo de permisos y la app se minimizará
4. **PERMITE** las notificaciones
5. **VUELVE A LA APP** (la app detectará que volviste)
6. **VERIFICA EN LOGS**: Deberías ver "📱 App volvió al foreground" y "✅ Token de Expo registrado"

**Verificar token en backend:**
```bash
GET /api/push/expo-tokens
```

Deberías ver tu token registrado.

### Test 2: Subir Archivos (Status)
1. Click en "+" para crear status
2. Click en el ícono de imagen 📷
3. **OBSERVA**: Pide permisos de galería
4. **PERMITE** acceso a fotos
5. Selecciona una imagen
6. Publica el status con la imagen

### Test 3: Subir Archivos (Chat)
1. Abre un chat
2. Click en clip 📎 para adjuntar
3. Selecciona foto/video
4. Envía mensaje

---

## 📊 Logs para Debugging

### Ver todos los logs de Expo:
```powershell
cd $env:LOCALAPPDATA\Android\Sdk\platform-tools
.\adb.exe logcat | Select-String "Expo|ReactNative|Notification|ImagePicker"
```

### Ver logs específicos de la app:
```powershell
.\adb.exe logcat | Select-String "📱|🔔|✅|❌|📷"
```

---

## ❓ Troubleshooting

### Problema: App sigue minimizándose sin obtener token
**Causa**: Estás usando el build viejo
**Solución**: Usa modo desarrollo con `npx expo start` o haz nuevo build

### Problema: No se suben archivos
**Causa Posible 1**: Build viejo sin los cambios
**Solución**: Nuevo build o modo dev

**Causa Posible 2**: Permisos no otorgados
**Solución**: 
```powershell
# Verificar permisos (cuando tengas dispositivo)
.\adb.exe shell dumpsys package com.twittetec.mobile | Select-String "permission"
```

### Problema: "CAMERA permission denied"
**Solución**: Ve a Settings → Apps → MyNetApp → Permissions → Otorga permisos

---

## 🎯 Checklist de Prueba

Cuando tengas el celular, verifica:

- [ ] App inicia correctamente
- [ ] Login funciona
- [ ] Se muestra diálogo de permisos de notificaciones
- [ ] App se minimiza al mostrar diálogo (esperado)
- [ ] App vuelve al foreground después de dar permiso
- [ ] Token de Expo se genera (ver logs)
- [ ] Token se registra en backend
- [ ] Puedes seleccionar imágenes de galería
- [ ] Puedes publicar status con imagen
- [ ] Puedes enviar archivos por chat
- [ ] Recibes notificaciones push (envía test desde backend)

---

## 🔄 Comando Rápido para Dev Mode

```powershell
cd C:\Users\teoba\Twitter-clone-for-schools\ReactNativeFrontend; npx expo start
```

Luego presiona `a` para Android.

---

## 📞 Si algo no funciona

1. Limpia caché y reinstala:
```powershell
cd C:\Users\teoba\Twitter-clone-for-schools\ReactNativeFrontend
npx expo start -c
```

2. Verifica package:
```powershell
.\adb.exe shell pm list packages | Select-String twittetec
```

3. Desinstala versión vieja:
```powershell
.\adb.exe uninstall com.twittetec.mobile
```
