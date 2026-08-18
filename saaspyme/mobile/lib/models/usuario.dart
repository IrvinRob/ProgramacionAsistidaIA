class Usuario {
  const Usuario({
    required this.id,
    required this.nombre,
    required this.correo,
    required this.rol,
    required this.activo,
    this.imageUrl,
  });

  final String id;
  final String nombre;
  final String correo;
  final String rol;
  final bool activo;
  final String? imageUrl;

  factory Usuario.fromJson(Map<String, dynamic> json) {
    return Usuario(
      id: json['id'] as String,
      nombre: json['nombre'] as String,
      correo: json['correo'] as String,
      rol: json['rol'] as String,
      activo: json['activo'] as bool? ?? true,
      imageUrl: json['imageUrl'] as String?,
    );
  }
}
