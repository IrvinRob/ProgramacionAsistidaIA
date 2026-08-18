class CotizacionResumen {
  const CotizacionResumen({
    required this.id,
    required this.numero,
    required this.estado,
    required this.total,
    required this.clienteNombre,
    this.clienteId,
    this.fecha,
    this.vencimiento,
    this.subtotal = 0,
    this.iva = 0,
    this.pagado = 0,
    this.saldo = 0,
    this.conceptos = 0,
    this.clienteEmpresa,
  });

  final String id;
  final String numero;
  final String estado;
  final double total;
  final String clienteNombre;
  final String? clienteId;
  final String? fecha;
  final String? vencimiento;
  final double subtotal;
  final double iva;
  final double pagado;
  final double saldo;
  final int conceptos;
  final String? clienteEmpresa;

  factory CotizacionResumen.fromJson(Map<String, dynamic> json) {
    final cliente = json['cliente'] as Map<String, dynamic>?;

    return CotizacionResumen(
      id: json['id'] as String,
      numero: json['numero'] as String,
      estado: json['estado'] as String,
      total: _toDouble(json['total']),
      clienteNombre: cliente?['nombre'] as String? ?? '',
      clienteId: cliente?['id'] as String?,
      fecha: json['fecha'] as String?,
      vencimiento: json['vencimiento'] as String?,
      subtotal: _toDouble(json['subtotal']),
      iva: _toDouble(json['iva']),
      pagado: _toDouble(json['pagado']),
      saldo: _toDouble(json['saldo']),
      conceptos: json['conceptos'] is int
          ? json['conceptos'] as int
          : (json['conceptos'] as List?)?.length ?? 0,
      clienteEmpresa: cliente?['empresa'] as String?,
    );
  }

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}

class Concepto {
  const Concepto({
    required this.id,
    required this.descripcion,
    required this.cantidad,
    required this.precioUnitario,
    required this.subtotal,
  });

  final String id;
  final String descripcion;
  final double cantidad;
  final double precioUnitario;
  final double subtotal;

  factory Concepto.fromJson(Map<String, dynamic> json) {
    return Concepto(
      id: json['id'] as String,
      descripcion: json['descripcion'] as String,
      cantidad: _toDouble(json['cantidad']),
      precioUnitario: _toDouble(json['precioUnitario']),
      subtotal: _toDouble(json['subtotal']),
    );
  }

  static double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}

class Pago {
  const Pago({
    required this.id,
    required this.fecha,
    required this.monto,
    required this.metodo,
    this.referencia,
  });

  final String id;
  final String fecha;
  final double monto;
  final String metodo;
  final String? referencia;

  factory Pago.fromJson(Map<String, dynamic> json) {
    return Pago(
      id: json['id'] as String,
      fecha: json['fecha'] as String,
      monto: _toDouble(json['monto']),
      metodo: json['metodo'] as String,
      referencia: json['referencia'] as String?,
    );
  }

  static double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}

class CotizacionDetalle extends CotizacionResumen {
  const CotizacionDetalle({
    required super.id,
    required super.numero,
    required super.estado,
    required super.total,
    required super.clienteNombre,
    super.clienteId,
    super.fecha,
    super.vencimiento,
    super.subtotal,
    super.iva,
    super.pagado,
    super.saldo,
    super.clienteEmpresa,
    this.notas,
    this.conceptosList = const [],
    this.pagosList = const [],
  }) : super(conceptos: 0);

  final String? notas;
  final List<Concepto> conceptosList;
  final List<Pago> pagosList;

  factory CotizacionDetalle.fromJson(Map<String, dynamic> json) {
    final resumen = CotizacionResumen.fromJson(json);

    return CotizacionDetalle(
      id: resumen.id,
      numero: resumen.numero,
      estado: resumen.estado,
      total: resumen.total,
      clienteNombre: resumen.clienteNombre,
      clienteId: resumen.clienteId,
      fecha: resumen.fecha,
      vencimiento: resumen.vencimiento,
      subtotal: resumen.subtotal,
      iva: resumen.iva,
      pagado: resumen.pagado,
      saldo: resumen.saldo,
      clienteEmpresa: resumen.clienteEmpresa,
      notas: json['notas'] as String?,
      conceptosList: (json['conceptos'] as List<dynamic>? ?? [])
          .map((item) => Concepto.fromJson(item as Map<String, dynamic>))
          .toList(),
      pagosList: (json['pagos'] as List<dynamic>? ?? [])
          .map((item) => Pago.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class CobranzaItem {
  const CobranzaItem({
    required this.id,
    required this.numero,
    required this.estado,
    required this.fecha,
    required this.total,
    required this.pagado,
    required this.pendiente,
    required this.dias,
    required this.clienteNombre,
    this.clienteEmpresa,
    this.clienteCorreo,
    this.pagos = const [],
  });

  final String id;
  final String numero;
  final String estado;
  final String fecha;
  final double total;
  final double pagado;
  final double pendiente;
  final int dias;
  final String clienteNombre;
  final String? clienteEmpresa;
  final String? clienteCorreo;
  final List<Pago> pagos;

  factory CobranzaItem.fromJson(Map<String, dynamic> json) {
    final cliente = json['cliente'] as Map<String, dynamic>?;

    return CobranzaItem(
      id: json['id'] as String,
      numero: json['numero'] as String,
      estado: json['estado'] as String,
      fecha: json['fecha'] as String,
      total: _toDouble(json['total']),
      pagado: _toDouble(json['pagado']),
      pendiente: _toDouble(json['pendiente']),
      dias: json['dias'] as int? ?? 0,
      clienteNombre: cliente?['nombre'] as String? ?? '',
      clienteEmpresa: cliente?['empresa'] as String?,
      clienteCorreo: cliente?['correo'] as String?,
      pagos: (json['pagos'] as List<dynamic>? ?? [])
          .map((item) => Pago.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  static double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}

class DashboardData {
  const DashboardData({
    required this.totalVentas,
    required this.totalFacturadoMes,
    required this.totalCobrado,
    required this.carteraPendiente,
    required this.ultimasCots,
    required this.topClientesPendiente,
    required this.cotsPorEstado,
  });

  final double totalVentas;
  final double totalFacturadoMes;
  final double totalCobrado;
  final double carteraPendiente;
  final List<CotizacionResumen> ultimasCots;
  final List<Map<String, dynamic>> topClientesPendiente;
  final List<Map<String, dynamic>> cotsPorEstado;

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    final kpis = json['kpis'] as Map<String, dynamic>;

    return DashboardData(
      totalVentas: _toDouble(kpis['totalVentas']),
      totalFacturadoMes: _toDouble(kpis['totalFacturadoMes']),
      totalCobrado: _toDouble(kpis['totalCobrado']),
      carteraPendiente: _toDouble(kpis['carteraPendiente']),
      ultimasCots: (json['ultimasCots'] as List<dynamic>? ?? [])
          .map((item) => CotizacionResumen.fromJson(item as Map<String, dynamic>))
          .toList(),
      topClientesPendiente: (json['topClientesPendiente'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>(),
      cotsPorEstado: (json['cotsPorEstado'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>(),
    );
  }

  static double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}
