import 'package:flutter/material.dart';
import 'package:gestorpyme_mobile/models/models.dart';
import 'package:gestorpyme_mobile/services/api_service.dart';
import 'package:gestorpyme_mobile/utils/format.dart';
import 'package:gestorpyme_mobile/widgets/common_views.dart';
import 'package:gestorpyme_mobile/widgets/estado_chip.dart';

class CotizacionDetailScreen extends StatefulWidget {
  const CotizacionDetailScreen({
    super.key,
    required this.api,
    required this.cotizacionId,
  });

  final ApiService api;
  final String cotizacionId;

  @override
  State<CotizacionDetailScreen> createState() => _CotizacionDetailScreenState();
}

class _CotizacionDetailScreenState extends State<CotizacionDetailScreen> {
  CotizacionDetalle? cotizacion;
  String? error;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });

    try {
      final result = await widget.api.fetchCotizacion(widget.cotizacionId);
      if (!mounted) return;
      setState(() {
        cotizacion = result;
        loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        error = e.message;
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detalle de cotización')),
      body: loading
          ? const LoadingView()
          : error != null
              ? ErrorView(message: error!, onRetry: _load)
              : _buildContent(cotizacion!),
    );
  }

  Widget _buildContent(CotizacionDetalle cot) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Expanded(
              child: Text(cot.numero, style: Theme.of(context).textTheme.headlineSmall),
            ),
            EstadoChip(estado: cot.estado),
          ],
        ),
        const SizedBox(height: 8),
        Text(cot.clienteNombre, style: Theme.of(context).textTheme.titleMedium),
        if (cot.fecha != null) Text('Fecha: ${cot.fecha}'),
        if (cot.vencimiento != null) Text('Vencimiento: ${cot.vencimiento}'),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _TotalRow(label: 'Subtotal', value: formatCurrency(cot.subtotal)),
                _TotalRow(label: 'IVA (16%)', value: formatCurrency(cot.iva)),
                const Divider(),
                _TotalRow(label: 'Total', value: formatCurrency(cot.total), bold: true),
                _TotalRow(label: 'Pagado', value: formatCurrency(cot.pagado)),
                _TotalRow(
                  label: 'Saldo',
                  value: formatCurrency(cot.saldo),
                  bold: true,
                  color: cot.saldo > 0 ? Colors.orange : Colors.green,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text('Conceptos', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        ...cot.conceptosList.map(
          (concepto) => Card(
            child: ListTile(
              title: Text(concepto.descripcion),
              subtitle: Text('${concepto.cantidad} x ${formatCurrency(concepto.precioUnitario)}'),
              trailing: Text(formatCurrency(concepto.subtotal)),
            ),
          ),
        ),
        if (cot.pagosList.isNotEmpty) ...[
          const SizedBox(height: 24),
          Text('Pagos', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          ...cot.pagosList.map(
            (pago) => Card(
              child: ListTile(
                title: Text(formatCurrency(pago.monto)),
                subtitle: Text('${pago.fecha} · ${pago.metodo}'),
                trailing: pago.referencia != null ? Text(pago.referencia!) : null,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _TotalRow extends StatelessWidget {
  const _TotalRow({
    required this.label,
    required this.value,
    this.bold = false,
    this.color,
  });

  final String label;
  final String value;
  final bool bold;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final style = TextStyle(
      fontWeight: bold ? FontWeight.w700 : FontWeight.normal,
      color: color,
    );

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: style),
          Text(value, style: style),
        ],
      ),
    );
  }
}
