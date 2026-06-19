const API_URL = '/api/eventos';
const AUTH_URL = '/api/auth';

// Variables globales para el mapa
let map;
let marker;

// Verificar sesión al iniciar
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});

// Inicializar mapa cuando se muestra el formulario de evento
function initMap() {
  if (map) return; // Ya está inicializado

  // Centro histórico de Chihuahua: 28.6353, -106.0889
  const chihuahuaCenter = [28.6353, -106.0889];

  map = L.map('map').setView(chihuahuaCenter, 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Evento de clic en el mapa
  map.on('click', function(e) {
    const { lat, lng } = e.latlng;

    // Remover marcador anterior si existe
    if (marker) {
      map.removeLayer(marker);
    }

    // Agregar nuevo marcador
    marker = L.marker([lat, lng]).addTo(map);

    // Guardar coordenadas en los campos ocultos
    document.getElementById('latitud').value = lat;
    document.getElementById('longitud').value = lng;
  });
}

// Funciones de UI para autenticación
function showLoginForm() {
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
}

function showRegisterForm() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.remove('hidden');
}

function showAuthenticatedUI(usuario) {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.add('hidden');
  document.getElementById('userSection').classList.remove('hidden');
  document.getElementById('userName').textContent = usuario.nombre || usuario.email;
  document.getElementById('eventFormSection').classList.remove('hidden');
  document.getElementById('eventListSection').classList.remove('hidden');
  
  // Inicializar mapa después de mostrar el formulario
  setTimeout(initMap, 100);
}

function showUnauthenticatedUI() {
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
  document.getElementById('userSection').classList.add('hidden');
  document.getElementById('eventFormSection').classList.add('hidden');
  document.getElementById('eventListSection').classList.add('hidden');
}

// Manejar formulario de login
document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      showAuthenticatedUI(data.usuario);
      cargarEventos();
      document.getElementById('loginFormElement').reset();
    } else {
      alert(data.mensaje || 'Error en el login');
    }
  } catch (error) {
    console.error('Error en el login:', error);
    alert('Error al conectar con el servidor');
  }
});

// Manejar formulario de registro
document.getElementById('registerFormElement').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nombre = document.getElementById('registerNombre').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  
  try {
    const response = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nombre, email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Usuario registrado exitosamente. Por favor inicia sesión.');
      showLoginForm();
      document.getElementById('registerFormElement').reset();
    } else {
      alert(data.mensaje || 'Error en el registro');
    }
  } catch (error) {
    console.error('Error en el registro:', error);
    alert('Error al conectar con el servidor');
  }
});

// Cerrar sesión
function logout() {
  localStorage.removeItem('usuario');
  showUnauthenticatedUI();
  document.getElementById('eventosList').innerHTML = '<p class="text-gray-500 text-center py-4">No hay eventos aún</p>';
}

// Verificar sesión existente
function checkSession() {
  const usuario = localStorage.getItem('usuario');
  if (usuario) {
    showAuthenticatedUI(JSON.parse(usuario));
    cargarEventos();
  } else {
    showUnauthenticatedUI();
  }
}

// Manejar formulario
document.getElementById('eventoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const titulo = document.getElementById('titulo').value;
  const fecha = document.getElementById('fecha').value;
  const descripcion = document.getElementById('descripcion').value;
  const latitud = document.getElementById('latitud').value;
  const longitud = document.getElementById('longitud').value;
  
  const eventData = { titulo, fecha, descripcion };
  
  // Solo agregar coordenadas si se seleccionaron
  if (latitud && longitud) {
    eventData.latitud = parseFloat(latitud);
    eventData.longitud = parseFloat(longitud);
  }
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });
    
    if (response.ok) {
      document.getElementById('eventoForm').reset();
      // Limpiar marcador del mapa
      if (marker) {
        map.removeLayer(marker);
        marker = null;
      }
      document.getElementById('latitud').value = '';
      document.getElementById('longitud').value = '';
      cargarEventos();
    }
  } catch (error) {
    console.error('Error al crear evento:', error);
  }
});

// Cargar eventos desde el backend
async function cargarEventos() {
  try {
    const response = await fetch(API_URL);
    const eventos = await response.json();
    mostrarEventos(eventos);
  } catch (error) {
    console.error('Error al cargar eventos:', error);
  }
}

// Mostrar eventos en el DOM
function mostrarEventos(eventos) {
  const lista = document.getElementById('eventosList');
  
  if (eventos.length === 0) {
    lista.innerHTML = '<p class="text-gray-500 text-center py-4">No hay eventos aún</p>';
    return;
  }
  
  lista.innerHTML = eventos.map(evento => `
    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="font-semibold text-gray-800">${evento.titulo}</h3>
          <p class="text-sm text-gray-500">📅 ${evento.fecha}</p>
          ${evento.descripcion ? `<p class="text-sm text-gray-600 mt-2">${evento.descripcion}</p>` : ''}
          ${evento.latitud && evento.longitud ? `
            <p class="text-sm text-gray-600 mt-2">
              📍 <a href="https://www.google.com/maps?q=${evento.latitud},${evento.longitud}" target="_blank" class="text-blue-500 hover:text-blue-700">
                Ver ubicación en mapa
              </a>
            </p>
          ` : ''}
        </div>
        <div class="flex gap-2 ml-4">
          <button 
            onclick="eliminarEvento('${evento.id}')"
            class="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Eliminar evento
async function eliminarEvento(id) {
  if (!confirm('¿Estás seguro de eliminar este evento?')) return;
  
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      cargarEventos();
    }
  } catch (error) {
    console.error('Error al eliminar evento:', error);
  }
}
