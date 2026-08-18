import 'package:flutter/material.dart';
import 'package:gestorpyme_mobile/models/cliente.dart';
import 'package:gestorpyme_mobile/screens/cliente_detail_screen.dart';
import 'package:gestorpyme_mobile/services/api_service.dart';
import 'package:gestorpyme_mobile/utils/format.dart';
import 'package:gestorpyme_mobile/widgets/common_views.dart';

class ClientesScreen extends StatefulWidget {
  const ClientesScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<ClientesScreen> createState() => _ClientesScreenState();
}

class _ClientesScreenState extends State<ClientesScreen> {
  final _searchController = TextEditingController();
  List<Cliente> clientes = [];
  String? error;
  bool loading = true;

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

  Future<void> _load({String q = ''}) async {
    setState(() {
      loading = true;
      error = null;
    });

    try {
      final result = await widget.api.fetchClientes(q: q);
      if (!mounted) return;
      setState(() {
        clientes = result;
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
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Buscar cliente...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(
                icon: const Icon(Icons.clear),
                onPressed: () {
                  _searchController.clear();
                  _load();
                },
              ),
            ),
            onSubmitted: (value) => _load(q: value),
          ),
        ),
        Expanded(
          child: loading
              ? const LoadingView(message: 'Cargando clientes...')
              : error != null
                  ? ErrorView(message: error!, onRetry: () => _load(q: _searchController.text))
                  : RefreshIndicator(
                      onRefresh: () => _load(q: _searchController.text),
                      child: clientes.isEmpty
                          ? ListView(
                              children: const [
                                SizedBox(height: 120),
                                Center(child: Text('No hay clientes activos')),
                              ],
                            )
                          : ListView.builder(
                              itemCount: clientes.length,
                              itemBuilder: (context, index) {
                                final cliente = clientes[index];
                                return Card(
                                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                  child: ListTile(
                                    title: Text(cliente.nombre),
                                    subtitle: Text(
                                      [
                                        if (cliente.empresa?.isNotEmpty == true) cliente.empresa,
                                        cliente.correo,
                                      ].whereType<String>().join(' · '),
                                    ),
                                    trailing: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        if (cliente.saldoPendiente > 0)
                                          Text(
                                            formatCurrency(cliente.saldoPendiente),
                                            style: const TextStyle(
                                              color: Colors.orange,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        Text('${cliente.cotizaciones} cot.'),
                                      ],
                                    ),
                                    onTap: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) => ClienteDetailScreen(
                                            api: widget.api,
                                            clienteId: cliente.id,
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
