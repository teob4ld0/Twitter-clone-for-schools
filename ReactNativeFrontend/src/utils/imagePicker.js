import * as ExpImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

// Re-export de expo-image-picker para compatibilidad
export const launchImageLibraryAsync = async (options = {}) => {
  // Solicitar permisos si es necesario
  const { status } = await ExpImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== 'granted') {
    console.warn('❌ Permisos de galería denegados');
    return { 
      canceled: true, 
      error: 'Se requieren permisos para acceder a la galería' 
    };
  }

  const pickerOptions = {
    mediaTypes: options.mediaTypes || ExpImagePicker.MediaTypeOptions.Images,
    allowsEditing: options.allowsEditing !== undefined ? options.allowsEditing : false,
    quality: options.quality || 0.8,
    allowsMultipleSelection: false,
  };

  try {
    const result = await ExpImagePicker.launchImageLibraryAsync(pickerOptions);
    
    // Normalizar el resultado para Android
    if (!result.canceled && result.assets && result.assets.length > 0) {
      result.assets = result.assets.map(asset => {
        const uri = asset.uri;
        let fileName = asset.fileName;
        let mimeType = asset.mimeType || asset.type;
        
        // Inferir el tipo si no viene en el asset
        if (!mimeType) {
          if (asset.type === 'video') {
            mimeType = 'video/mp4';
          } else if (uri.match(/\.(jpg|jpeg)$/i)) {
            mimeType = 'image/jpeg';
          } else if (uri.match(/\.png$/i)) {
            mimeType = 'image/png';
          } else if (uri.match(/\.gif$/i)) {
            mimeType = 'image/gif';
          } else {
            mimeType = 'image/jpeg'; // default
          }
        }
        
        // Generar fileName si no existe
        if (!fileName) {
          const extension = mimeType.split('/')[1] || 'jpg';
          fileName = `media_${Date.now()}.${extension}`;
        }
        
        console.log('📸 Asset normalizado:', { uri, fileName, mimeType, fileSize: asset.fileSize });
        
        return {
          ...asset,
          uri,
          fileName,
          mimeType,
        };
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error al abrir galería:', error);
    return { 
      canceled: true, 
      error: error.message 
    };
  }
};

// Función auxiliar para solicitar permisos explícitamente
export const requestMediaLibraryPermissionsAsync = async () => {
  try {
    const result = await ExpImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('🔐 Permisos de galería:', result.status);
    return result;
  } catch (error) {
    console.error('❌ Error al solicitar permisos:', error);
    return { status: 'denied' };
  }
};

export const MediaTypeOptions = ExpImagePicker.MediaTypeOptions;
