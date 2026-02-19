# Guía de Internacionalización (i18n) - Twittetec

## 📚 Configuración Completa

react-i18next ya está completamente configurado en la aplicación con soporte para **Español** e **Inglés**.

## 🚀 Cómo Usar en tus Componentes

### 1. Importar y usar el hook `useTranslation`

```javascript
import { useTranslation } from 'react-i18next';

function MiComponente() {
  const { t, i18n } = useTranslation();
  
  return (
    <View>
      <Text>{t('auth.login')}</Text>
      <Text>{t('auth.email')}</Text>
      <Button title={t('common.save')} />
    </View>
  );
}
```

### 2. Textos con Variables (Interpolación)

```javascript
// En el JSON:
// "welcome": "Bienvenido, {{name}}!"

<Text>{t('welcome', { name: user.name })}</Text>
// Resultado: "Bienvenido, Juan!"
```

### 3. Plurales

```javascript
// En el JSON:
// "likes_zero": "{{count}} me gusta"
// "likes_one": "{{count}} me gusta"
// "likes_other": "{{count}} me gusta"

<Text>{t('feed.likes', { count: likesCount })}</Text>
// 0 likes: "0 me gusta"
// 1 like: "1 me gusta"
// 5 likes: "5 me gusta"
```

### 4. Cambiar el Idioma Programáticamente

```javascript
import { changeLanguage } from '../i18n';

// Cambiar a inglés
await changeLanguage('en');

// Cambiar a español
await changeLanguage('es');

// Obtener idioma actual
const currentLang = i18n.language; // 'es' o 'en'
```

## 🔧 Selector de Idioma en Settings

Ya creé un componente `LanguageSelector` listo para usar. Para agregarlo a tu pantalla de Settings:

```javascript
import LanguageSelector from '../components/LanguageSelector';

function SettingsScreen() {
  return (
    <ScrollView>
      {/* ... otras opciones ... */}
      
      <LanguageSelector />
      
      {/* ... más opciones ... */}
    </ScrollView>
  );
}
```

## 📝 Estructura de Archivos

```
src/
├── i18n/
│   ├── index.js           # Configuración principal
│   └── locales/
│       ├── es.json        # Traducciones en español
│       └── en.json        # Traducciones en inglés
└── components/
    └── LanguageSelector.jsx  # Componente selector de idioma
```

## 📖 Categorías de Traducciones Disponibles

### `common.*` - Textos comunes
```javascript
t('common.yes')        // "Sí" / "Yes"
t('common.no')         // "No" / "No"
t('common.cancel')     // "Cancelar" / "Cancel"
t('common.save')       // "Guardar" / "Save"
t('common.loading')    // "Cargando..." / "Loading..."
```

### `auth.*` - Autenticación
```javascript
t('auth.login')           // "Iniciar Sesión" / "Log In"
t('auth.register')        // "Registrarse" / "Sign Up"
t('auth.email')           // "Correo electrónico" / "Email"
t('auth.password')        // "Contraseña" / "Password"
t('auth.logoutConfirm')   // Mensaje de confirmación
```

### `feed.*` - Feed/Publicaciones
```javascript
t('feed.title')           // "Inicio" / "Home"
t('feed.whatsHappening')  // "¿Qué está pasando?" / "What's happening?"
t('feed.post')            // "Publicar" / "Post"
t('feed.like')            // "Me gusta" / "Like"
t('feed.comment')         // "Comentar" / "Comment"
```

### `profile.*` - Perfil
```javascript
t('profile.title')        // "Perfil" / "Profile"
t('profile.editProfile')  // "Editar Perfil" / "Edit Profile"
t('profile.followers')    // "Seguidores" / "Followers"
t('profile.following')    // "Siguiendo" / "Following"
```

### `chat.*` - Mensajes
```javascript
t('chat.title')           // "Chats" / "Chats"
t('chat.typeMessage')     // "Escribe un mensaje..." / "Type a message..."
t('chat.online')          // "En línea" / "Online"
t('chat.offline')         // "Desconectado" / "Offline"
```

### `notifications.*` - Notificaciones
```javascript
t('notifications.title')              // "Notificaciones" / "Notifications"
t('notifications.noNotifications')    // "No hay notificaciones" / "No notifications"
t('notifications.markAllAsRead')      // "Marcar todas como leídas" / "Mark all as read"
```

### `settings.*` - Configuración
```javascript
t('settings.title')       // "Configuración" / "Settings"
t('settings.language')    // "Idioma" / "Language"
t('settings.theme')       // "Tema" / "Theme"
t('settings.darkMode')    // "Modo oscuro" / "Dark mode"
```

### `errors.*` - Errores
```javascript
t('errors.networkError')     // "Error de conexión" / "Network error"
t('errors.serverError')      // "Error del servidor" / "Server error"
t('errors.tryAgain')         // "Intentar de nuevo" / "Try again"
```

## 💡 Ejemplos Prácticos

### Ejemplo 1: LoginScreen

```javascript
import { useTranslation } from 'react-i18next';

function LoginScreen() {
  const { t } = useTranslation();
  
  return (
    <View>
      <Text style={styles.title}>{t('auth.login')}</Text>
      
      <TextInput 
        placeholder={t('auth.emailPlaceholder')}
      />
      
      <TextInput 
        placeholder={t('auth.passwordPlaceholder')}
        secureTextEntry
      />
      
      <Button title={t('auth.login')} onPress={handleLogin} />
      
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text>{t('auth.noAccount')} {t('auth.register')}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Ejemplo 2: Alerta con Traducciones

```javascript
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  const handleDelete = () => {
    Alert.alert(
      t('feed.deletePost'),
      t('feed.deletePostConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: () => deletePost()
        }
      ]
    );
  };
}
```

### Ejemplo 3: Formato de Tiempo Relativo

```javascript
// notifications.timeAgo.secondsAgo: "Hace {{count}}s"
// notifications.timeAgo.minutesAgo: "Hace {{count}}m"
// notifications.timeAgo.hoursAgo: "Hace {{count}}h"

function formatTimeAgo(seconds) {
  const { t } = useTranslation();
  
  if (seconds < 60) {
    return t('notifications.timeAgo.secondsAgo', { count: seconds });
  } else if (seconds < 3600) {
    return t('notifications.timeAgo.minutesAgo', { count: Math.floor(seconds / 60) });
  } else if (seconds < 86400) {
    return t('notifications.timeAgo.hoursAgo', { count: Math.floor(seconds / 3600) });
  }
  // ... más casos
}
```

## 🔄 Detección Automática del Idioma

La app automáticamente:
1. **Detecta el idioma del dispositivo** al abrir por primera vez
2. **Guarda la preferencia** del usuario en AsyncStorage
3. **Mantiene el idioma seleccionado** entre sesiones
4. **Por defecto usa español** si el idioma del dispositivo no es español o inglés

## ➕ Agregar Nuevas Traducciones

### 1. En `src/i18n/locales/es.json`:
```json
{
  "myFeature": {
    "title": "Mi Nueva Funcionalidad",
    "description": "Esta es una descripción"
  }
}
```

### 2. En `src/i18n/locales/en.json`:
```json
{
  "myFeature": {
    "title": "My New Feature",
    "description": "This is a description"
  }
}
```

### 3. Usar en tu componente:
```javascript
<Text>{t('myFeature.title')}</Text>
<Text>{t('myFeature.description')}</Text>
```

## 🌍 Agregar Más Idiomas (Futuro)

Si quieres agregar más idiomas (ej: portugués):

1. **Crear archivo de traducciones**: `src/i18n/locales/pt.json`
2. **Importar en `src/i18n/index.js`**:
```javascript
import pt from './locales/pt.json';

const resources = {
  es: { translation: es },
  en: { translation: en },
  pt: { translation: pt }  // Nuevo
};
```

3. **Agregar a languages disponibles**:
```javascript
export const getAvailableLanguages = () => {
  return [
    { code: 'es', name: 'Español', nativeName: 'Español' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' }
  ];
};
```

## 🐛 Troubleshooting

### Las traducciones no aparecen
```javascript
// Verifica que i18n esté inicializado
console.log('Current language:', i18n.language);
console.log('Translation:', i18n.t('auth.login'));
```

### El idioma no cambia
```javascript
// Forzar refresh después de cambiar idioma
import { changeLanguage } from '../i18n';

await changeLanguage('en');
// La UI se actualizará automáticamente
```

### Ver qué idioma está activo
```javascript
import { getCurrentLanguage } from '../i18n';

const currentLang = getCurrentLanguage();
console.log('Current language:', currentLang); // 'es' o 'en'
```

## 🎯 Best Practices

1. **Usa claves descriptivas**: `auth.loginButton` en vez de `btn1`
2. **Agrupa por funcionalidad**: `auth.*`, `feed.*`, `profile.*`
3. **No hardcodees texto**: Siempre usa `t('key')` en lugar de texto directo
4. **Usa interpolación** para valores dinámicos: `t('welcome', { name })`
5. **Maneja plurales** correctamente usando las convenciones de i18next

## ✅ Checklist de Implementación

- [x] Instalar dependencias (`i18next`, `react-i18next`, `react-native-localize`)
- [x] Crear configuración de i18n
- [x] Crear archivos de traducción (es.json, en.json)
- [x] Inicializar i18n en App.js
- [x] Crear componente LanguageSelector
- [ ] Traducir LoginScreen
- [ ] Traducir RegisterScreen
- [ ] Traducir FeedScreen
- [ ] Traducir ProfileScreen
- [ ] Traducir ChatsScreen
- [ ] Traducir NotificationsScreen
- [ ] Traducir SettingsScreen
- [ ] Agregar LanguageSelector a SettingsScreen
- [ ] Probar cambio de idioma en todas las pantallas

## 📞 Necesitas Ayuda?

Si necesitas traducir alguna pantalla específica o agregar más traducciones, solo pídelo y te ayudo! 🚀
