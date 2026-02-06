# Guía de Configuración Metro Bundler para Development Builds

## Problema
Cuando haces un build de desarrollo (development build) con `eas build`, la app necesita conectarse al Metro bundler que corre en tu computadora. Si no está configurado correctamente, la app no cargará.

## Solución

### Paso 1: Obtener tu IP local

Ejecuta el siguiente comando en la carpeta ReactNativeFrontend:

```bash
npm run get-ip
```

Esto mostrará las IPs de tu computadora. Copia la que empieza con `192.168.x.x` o `10.0.x.x`.

### Paso 2: Configurar la variable de entorno

1. Si no existe un archivo `.env`, crea uno copiando `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Abre el archivo `.env` y descomenta la línea `REACT_NATIVE_PACKAGER_HOSTNAME`:
   ```
   REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.XXX
   ```
   Reemplaza `192.168.1.XXX` con la IP que obtuviste en el Paso 1.

### Paso 3: Iniciar Metro con la configuración LAN

Usa uno de estos comandos:

```bash
# Para iniciar Metro en modo LAN (recomendado para development builds)
npm run start:lan

# Para iniciar solo Metro sin abrir la app
npm start

# Para iniciar con Android en modo LAN
npm run android:lan
```

### Paso 4: Instalar y ejecutar el development build

```bash
# Crear el build de desarrollo
eas build --profile development --platform android

# O si ya tienes el build instalado, solo abre la app en tu dispositivo
```

## Opciones de Conexión

### Opción 1: LAN (Recomendado)
- Usa `npm run start:lan`
- Tu dispositivo y computadora deben estar en la misma red WiFi
- Es la opción más rápida y estable

### Opción 2: Tunnel
- Usa `npm run start:host`
- Funciona incluso si no estás en la misma red
- Puede ser más lento

### Opción 3: Expo Go (Solo para desarrollo rápido)
- Usa `npm start` y escanea el QR con Expo Go
- Limitaciones: No funciona con código nativo custom

## Troubleshooting

### El bundler no se conecta
1. Verifica que tu dispositivo y computadora están en la misma red WiFi
2. Verifica que el firewall no está bloqueando Metro (puerto 8081)
3. Ejecuta `npm run get-ip` para confirmar la IP actual

### El build sigue sin funcionar
1. Asegúrate de haber creado un **development build** (`eas build --profile development`)
2. Asegúrate de que Metro está corriendo ANTES de abrir la app
3. Limpia el caché: `npx expo start -c`

### Cambio de red
Si cambias de red WiFi, necesitas:
1. Ejecutar `npm run get-ip` para obtener la nueva IP
2. Actualizar el archivo `.env` con la nueva IP
3. Reiniciar Metro bundler
