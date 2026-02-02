using WebPush;

Console.WriteLine("===========================================");
Console.WriteLine("  VAPID Key Generator for Web Push");
Console.WriteLine("===========================================\n");

var keys = VapidHelper.GenerateVapidKeys();

Console.WriteLine("✅ VAPID Keys generadas exitosamente!\n");
Console.WriteLine("Copia estas keys en tu appsettings.json:\n");
Console.WriteLine("\"VapidKeys\": {");
Console.WriteLine($"  \"PublicKey\": \"{keys.PublicKey}\",");
Console.WriteLine($"  \"PrivateKey\": \"{keys.PrivateKey}\",");
Console.WriteLine("  \"Subject\": \"mailto:admin@twittetec.com\"");
Console.WriteLine("}");
Console.WriteLine("\n===========================================");
Console.WriteLine("⚠️  IMPORTANTE:");
Console.WriteLine("  - Guarda estas keys de forma segura");
Console.WriteLine("  - NO las compartas públicamente");
Console.WriteLine("  - PrivateKey debe permanecer en el servidor");
Console.WriteLine("  - PublicKey se enviará al frontend");
Console.WriteLine("===========================================\n");
