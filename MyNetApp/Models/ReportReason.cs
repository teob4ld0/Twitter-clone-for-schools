namespace MyNetApp.Models;

public enum ReportReason
{
    Violence = 1,          // Usuario reportó violencia
    Pornography = 2, // Usuario reportó pornografía
    Bullying = 3,     // Usuario reportó acoso
    Blackmail = 4,    // Usuario envió un mensaje/post extorsivo
    Stalking = 5,  // Usuario reporta que alguien acosó a otro usuario
    Abuse = 6,     // Usuario reportó abuso a otro usuario
    ScholarDamage = 7,      // Usuario hizo daños a las instalaciones de la escuela
    DrugUse = 8,        // Usuario hizo uso de drogas
    AlcoholUse = 9,     // Usuario hizo uso de alcohol
    SelfHarm = 10,      // Usuario reportó autolesiones
    Disrespect = 11     // Usuario reportó falta de respeto a las normas de la escuela
}
