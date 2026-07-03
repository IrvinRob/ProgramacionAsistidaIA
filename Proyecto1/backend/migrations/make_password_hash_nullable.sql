-- Usuarios autenticados con Clerk no necesitan password_hash local
ALTER TABLE usuarios ALTER COLUMN password_hash DROP NOT NULL;
