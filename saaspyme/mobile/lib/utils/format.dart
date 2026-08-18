import 'dart:ui' show Color;

import 'package:intl/intl.dart';

final _currency = NumberFormat.currency(locale: 'es_MX', symbol: r'$');

String formatCurrency(num value) => _currency.format(value);

String formatEstado(String estado) {
  return switch (estado) {
    'BORRADOR' => 'Borrador',
    'ENVIADA' => 'Enviada',
    'APROBADA' => 'Aprobada',
    'RECHAZADA' => 'Rechazada',
    'FACTURADA' => 'Facturada',
    'PAGADA' => 'Pagada',
    _ => estado,
  };
}

Color estadoColor(String estado) {
  return switch (estado) {
    'BORRADOR' => const Color(0xFF64748B),
    'ENVIADA' => const Color(0xFF2563EB),
    'APROBADA' => const Color(0xFF059669),
    'RECHAZADA' => const Color(0xFFDC2626),
    'FACTURADA' => const Color(0xFF7C3AED),
    'PAGADA' => const Color(0xFF0D9488),
    _ => const Color(0xFF64748B),
  };
}
