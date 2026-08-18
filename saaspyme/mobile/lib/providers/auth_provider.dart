import 'package:collection/collection.dart';
import 'package:clerk_auth/clerk_auth.dart' as clerk;
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:gestorpyme_mobile/models/usuario.dart';
import 'package:gestorpyme_mobile/services/api_service.dart';

enum AuthStatus { unknown, signedOut, pending, signedIn }

class AuthProvider extends ChangeNotifier {
  AuthProvider(this._api);

  final ApiService _api;

  AuthStatus status = AuthStatus.unknown;
  Usuario? usuario;
  String? error;
  bool syncing = false;

  Future<void> syncWithBackend(ClerkAuthState auth) async {
    final user = auth.client.user;
    if (user is! clerk.User) return;

    syncing = true;
    error = null;
    notifyListeners();

    try {
      final token = await auth.sessionToken();
      _api.setToken(token.jwt);

      final correo = user.emailAddresses?.firstWhereOrNull(
            (email) => email.id == user.primaryEmailAddressId,
          )?.emailAddress ??
          user.emailAddresses?.firstOrNull?.emailAddress ??
          '';
      final nombre = user.name.isNotEmpty ? user.name : correo;

      final synced = await _api.syncSession(
        token: token.jwt,
        correo: correo,
        nombre: nombre,
        imageUrl: user.imageUrl,
      );

      usuario = synced;
      status = AuthStatus.signedIn;
    } on ApiException catch (e) {
      if (e.message.contains('autorizado') || e.message.contains('pendiente')) {
        status = AuthStatus.pending;
      } else {
        error = e.message;
        status = AuthStatus.signedOut;
      }
    } catch (e) {
      error = 'No se pudo sincronizar la sesión';
      status = AuthStatus.signedOut;
    } finally {
      syncing = false;
      notifyListeners();
    }
  }

  Future<void> signOut(ClerkAuthState auth) async {
    await auth.signOut();
    usuario = null;
    _api.setToken(null);
    status = AuthStatus.signedOut;
    notifyListeners();
  }

  void setSignedOut() {
    usuario = null;
    _api.setToken(null);
    status = AuthStatus.signedOut;
    notifyListeners();
  }
}
