import * as ExpImagePicker from 'expo-image-picker';

// Re-export de expo-image-picker para compatibilidad
export const launchImageLibraryAsync = async (options = {}) => {
  // Solicitar permisos si es necesario
  const { status } = await ExpImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== 'granted') {
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
    return result;
  } catch (error) {
    return { 
      canceled: true, 
      error: error.message 
    };
  }
};

export const MediaTypeOptions = ExpImagePicker.MediaTypeOptions;
