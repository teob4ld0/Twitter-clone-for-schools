-- Script para truncar usernames largos antes de aplicar el límite de 14 caracteres
UPDATE Users 
SET Username = SUBSTRING(Username, 1, 14)
WHERE LENGTH(Username) > 14;
