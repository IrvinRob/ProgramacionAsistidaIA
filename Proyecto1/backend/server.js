const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Conexión a Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API de Agenda Diaria',
    rutas_disponibles: {
      saludar: '/api/saludo',
      probar_supabase: '/api/test-supabase',
      eventos: '/api/eventos',
      auth: {
        registro: '/api/auth/register',
        login: '/api/auth/login'
      }
    }
  });
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

// POST - Registrar nuevo usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nombre } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Email y contraseña son requeridos' });
    }
    
    // Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from('usuarios')
      .select('email')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }
    
    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Crear usuario
    const { data: newUser, error: insertError } = await supabase
      .from('usuarios')
      .insert([{ email, password_hash: passwordHash, nombre: nombre || '' }])
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    res.status(201).json({ 
      mensaje: 'Usuario registrado exitosamente',
      usuario: { id: newUser.id, email: newUser.email, nombre: newUser.nombre }
    });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al registrar usuario', error: err.message });
  }
});

// POST - Login de usuario
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Email y contraseña son requeridos' });
    }
    
    // Buscar usuario por email
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }
    
    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }
    
    res.json({ 
      mensaje: 'Login exitoso',
      usuario: { id: user.id, email: user.email, nombre: user.nombre }
    });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error en el login', error: err.message });
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
    
    res.json(eventos || []);
  } catch (err) {
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
app.post('/api/eventos', async (req, res) => {
  try {
    const { titulo, fecha, descripcion } = req.body;
    
    if (!titulo || !fecha) {
      return res.status(400).json({ mensaje: 'Título y fecha son requeridos' });
    }
    
    const { data: eventoGuardado, error } = await supabase
      .from('eventos')
      .insert([{ titulo, fecha, descripcion: descripcion || '' }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(eventoGuardado);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear evento' });
  }
});

// PUT - Actualizar evento
app.put('/api/eventos/:id', async (req, res) => {
  try {
    const { titulo, fecha, descripcion } = req.body;
    
    const { data: eventoActualizado, error } = await supabase
      .from('eventos')
      .update({ titulo, fecha, descripcion })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !eventoActualizado) {
      return res.status(404).json({ mensaje: 'Evento no encontrado' });
    }
    
    res.json(eventoActualizado);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar evento' });
  }
});

// DELETE - Eliminar evento
app.delete('/api/eventos/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('id', req.params.id);
    
    if (error) {
      return res.status(404).json({ mensaje: 'Evento no encontrado' });
    }
    
    res.json({ mensaje: 'Evento eliminado' });
  } catch (err) {
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
