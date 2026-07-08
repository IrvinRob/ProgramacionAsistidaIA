-- Migración para agregar soporte de Clerk a la tabla usuarios
-- Ejecutar esto en el SQL Editor de Supabase

-- Agregar columna clerk_id a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;

-- Crear índice para búsquedas más rápidas por clerk_id
CREATE INDEX IF NOT EXISTS idx_usuarios_clerk_id ON usuarios(clerk_id);

-- Opcional: Migrar usuarios existentes si es necesario
-- Esto es solo si quieres mantener compatibilidad con usuarios antiguos
-- Descomenta las siguientes líneas si necesitas migrar datos:

-- UPDATE usuarios 
-- SET clerk_id = 'legacy_' || id::text 
-- WHERE clerk_id IS NULL;

-- Nota: Los usuarios creados con Clerk tendrán su clerk_id automáticamente
-- Los usuarios antiguos (creados con el sistema anterior) no podrán usar Clerk
-- a menos que se migren manualmente o se cree un sistema de vinculación
