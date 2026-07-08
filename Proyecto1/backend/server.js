const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { clerkMiddleware, getAuth, clerkClient } = require('@clerk/express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3001', 'http://192.168.100.46:3001', 'http://127.0.0.1:3001'],
  credentials: true
}));
app.use(express.json());

// Middleware de Clerk
app.use(clerkMiddleware());

// Middleware para requerir autenticación
const requireClerkAuth = (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ mensaje: 'No autorizado' });
  }
  next();
};

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Conexión a Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getClerkUserDetails(userId) {
  const clerkUser = await clerkClient.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const firstName = clerkUser.firstName;
  const lastName = clerkUser.lastName;
  const nombre = firstName && lastName
    ? `${firstName} ${lastName}`
    : (firstName || email || 'Usuario');
  return { email, nombre };
}

async function syncUsuarioFromClerk(userId) {
  const { data: usuarioPorClerkId } = await supabase
    .from('usuarios')
    .select('*')
    .eq('clerk_id', userId)
    .single();

  if (usuarioPorClerkId) return usuarioPorClerkId;

  const { email, nombre } = await getClerkUserDetails(userId);

  if (email) {
    const { data: usuarioPorEmail } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (usuarioPorEmail) {
      const { data: usuarioActualizado, error: updateError } = await supabase
        .from('usuarios')
        .update({ clerk_id: userId })
        .eq('id', usuarioPorEmail.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return usuarioActualizado;
    }
  }

  const { data: newUser, error: insertError } = await supabase
    .from('usuarios')
    .insert([{
      clerk_id: userId,
      email,
      nombre,
      password_hash: 'clerk_managed'
    }])
    .select()
    .single();

  if (insertError) throw insertError;
  return newUser;
}

// Ruta raíz - servir frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

//mi endpoint de prueba
app.get('/api/saludo', (req, res) => {
  res.json('Hola mundo');
});

// Endpoint para probar conexión a Supabase
app.get('/api/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('count')
      .limit(1);
    
    if (error) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Error conectando a Supabase',
        error: error.message 
      });
    }
    
    res.json({ 
      status: 'success', 
      message: 'Conexión a Supabase exitosa',
      data: data 
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Error en la prueba de conexión',
      error: err.message 
    });
  }
});

// POST - Sincronizar usuario de Clerk con Supabase
app.post('/api/auth/sync', requireClerkAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { email, firstName, lastName } = req.body;
    
    // Verificar si el usuario ya existe en Supabase
    const { data: existingUser, error: checkError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('clerk_id', userId)
      .single();
    
    if (existingUser) {
      // Usuario ya existe, devolver datos
      return res.json({ 
        mensaje: 'Usuario ya sincronizado',
        usuario: { id: existingUser.id, email: existingUser.email, nombre: existingUser.nombre }
      });
    }
    
    // Crear nuevo usuario en Supabase
    const nombre = firstName && lastName ? `${firstName} ${lastName}` : (firstName || email || 'Usuario');
    
    const { data: newUser, error: insertError } = await supabase
      .from('usuarios')
      .insert([{ 
        clerk_id: userId,
        email: email || '',
        nombre: nombre,
        password_hash: 'clerk_managed'
      }])
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    res.status(201).json({ 
      mensaje: 'Usuario sincronizado exitosamente',
      usuario: { id: newUser.id, email: newUser.email, nombre: newUser.nombre }
    });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al sincronizar usuario', error: err.message });
  }
});

// GET - Obtener todos los eventos
app.get('/api/eventos', async (req, res) => {
  try {
    const { data: eventos, error } = await supabase
      .from('eventos')
      .select('*')
      .order('fecha', { ascending: true });
    
    if (error) throw error;
    
    // Obtener usuarios por separado
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, clerk_id');
    
    if (usuariosError) {
      console.error('Error al obtener usuarios:', usuariosError);
      // Continuar sin información de usuarios
    }
    
    // Crear mapa de usuarios por ID
    const usuariosMap = {};
    if (usuarios) {
      usuarios.forEach(usuario => {
        usuariosMap[usuario.id] = usuario;
      });
    }
    
    // Combinar eventos con información de usuarios
    const eventosConUsuarios = (eventos || []).map(evento => ({
      ...evento,
      usuarios: evento.usuario_id ? usuariosMap[evento.usuario_id] || null : null
    }));
    
    res.json(eventosConUsuarios || []);
  } catch (err) {
    console.error('Error al obtener eventos:', err);
    res.status(500).json({ mensaje: 'Error al obtener eventos' });
  }
});

// GET - Obtener un evento por ID
app.get('/api/eventos/:id', async (req, res) => {
  try {
    const { data: evento, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error || !evento) {
      return res.status(404).json({ mensaje: 'Evento no encontrado' });
    }
    
    res.json(evento);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener evento' });
  }
});

// POST - Crear nuevo evento
app.post('/api/eventos', requireClerkAuth, async (req, res) => {
  try {
    const { titulo, fecha, descripcion, latitud, longitud } = req.body;
    const { userId } = getAuth(req);
    
    console.log('Creando evento:', { titulo, fecha, userId });
    
    if (!titulo || !fecha) {
      return res.status(400).json({ mensaje: 'Título y fecha son requeridos' });
    }
    
    const usuario = await syncUsuarioFromClerk(userId);
    
    const eventoData = {
      titulo,
      fecha,
      descripcion: descripcion || '',
      usuario_id: usuario.id
    };
    
    // Agregar coordenadas si se proporcionan
    if (latitud !== undefined && longitud !== undefined) {
      eventoData.latitud = latitud;
      eventoData.longitud = longitud;
    }
    
    console.log('Datos del evento:', eventoData);
    
    const { data: eventoGuardado, error } = await supabase
      .from('eventos')
      .insert([eventoData])
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('Evento guardado:', eventoGuardado);
    res.status(201).json(eventoGuardado);
  } catch (err) {
    console.error('Error al crear evento:', err);
    res.status(500).json({ mensaje: 'Error al crear evento', error: err.message });
  }
});

// PUT - Actualizar evento
app.put('/api/eventos/:id', requireClerkAuth, async (req, res) => {
  try {
    const { titulo, fecha, descripcion, latitud, longitud } = req.body;
    const { userId } = getAuth(req);
    
    const usuario = await syncUsuarioFromClerk(userId);
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Usuario no encontrado' });
    }
    
    // Verificar que el usuario es el creador del evento
    const { data: evento, error: checkError } = await supabase
      .from('eventos')
      .select('usuario_id')
      .eq('id', req.params.id)
      .single();
    
    if (checkError || !evento) {
      return res.status(404).json({ mensaje: 'Evento no encontrado' });
    }
    
    if (evento.usuario_id !== usuario.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para modificar este evento' });
    }
    
    const updateData = { titulo, fecha, descripcion };
    
    // Agregar coordenadas si se proporcionan
    if (latitud !== undefined && longitud !== undefined) {
      updateData.latitud = latitud;
      updateData.longitud = longitud;
    }
    
    const { data: eventoActualizado, error } = await supabase
      .from('eventos')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !eventoActualizado) {
      return res.status(404).json({ mensaje: 'Evento no encontrado' });
    }
    
    res.json(eventoActualizado);
  } catch (err) {
    console.error('Error al actualizar evento:', err);
    res.status(500).json({ mensaje: 'Error al actualizar evento' });
  }
});

// DELETE - Eliminar evento
app.delete('/api/eventos/:id', requireClerkAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    
    const usuario = await syncUsuarioFromClerk(userId);
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Usuario no encontrado' });
    }
    
    // Verificar que el usuario es el creador del evento
    const { data: evento, error: checkError } = await supabase
      .from('eventos')
      .select('usuario_id')
      .eq('id', req.params.id)
      .single();
    
    if (checkError || !evento) {
      return res.status(404).json({ mensaje: 'Evento no encontrado' });
    }
    
    if (evento.usuario_id !== usuario.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar este evento' });
    }
    
    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('id', req.params.id);
    
    if (error) {
      return res.status(404).json({ mensaje: 'Evento no encontrado' });
    }
    
    res.json({ mensaje: 'Evento eliminado' });
  } catch (err) {
    console.error('Error al eliminar evento:', err);
    res.status(500).json({ mensaje: 'Error al eliminar evento' });
  }
});

// Catch-all para servir el frontend (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
