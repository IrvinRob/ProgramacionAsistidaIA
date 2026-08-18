import 'package:flutter/material.dart';
import 'package:gestorpyme_mobile/models/models.dart';
import 'package:gestorpyme_mobile/screens/cotizacion_detail_screen.dart';
import 'package:gestorpyme_mobile/services/api_service.dart';
import 'package:gestorpyme_mobile/utils/format.dart';
import 'package:gestorpyme_mobile/widgets/common_views.dart';
import 'package:gestorpyme_mobile/widgets/estado_chip.dart';

class CotizacionesScreen extends StatefulWidget {
  const CotizacionesScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<CotizacionesScreen> createState() => _CotizacionesScreenState();
}

class _CotizacionesScreenState extends State<CotizacionesScreen> {
  final _searchController = TextEditingController();
  List<CotizacionResumen> cotizaciones = [];
  String? error;
  bool loading = true;
  String estadoFiltro = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });

    try {
      final result = await widget.api.fetchCotizaciones(
        q: _searchController.text.trim(),
        estado: estadoFiltro,
      );
      if (!mounted) return;
      setState(() {
        cotizaciones = result;
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
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Column(
            children: [
              TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Buscar cotización...',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _searchController.clear();
                      _load();
                    },
                  ),
                ),
                onSubmitted: (_) => _load(),
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    FilterChip(
                      label: const Text('Todas'),
                      selected: estadoFiltro.isEmpty,
                      onSelected: (_) {
                        setState(() => estadoFiltro = '');
                        _load();
                      },
                    ),
                    ...['BORRADOR', 'ENVIADA', 'APROBADA', 'FACTURADA', 'PAGADA'].map(
                      (estado) => Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: FilterChip(
                          label: Text(formatEstado(estado)),
                          selected: estadoFiltro == estado,
                          onSelected: (_) {
                            setState(() => estadoFiltro = estado);
                            _load();
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: loading
              ? const LoadingView(message: 'Cargando cotizaciones...')
              : error != null
                  ? ErrorView(message: error!, onRetry: _load)
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: cotizaciones.isEmpty
                          ? ListView(
                              children: const [
                                SizedBox(height: 120),
                                Center(child: Text('No hay cotizaciones')),
                              ],
                            )
                          : ListView.builder(
                              itemCount: cotizaciones.length,
                              itemBuilder: (context, index) {
                                final cot = cotizaciones[index];
                                return Card(
                                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                  child: ListTile(
                                    title: Text(cot.numero),
                                    subtitle: Text('${cot.clienteNombre} · ${cot.fecha ?? ''}'),
                                    trailing: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text(
                                          formatCurrency(cot.total),
                                          style: const TextStyle(fontWeight: FontWeight.w600),
                                        ),
                                        EstadoChip(estado: cot.estado),
                                      ],
                                    ),
                                    onTap: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) => CotizacionDetailScreen(
                                            api: widget.api,
                                            cotizacionId: cot.id,
                                          ),
                                        ),
                                      );
                                    },
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
