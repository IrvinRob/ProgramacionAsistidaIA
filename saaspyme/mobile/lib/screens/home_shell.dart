import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import 'package:gestorpyme_mobile/providers/auth_provider.dart';
import 'package:gestorpyme_mobile/screens/clientes_screen.dart';
import 'package:gestorpyme_mobile/screens/cobranza_screen.dart';
import 'package:gestorpyme_mobile/screens/cotizaciones_screen.dart';
import 'package:gestorpyme_mobile/screens/dashboard_screen.dart';
import 'package:gestorpyme_mobile/services/api_service.dart';
import 'package:provider/provider.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiService>();
    final authProvider = context.watch<AuthProvider>();
    final usuario = authProvider.usuario;

    final screens = [
      DashboardScreen(api: api),
      ClientesScreen(api: api),
      CotizacionesScreen(api: api),
      CobranzaScreen(api: api),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('GestorPyme'),
            if (usuario != null)
              Text(
                usuario.nombre,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
              ),
          ],
        ),
        actions: [
          ClerkUserButton(),
        ],
      ),
      body: IndexedStack(
        index: _index,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Inicio'),
          NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'Clientes'),
          NavigationDestination(icon: Icon(Icons.description_outlined), selectedIcon: Icon(Icons.description), label: 'Cotizaciones'),
          NavigationDestination(icon: Icon(Icons.payments_outlined), selectedIcon: Icon(Icons.payments), label: 'Cobranza'),
        ],
      ),
    );
  }
}
