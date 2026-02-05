export default ({ config }) => {
  return {
    ...config,
    name: "MyNetApp",
    slug: "mynetapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: false, // Desactivada para estabilidad
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mynetapp",
      infoPlist: {
        NSPhotoLibraryUsageDescription: "Esta app necesita acceso a tu galería de fotos para que puedas compartir imágenes en tus publicaciones.",
        NSCameraUsageDescription: "Esta app necesita acceso a tu cámara para que puedas tomar fotos y compartirlas.",
        NSMicrophoneUsageDescription: "Esta app necesita acceso al micrófono para grabar videos."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.twittetec.mobile",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.RECORD_AUDIO",
        "android.permission.POST_NOTIFICATIONS"
      ],
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-font",
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#1DA1F2"
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "La app necesita acceso a tus fotos para compartir imágenes.",
          cameraPermission: "La app necesita acceso a tu cámara para tomar fotos.",
          mediaTypes: ["images", "videos"]
        }
      ]
    ],
    notification: {
      icon: "./assets/notification-icon.png",
      color: "#1DA1F2",
      androidMode: "default",
      androidCollapsedTitle: "{{unread_count}} nuevas notificaciones"
    },
    extra: {
      eas: {
        projectId: "6d6ac2a1-d015-4b02-b7e9-b050e4b13cdc"
      },
      apiUrl: process.env.API_URL || "https://io.twittetec.com/api"
    },
    owner: "tybalt_saez"
  };
};
