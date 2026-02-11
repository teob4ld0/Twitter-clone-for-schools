import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function PrivacyPolicyScreen({ navigation }) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingTop: 50,
      paddingBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.textOnPrimary,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    lastUpdated: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 20,
    },
    hr: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
    subSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginTop: 16,
      marginBottom: 8,
    },
    paragraph: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 22,
      marginBottom: 12,
    },
    listItem: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 24,
      paddingLeft: 12,
      marginBottom: 4,
    },
    bold: {
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    footer: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
  });

  const B = ({ children }) => <Text style={styles.bold}>{children}</Text>;
  const P = ({ children }) => <Text style={styles.paragraph}>{children}</Text>;
  const Li = ({ children }) => <Text style={styles.listItem}>• {children}</Text>;
  const Hr = () => <View style={styles.hr} />;
  const H2 = ({ children }) => <Text style={styles.sectionTitle}>{children}</Text>;
  const H3 = ({ children }) => <Text style={styles.subSectionTitle}>{children}</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Política de Privacidad</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.lastUpdated}>
          <B>Última actualización:</B> 10 de febrero de 2026
        </Text>

        <Hr />

        <H2>1. Introducción</H2>
        <P>
          Bienvenido a <B>Twittetec</B>, una red social diseñada para escuelas. Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos tu información personal cuando usas nuestra aplicación.
        </P>
        <P>
          Al usar Twittetec, aceptas las prácticas descritas en esta política. Si no estás de acuerdo con alguna parte de esta política, por favor no uses la aplicación.
        </P>

        <Hr />

        <H2>2. Información que Recopilamos</H2>

        <H3>2.1 Información de la Cuenta</H3>
        <Li><B>Nombre de usuario</B> (máximo 25 caracteres)</Li>
        <Li><B>Dirección de email</B> (verificada)</Li>
        <Li><B>Contraseña</B> (almacenada cifrada como hash)</Li>
        <Li><B>Fecha de creación de la cuenta</B></Li>
        <Li><B>Foto de perfil</B> (opcional, URL pública)</Li>
        <Li><B>Estado de verificación de email</B></Li>
        <Li><B>Estado de la cuenta</B> (activa/baneada)</Li>

        <H3>2.2 Contenido Generado por el Usuario</H3>
        <Li><B>Publicaciones (Statuses):</B> Texto, imágenes y videos que compartes</Li>
        <Li><B>Respuestas y comentarios</B> a publicaciones de otros usuarios</Li>
        <Li><B>Likes</B> en publicaciones</Li>
        <Li><B>Reposts</B> de contenido de otros usuarios</Li>
        <Li><B>Mensajes directos</B> enviados a través del chat</Li>

        <H3>2.3 Datos de Interacción Social</H3>
        <Li><B>Seguidores y seguidos:</B> Lista de usuarios que sigues y que te siguen</Li>
        <Li><B>Seguidores mutuos</B></Li>
        <Li><B>Interacciones con perfiles</B> (visitas a perfiles)</Li>
        <Li><B>Señales de interés:</B> Registros de actividad como abrir perfiles, interacciones con publicaciones</Li>

        <H3>2.4 Datos de Uso y Analítica</H3>
        <Li><B>Marcas de tiempo</B> de actividades (creación de publicaciones, mensajes, etc.)</Li>
        <Li><B>Patrones de uso de la app</B></Li>
        <Li><B>Historial de interacción con contenido</B></Li>

        <H3>2.5 Autenticación con Google OAuth (Opcional)</H3>
        <P>Si eliges iniciar sesión con Google, recopilamos:</P>
        <Li>Tu dirección de email de Google</Li>
        <Li>Tu nombre de usuario de Google</Li>
        <Li>Tu ID de Google</Li>

        <H3>2.6 Notificaciones Push (Opcional)</H3>
        <Li><B>Tokens de dispositivo</B> para enviar notificaciones vía Firebase Cloud Messaging (FCM)</Li>

        <Hr />

        <H2>3. Cómo Usamos tu Información</H2>

        <H3>3.1 Funcionalidad de la Aplicación</H3>
        <Li>Crear y administrar tu cuenta</Li>
        <Li>Permitir la publicación de contenido (texto, imágenes, videos)</Li>
        <Li>Facilitar la comunicación con otros usuarios (chats, respuestas)</Li>
        <Li>Administrar relaciones sociales (seguir/dejar de seguir usuarios)</Li>
        <Li>Mostrar tu perfil a otros usuarios</Li>

        <H3>3.2 Personalización de la Experiencia</H3>
        <Li>Mostrar un feed personalizado basado en tus intereses y seguidos</Li>
        <Li>Recomendar usuarios y contenido relevante</Li>
        <Li>Mejorar algoritmos de visualización de contenido</Li>

        <H3>3.3 Comunicación</H3>
        <Li>Enviar notificaciones sobre interacciones (likes, comentarios, nuevos seguidores)</Li>
        <Li>Enviar notificaciones de mensajes directos</Li>
        <Li>Verificar tu dirección de email</Li>

        <H3>3.4 Seguridad y Moderación</H3>
        <Li>Prevenir abuso y comportamiento inapropiado</Li>
        <Li>Hacer cumplir nuestros Términos de Servicio</Li>
        <Li>Banear cuentas que violen nuestras políticas</Li>

        <H3>3.5 Mejora del Servicio</H3>
        <Li>Analizar patrones de uso para mejorar la aplicación</Li>
        <Li>Registrar señales de interés para optimizar la experiencia de usuario</Li>
        <Li>Corregir errores y resolver problemas técnicos</Li>

        <Hr />

        <H2>4. Compartir tu Información</H2>

        <H3>4.1 Información Pública</H3>
        <P>La siguiente información es <B>pública</B> y visible para todos los usuarios de la app:</P>
        <Li>Tu nombre de usuario</Li>
        <Li>Tu foto de perfil</Li>
        <Li>Tus publicaciones (a menos que sean respuestas privadas)</Li>
        <Li>Tus listas de seguidores y seguidos</Li>
        <Li>Tus likes y reposts</Li>
        <Li>Conteos de publicaciones, seguidores y seguidos</Li>

        <H3>4.2 Información Privada</H3>
        <P>Los siguientes datos son <B>privados</B> y no se comparten:</P>
        <Li>Tu dirección de email</Li>
        <Li>Tu contraseña (almacenada como hash cifrado)</Li>
        <Li>Tus mensajes directos (solo visibles para ti y el destinatario)</Li>
        <Li>Tokens de autenticación</Li>

        <H3>4.3 Terceros</H3>
        <P>No vendemos ni compartimos tu información personal con terceros con fines de marketing.</P>
        <P>Compartimos información con proveedores de servicios:</P>
        <Li><B>Google Cloud Storage:</B> Para almacenar imágenes y videos (con URLs públicas)</Li>
        <Li><B>Google OAuth:</B> Si inicias sesión con Google</Li>
        <Li><B>Firebase Cloud Messaging:</B> Para enviar notificaciones push</Li>

        <Hr />

        <H2>5. Almacenamiento y Seguridad de Datos</H2>

        <H3>5.1 Ubicación de Datos</H3>
        <Li>Los datos se almacenan en una <B>base de datos MySQL</B></Li>
        <Li>Las imágenes y videos se almacenan en <B>Google Cloud Storage</B> o localmente en el servidor</Li>
        <Li>Los datos de autenticación están protegidos con <B>tokens JWT</B></Li>

        <H3>5.2 Medidas de Seguridad</H3>
        <Li>Las contraseñas se almacenan con <B>hash criptográfico</B> (nunca en texto plano)</Li>
        <Li>Las comunicaciones están protegidas vía <B>HTTPS</B></Li>
        <Li>Tokens de autenticación con <B>expiración automática</B></Li>
        <Li>Verificación obligatoria de email</Li>

        <H3>5.3 Retención de Datos</H3>
        <Li>Mantenemos tus datos mientras tu cuenta esté activa</Li>
        <Li>Si eliminas tu cuenta, tus datos personales serán eliminados (ver sección 7)</Li>
        <Li>Las publicaciones públicas pueden permanecer almacenadas por razones de archivo o legales</Li>

        <Hr />

        <H2>6. Tus Derechos</H2>

        <H3>6.1 Acceso y Actualización</H3>
        <Li>Ver y editar tu perfil (nombre de usuario, foto de perfil)</Li>
        <Li>Ver tu historial de publicaciones, likes y reposts</Li>
        <Li>Actualizar tu foto de perfil</Li>

        <H3>6.2 Eliminación de Contenido</H3>
        <Li>Eliminar tus publicaciones</Li>
        <Li>Eliminar mensajes directos</Li>
        <Li>Dejar de seguir usuarios</Li>

        <H3>6.3 Control de Privacidad</H3>
        <Li>Controlar quién puede seguirte (aceptando o rechazando solicitudes)</Li>
        <Li>Bloquear usuarios (próximamente)</Li>

        <Hr />

        <H2>7. Eliminación de Cuenta</H2>
        <P>Puedes solicitar la eliminación de tu cuenta contactándonos a través de:</P>
        <Li><B>Email de contacto:</B> support@twittetec.app</Li>
        <Li><B>Formulario de contacto:</B> https://twittetec.app/contact</Li>
        <Li><B>Sitio web:</B> https://twittetec.app</Li>
        <P>Cuando eliminas tu cuenta:</P>
        <Li>Tu perfil dejará de ser visible</Li>
        <Li>Tus datos personales (email, contraseña) serán eliminados</Li>
        <Li>Tus publicaciones pueden ser anonimizadas o eliminadas según tu solicitud</Li>
        <Li>Los mensajes directos serán eliminados</Li>
        <P>El proceso de eliminación puede tardar hasta <B>30 días</B>.</P>

        <Hr />

        <H2>8. Uso por Menores</H2>
        <P>
          Twittetec está diseñado para uso en entornos escolares. Si eres menor de 13 años, necesitas el consentimiento de un padre o tutor para usar la aplicación.
        </P>
        <P>
          Si eres padre/tutor y descubres que tu hijo ha proporcionado información sin tu consentimiento, contáctanos para eliminar dicha información.
        </P>

        <Hr />

        <H2>9. Cambios a esta Política de Privacidad</H2>
        <P>Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos de cambios significativos a través de:</P>
        <Li>Una notificación en la aplicación</Li>
        <Li>Un email a tu cuenta registrada</Li>
        <P>
          La fecha de "Última actualización" al inicio de esta política indica cuándo se realizó el último cambio.
        </P>

        <Hr />

        <H2>10. Contacto</H2>
        <P>Si tienes preguntas sobre esta Política de Privacidad o cómo manejamos tus datos, contáctanos:</P>
        <Li><B>Email:</B> support@twittetec.app</Li>
        <Li><B>Sitio web de contacto:</B> https://twittetec.app/contact</Li>
        <Li><B>Soporte:</B> Disponible a través de la configuración de la app</Li>

        <Hr />

        <H2>11. Cumplimiento Legal</H2>
        <P>
          Nos reservamos el derecho de divulgar tu información personal si la ley lo requiere o si creemos de buena fe que tal acción es necesaria para:
        </P>
        <Li>Cumplir con obligaciones legales</Li>
        <Li>Proteger y defender nuestros derechos o propiedad</Li>
        <Li>Prevenir fraude o abuso de la plataforma</Li>
        <Li>Proteger la seguridad de los usuarios</Li>

        <Hr />

        <H2>12. Tecnologías que Usamos</H2>

        <H3>12.1 Cookies y Almacenamiento Local</H3>
        <Li>Usamos <B>AsyncStorage</B> para guardar preferencias del usuario (tema claro/oscuro)</Li>
        <Li>Los tokens de autenticación se guardan localmente en el dispositivo</Li>

        <H3>12.2 Servicios de Terceros</H3>
        <Li><B>Google OAuth:</B> Para autenticación opcional con Google</Li>
        <Li><B>Google Cloud Storage:</B> Para almacenamiento de medios</Li>
        <Li><B>Firebase Cloud Messaging (FCM):</B> Para notificaciones push</Li>
        <Li><B>SignalR:</B> Para comunicación en tiempo real (chats, notificaciones)</Li>

        <Hr />

        <H2>13. Transferencias Internacionales de Datos</H2>
        <P>
          Tus datos pueden ser transferidos y almacenados en servidores ubicados fuera de tu país de residencia. Al usar Twittetec, consientes estas transferencias.
        </P>
        <P>
          Tomamos medidas para asegurar que tus datos sean tratados de manera segura y de acuerdo con esta Política de Privacidad, sin importar dónde se procesen.
        </P>

        <Hr />

        <H2>14. Seguridad de Datos</H2>
        <P>
          Implementamos medidas técnicas y organizacionales apropiadas para proteger tu información personal, incluyendo:
        </P>
        <Li>Cifrado de datos sensibles</Li>
        <Li>Mecanismos de autenticación seguros (tokens JWT)</Li>
        <Li>Evaluaciones regulares de seguridad</Li>
        <Li>Controles de acceso y monitoreo</Li>
        <P>
          Sin embargo, ningún método de transmisión por internet o almacenamiento electrónico es 100% seguro. Aunque nos esforzamos por proteger tus datos, no podemos garantizar seguridad absoluta.
        </P>

        <Hr />

        <H2>15. Tus Opciones</H2>
        <P>Puedes:</P>
        <Li><B>Desactivar notificaciones:</B> Deshabilitar las notificaciones push en la configuración de tu dispositivo</Li>
        <Li><B>Limitar la recopilación de datos:</B> Elegir no usar funciones opcionales como Google OAuth</Li>
        <Li><B>Controlar tu contenido:</B> Eliminar publicaciones, mensajes y medios en cualquier momento</Li>
        <Li><B>Administrar tu perfil:</B> Actualizar o eliminar tu foto de perfil</Li>

        <Hr />

        <Text style={styles.footer}>© 2026 Twittetec. Todos los derechos reservados.</Text>
      </ScrollView>
    </View>
  );
}
