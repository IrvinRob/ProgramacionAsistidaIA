import 'package:clerk_auth/clerk_auth.dart' as clerk;
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:gestorpyme_mobile/config/app_config.dart';
import 'package:gestorpyme_mobile/providers/auth_provider.dart';
import 'package:gestorpyme_mobile/screens/home_shell.dart';
import 'package:gestorpyme_mobile/screens/login_screen.dart';
import 'package:gestorpyme_mobile/screens/pending_screen.dart';
import 'package:gestorpyme_mobile/services/api_service.dart';
import 'package:gestorpyme_mobile/theme/app_theme.dart';
import 'package:gestorpyme_mobile/utils/web_clerk_file_cache.dart';
import 'package:provider/provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const GestorPymeApp());
}

class GestorPymeApp extends StatelessWidget {
  const GestorPymeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider(create: (_) => ApiService()),
        ChangeNotifierProxyProvider<ApiService, AuthProvider>(
          create: (context) => AuthProvider(context.read<ApiService>()),
          update: (_, api, auth) => auth ?? AuthProvider(api),
        ),
      ],
      child: ClerkAuth(
        config: kIsWeb
            ? ClerkAuthConfig(
                publishableKey: AppConfig.clerkPublishableKey,
                persistor: clerk.Persistor.none,
                fileCache: WebClerkFileCache(),
              )
            : ClerkAuthConfig(
                publishableKey: AppConfig.clerkPublishableKey,
              ),
        child: MaterialApp(
          title: 'GestorPyme',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light(),
          home: const AppGate(),
        ),
      ),
    );
  }
}

class AppGate extends StatefulWidget {
  const AppGate({super.key});

  @override
  State<AppGate> createState() => _AppGateState();
}

class _AppGateState extends State<AppGate> {
  bool _syncing = false;

  Future<void> _handleSignedIn(ClerkAuthState auth) async {
    if (_syncing) return;

    _syncing = true;
    await context.read<AuthProvider>().syncWithBackend(auth);
    _syncing = false;
  }

  @override
  Widget build(BuildContext context) {
    return ClerkAuthBuilder(
      signedInBuilder: (context, auth) {
        final authProvider = context.watch<AuthProvider>();

        if (authProvider.syncing) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (authProvider.status == AuthStatus.unknown ||
            authProvider.status == AuthStatus.signedOut) {
          WidgetsBinding.instance.addPostFrameCallback((_) => _handleSignedIn(auth));
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (authProvider.status == AuthStatus.pending) {
          return const PendingScreen();
        }

        return const HomeShell();
      },
      signedOutBuilder: (context, auth) {
        context.read<AuthProvider>().setSignedOut();
        return const LoginScreen();
      },
    );
  }
}
