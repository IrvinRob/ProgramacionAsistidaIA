import 'package:flutter/material.dart';
import 'package:gestorpyme_mobile/models/models.dart';
import 'package:gestorpyme_mobile/services/api_service.dart';
import 'package:gestorpyme_mobile/utils/format.dart';
import 'package:gestorpyme_mobile/widgets/common_views.dart';
import 'package:gestorpyme_mobile/widgets/estado_chip.dart';

class CobranzaScreen extends StatefulWidget {
  const CobranzaScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<CobranzaScreen> createState() => _CobranzaScreenState();
}

class _CobranzaScreenState extends State<CobranzaScreen> {
  List<CobranzaItem> pendientes = [];
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
      final result = await widget.api.fetchCobranza();
      if (!mounted) return;
      setState(() {
        pendientes = result;
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

  Future<void> _registrarPago(CobranzaItem item) async {
    final montoController = TextEditingController(text: item.pendiente.toStringAsFixed(2));
    final referenciaController = TextEditingController();
    var metodo = 'TRANSFERENCIA';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Registrar pago · ${item.numero}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: montoController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Monto'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: metodo,
              decoration: const InputDecoration(labelText: 'Método'),
              items: const [
                DropdownMenuItem(value: 'TRANSFERENCIA', child: Text('Transferencia')),
                DropdownMenuItem(value: 'EFECTIVO', child: Text('Efectivo')),
                DropdownMenuItem(value: 'CHEQUE', child: Text('Cheque')),
                DropdownMenuItem(value: 'TARJETA', child: Text('Tarjeta')),
              ],
              onChanged: (value) => metodo = value ?? metodo,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: referenciaController,
              decoration: const InputDecoration(labelText: 'Referencia (opcional)'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Registrar')),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    try {
      await widget.api.registrarPago(
        cotizacionId: item.id,
        monto: double.parse(montoController.text),
        fecha: DateTime.now().toIso8601String().split('T').first,
        metodo: metodo,
        referencia: referenciaController.text.trim(),
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pago registrado correctamente')),
      );
      _load();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const LoadingView(message: 'Cargando cobranza...');
    if (error != null) return ErrorView(message: error!, onRetry: _load);

    final totalPendiente = pendientes.fold<double>(0, (sum, item) => sum + item.pendiente);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Card(
            color: const Color(0xFFFFF7ED),
            child: ListTile(
              leading: const Icon(Icons.account_balance_wallet, color: Colors.orange),
              title: const Text('Total pendiente de cobro'),
              trailing: Text(
                formatCurrency(totalPendiente),
                style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.orange),
              ),
            ),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _load,
            child: pendientes.isEmpty
                ? ListView(
                    children: const [
                      SizedBox(height: 120),
                      Center(child: Text('No hay saldos pendientes')),
                    ],
                  )
                : ListView.builder(
                    itemCount: pendientes.length,
                    itemBuilder: (context, index) {
                      final item = pendientes[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        child: ListTile(
                          title: Text(item.numero),
                          subtitle: Text(
                            '${item.clienteNombre} · ${item.dias} días · ${formatCurrency(item.pendiente)} pendiente',
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              EstadoChip(estado: item.estado),
                              IconButton(
                                icon: const Icon(Icons.payments_outlined),
                                onPressed: () => _registrarPago(item),
                                tooltip: 'Registrar pago',
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ),
      ],
    );
  }
}
