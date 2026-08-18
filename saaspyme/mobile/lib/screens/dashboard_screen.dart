import 'package:flutter/material.dart';
import 'package:gestorpyme_mobile/models/models.dart';
import 'package:gestorpyme_mobile/services/api_service.dart';
import 'package:gestorpyme_mobile/utils/format.dart';
import 'package:gestorpyme_mobile/widgets/common_views.dart';
import 'package:gestorpyme_mobile/widgets/estado_chip.dart';
import 'package:gestorpyme_mobile/widgets/kpi_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  DashboardData? data;
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
      final result = await widget.api.fetchDashboard();
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
    if (loading) return const LoadingView(message: 'Cargando dashboard...');
    if (error != null) return ErrorView(message: error!, onRetry: _load);
    if (data == null) return const ErrorView(message: 'Sin datos');

    final dashboard = data!;

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.3,
            children: [
              KpiCard(
                label: 'Ventas del mes',
                value: formatCurrency(dashboard.totalVentas),
                icon: Icons.trending_up,
              ),
              KpiCard(
                label: 'Facturado',
                value: formatCurrency(dashboard.totalFacturadoMes),
                icon: Icons.receipt_long,
              ),
              KpiCard(
                label: 'Cobrado',
                value: formatCurrency(dashboard.totalCobrado),
                icon: Icons.payments,
              ),
              KpiCard(
                label: 'Cartera pendiente',
                value: formatCurrency(dashboard.carteraPendiente),
                icon: Icons.account_balance_wallet,
                color: Colors.orange,
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text('Últimas cotizaciones', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          ...dashboard.ultimasCots.map(
            (cot) => Card(
              child: ListTile(
                title: Text(cot.numero),
                subtitle: Text(cot.clienteNombre),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(formatCurrency(cot.total), style: const TextStyle(fontWeight: FontWeight.w600)),
                    EstadoChip(estado: cot.estado),
                  ],
                ),
              ),
            ),
          ),
          if (dashboard.topClientesPendiente.isNotEmpty) ...[
            const SizedBox(height: 24),
            Text('Top clientes con saldo', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            ...dashboard.topClientesPendiente.map(
              (cliente) => Card(
                child: ListTile(
                  title: Text(cliente['nombre'] as String? ?? ''),
                  subtitle: Text(cliente['empresa'] as String? ?? ''),
                  trailing: Text(
                    formatCurrency((cliente['pendiente'] as num?) ?? 0),
                    style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.orange),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
