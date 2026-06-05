# Agenda Diaria - App Sencilla

Aplicación de agenda diaria con backend en Node.js y frontend en JavaScript plano.

## Estructura del proyecto

```
Proyecto1/
├── backend/
│   ├── package.json
│   └── server.js
└── frontend/
    ├── index.html
    └── app.js
```

## Instalación y ejecución

### Backend

1. Navegar a la carpeta backend:
```bash
cd backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar el servidor:
```bash
npm start
```

El backend se ejecutará en `http://localhost:3000`

### Frontend

1. Abrir el archivo `frontend/index.html` en un navegador web

O usar un servidor local (opcional):
```bash
cd frontend
npx serve
```

## Funcionalidades

- **Crear eventos**: Agregar nuevos eventos con título, fecha y descripción
- **Ver eventos**: Listar todos los eventos almacenados
- **Eliminar eventos**: Borrar eventos de la agenda

## API Endpoints

- `GET /api/eventos` - Obtener todos los eventos
- `GET /api/eventos/:id` - Obtener un evento por ID
- `POST /api/eventos` - Crear nuevo evento
- `PUT /api/eventos/:id` - Actualizar evento
- `DELETE /api/eventos/:id` - Eliminar evento

## Notas

- Los datos se almacenan en memoria (se pierden al reiniciar el servidor)
- No se utiliza base de datos
- Código minimalista y fácil de leer
- Estilo con Tailwind CSS
