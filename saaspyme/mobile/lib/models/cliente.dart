class Cliente {
  const Cliente({
    required this.id,
    required this.nombre,
    required this.correo,
    required this.activo,
    this.empresa,
    this.rfc,
    this.telefono,
    this.direccion,
    this.notas,
    this.totalCotizado = 0,
    this.totalFacturado = 0,
    this.totalCobrado = 0,
    this.saldoPendiente = 0,
    this.cotizaciones = 0,
  });

  final String id;
  final String nombre;
  final String correo;
  final bool activo;
  final String? empresa;
  final String? rfc;
  final String? telefono;
  final String? direccion;
  final String? notas;
  final double totalCotizado;
  final double totalFacturado;
  final double totalCobrado;
  final double saldoPendiente;
  final int cotizaciones;

  factory Cliente.fromJson(Map<String, dynamic> json) {
    return Cliente(
      id: json['id'] as String,
      nombre: json['nombre'] as String,
      correo: json['correo'] as String,
      activo: json['activo'] as bool? ?? true,
      empresa: json['empresa'] as String?,
      rfc: json['rfc'] as String?,
      telefono: json['telefono'] as String?,
      direccion: json['direccion'] as String?,
      notas: json['notas'] as String?,
      totalCotizado: _toDouble(json['totalCotizado']),
      totalFacturado: _toDouble(json['totalFacturado']),
      totalCobrado: _toDouble(json['totalCobrado']),
      saldoPendiente: _toDouble(json['saldoPendiente']),
      cotizaciones: json['cotizaciones'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'nombre': nombre,
      'empresa': empresa ?? '',
      'rfc': rfc ?? '',
      'correo': correo,
      'telefono': telefono ?? '',
      'direccion': direccion ?? '',
      'notas': notas ?? '',
    };
  }

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}
