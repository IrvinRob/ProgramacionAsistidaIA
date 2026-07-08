# Configuración de Clerk para Autenticación

## Pasos para configurar Clerk

### 1. Crear cuenta en Clerk
1. Ve a [https://clerk.com](https://clerk.com) y crea una cuenta
2. Crea una nueva aplicación en el dashboard de Clerk

### 2. Obtener las claves de Clerk
1. En el dashboard de Clerk, ve a "API Keys"
2. Copia las siguientes claves:
   - **Publishable Key**: `pk_test_...` o `pk_live_...`
   - **Secret Key**: `sk_test_...` o `sk_live_...`

### 3. Configurar el proyecto

#### Backend (.env)
Agrega las siguientes variables a tu archivo `.env` en el backend:

```env
CLERK_SECRET_KEY=sk_test_tu_clerk_secret_key_aqui
CLERK_PUBLISHABLE_KEY=pk_test_tu_clerk_publishable_key_aqui
```

#### Frontend (index.html)
Reemplaza la clave en `frontend/index.html`:

```html
data-clerk-publishable-key="pk_test_YOUR_CLERK_PUBLISHABLE_KEY_HERE"
```

Por la clave publishable que obtuviste de Clerk.

### 4. Configurar proveedores de autenticación en Clerk

En el dashboard de Clerk:
1. Ve a "User & Authentication" > "Social Connections"
2. Habilita **Google**:
   - Haz clic en "Add" > "Google"
   - Sigue las instrucciones para configurar OAuth con Google
3. Asegúrate de que **Email/Password** esté habilitado (viene por defecto)

### 5. Actualizar el esquema de la base de datos

Necesitas agregar el campo `clerk_id` a la tabla `usuarios` en Supabase:

```sql
-- Agregar columna clerk_id a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN clerk_id TEXT UNIQUE;

-- Crear índice para búsquedas más rápidas
CREATE INDEX idx_usuarios_clerk_id ON usuarios(clerk_id);
```

### 6. Probar la configuración

1. Reinicia el servidor backend:
```bash
cd backend
npm run dev
```

2. Abre tu aplicación en el navegador
3. Deberías ver el formulario de login de Clerk
4. Prueba iniciar sesión con:
   - Email y contraseña
   - Google OAuth

## Cómo funciona la integración

### Frontend
- Usa Clerk SDK para manejar la autenticación
- El formulario de login es proporcionado por Clerk
- Los tokens de sesión se envían en el header `Authorization: Bearer <token>`

### Backend
- Usa `ClerkExpressRequireAuth` para validar tokens en endpoints protegidos
- Sincroniza automáticamente usuarios de Clerk con Supabase
- Usa `clerk_id` para relacionar usuarios de Clerk con usuarios locales

### Flujo de autenticación
1. Usuario se autentica con Clerk (email/password o Google)
2. Frontend obtiene el token de sesión de Clerk
3. Frontend envía el token en las requests al backend
4. Backend valida el token con Clerk SDK
5. Backend sincroniza el usuario con Supabase si no existe
6. Backend procesa la request con el usuario autenticado

## Solución de problemas

### Error: "No autorizado"
- Verifica que `CLERK_SECRET_KEY` esté configurada correctamente en .env
- Verifica que el token se esté enviando en el header `Authorization`

### Error: "Usuario no encontrado"
- Verifica que la tabla `usuarios` tenga la columna `clerk_id`
- Verifica que el usuario se esté sincronizando correctamente

### Google OAuth no funciona
- Verifica que Google OAuth esté configurado correctamente en el dashboard de Clerk
- Verifica que los redirect URLs estén configurados correctamente
