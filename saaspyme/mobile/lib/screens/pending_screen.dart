import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import 'package:gestorpyme_mobile/providers/auth_provider.dart';
import 'package:provider/provider.dart';

class PendingScreen extends StatelessWidget {
  const PendingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.read<AuthProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Acceso pendiente')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.hourglass_empty, size: 64),
            const SizedBox(height: 16),
            Text(
              'Tu cuenta de Google está autenticada, pero aún no tienes acceso a GestorPyme.',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            const Text(
              'Un administrador debe darte de alta en el sistema web antes de usar la app móvil.',
            ),
            const Spacer(),
            OutlinedButton(
              onPressed: () async {
                final auth = ClerkAuth.of(context);
                await authProvider.signOut(auth);
              },
              child: const Text('Cerrar sesión'),
            ),
          ],
        ),
      ),
    );
  }
}
