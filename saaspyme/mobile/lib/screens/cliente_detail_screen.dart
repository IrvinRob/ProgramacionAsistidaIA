import 'package:flutter/material.dart';
import 'package:gestorpyme_mobile/models/models.dart';
import 'package:gestorpyme_mobile/services/api_service.dart';
import 'package:gestorpyme_mobile/utils/format.dart';
import 'package:gestorpyme_mobile/widgets/common_views.dart';
import 'package:gestorpyme_mobile/widgets/estado_chip.dart';

class ClienteDetailScreen extends StatefulWidget {
  const ClienteDetailScreen({
    super.key,
    required this.api,
    required this.clienteId,
  });

  final ApiService api;
  final String clienteId;

  @override
  State<ClienteDetailScreen> createState() => _ClienteDetailScreenState();
}

class _ClienteDetailScreenState extends State<ClienteDetailScreen> {
  Map<String, dynamic>? data;
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
      final result = await widget.api.fetchClienteDetalle(widget.clienteId);
      if (!mounted) return;
      setState(() {
        data = result;
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
      appBar: AppBar(title: const Text('Detalle de cliente')),
      body: loading
          ? const LoadingView()
          : error != null
              ? ErrorView(message: error!, onRetry: _load)
              : _buildContent(),
    );
  }

  Widget _buildContent() {
    final cliente = data!['cliente'] as Map<String, dynamic>;
    final resumen = data!['resumen'] as Map<String, dynamic>;
    final cotizaciones = (data!['cotizaciones'] as List<dynamic>)
        .map((item) => CotizacionResumen.fromJson(item as Map<String, dynamic>))
        .toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(cliente['nombre'] as String, style: Theme.of(context).textTheme.headlineSmall),
        if (cliente['empresa'] != null) Text(cliente['empresa'] as String),
        const SizedBox(height: 8),
        Text(cliente['correo'] as String),
        if (cliente['telefono'] != null) Text(cliente['telefono'] as String),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _ResumenTile(
                label: 'Cotizado',
                value: formatCurrency((resumen['totalCotizado'] as num?) ?? 0),
              ),
            ),
            Expanded(
              child: _ResumenTile(
                label: 'Pagado',
                value: formatCurrency((resumen['totalPagado'] as num?) ?? 0),
              ),
            ),
            Expanded(
              child: _ResumenTile(
                label: 'Pendiente',
                value: formatCurrency((resumen['totalPendiente'] as num?) ?? 0),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        Text('Historial de cotizaciones', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        ...cotizaciones.map(
          (cot) => Card(
            child: ListTile(
              title: Text(cot.numero),
              subtitle: Text('${cot.fecha ?? ''} · ${formatCurrency(cot.total)}'),
              trailing: EstadoChip(estado: cot.estado),
            ),
          ),
        ),
      ],
    );
  }
}

class _ResumenTile extends StatelessWidget {
  const _ResumenTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Text(label, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
