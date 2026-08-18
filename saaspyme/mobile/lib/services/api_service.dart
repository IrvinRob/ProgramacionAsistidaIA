import 'package:dio/dio.dart';
import 'package:gestorpyme_mobile/config/app_config.dart';
import 'package:gestorpyme_mobile/models/cliente.dart';
import 'package:gestorpyme_mobile/models/models.dart';
import 'package:gestorpyme_mobile/models/usuario.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiService {
  ApiService({String? token}) {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ),
    );

    if (token != null) {
      setToken(token);
    }
  }

  late final Dio _dio;

  void setToken(String? token) {
    if (token == null || token.isEmpty) {
      _dio.options.headers.remove('Authorization');
      return;
    }

    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  Future<Map<String, dynamic>> _get(String path, {Map<String, dynamic>? query}) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(path, queryParameters: query);
      return response.data ?? {};
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<Map<String, dynamic>> _post(String path, {Map<String, dynamic>? body}) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(path, data: body);
      return response.data ?? {};
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<Map<String, dynamic>> _put(String path, {Map<String, dynamic>? body}) async {
    try {
      final response = await _dio.put<Map<String, dynamic>>(path, data: body);
      return response.data ?? {};
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  ApiException _mapError(DioException error) {
    final data = error.response?.data;
    var message = 'Error de conexión con el servidor';

    if (data is Map<String, dynamic>) {
      message = data['error'] as String? ??
          data['errors']?.toString() ??
          message;
    }

    return ApiException(message, statusCode: error.response?.statusCode);
  }

  Future<Usuario> syncSession({
    required String token,
    required String correo,
    required String nombre,
    String? imageUrl,
  }) async {
    final data = await _post(
      '/api/auth/session',
      body: {
        'token': token,
        'profile': {
          'correo': correo,
          'nombre': nombre,
          'imageUrl': ?imageUrl,
        },
      },
    );

    if (data['ok'] != true) {
      throw ApiException(data['error'] as String? ?? 'Sesión inválida');
    }

    final usuarioJson = data['usuario'] as Map<String, dynamic>?;
    if (usuarioJson == null) {
      throw ApiException('Usuario no autorizado en GestorPyme');
    }

    return Usuario.fromJson(usuarioJson);
  }

  Future<Usuario> fetchMe() async {
    final data = await _get('/api/v1/me');
    return Usuario.fromJson(data['usuario'] as Map<String, dynamic>);
  }

  Future<DashboardData> fetchDashboard() async {
    final data = await _get('/api/v1/dashboard');
    return DashboardData.fromJson(data);
  }

  Future<List<Cliente>> fetchClientes({String q = '', int page = 1}) async {
    final data = await _get('/api/v1/clientes', query: {'q': q, 'page': page});
    return (data['clientes'] as List<dynamic>)
        .map((item) => Cliente.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> fetchClienteDetalle(String id) async {
    return _get('/api/v1/clientes/$id');
  }

  Future<void> crearCliente(Map<String, dynamic> payload) async {
    final data = await _post('/api/v1/clientes', body: payload);
    if (data['ok'] != true) {
      throw ApiException(data['error'] as String? ?? 'No se pudo crear el cliente');
    }
  }

  Future<void> actualizarCliente(String id, Map<String, dynamic> payload) async {
    final data = await _put('/api/v1/clientes/$id', body: payload);
    if (data['ok'] != true) {
      throw ApiException(data['error'] as String? ?? 'No se pudo actualizar el cliente');
    }
  }

  Future<List<CotizacionResumen>> fetchCotizaciones({String q = '', String estado = ''}) async {
    final data = await _get('/api/v1/cotizaciones', query: {
      if (q.isNotEmpty) 'q': q,
      if (estado.isNotEmpty) 'estado': estado,
    });

    return (data['cotizaciones'] as List<dynamic>)
        .map((item) => CotizacionResumen.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<CotizacionDetalle> fetchCotizacion(String id) async {
    final data = await _get('/api/v1/cotizaciones/$id');
    return CotizacionDetalle.fromJson(data['cotizacion'] as Map<String, dynamic>);
  }

  Future<List<CobranzaItem>> fetchCobranza() async {
    final data = await _get('/api/v1/cobranza');
    return (data['pendientes'] as List<dynamic>)
        .map((item) => CobranzaItem.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> registrarPago({
    required String cotizacionId,
    required double monto,
    required String fecha,
    required String metodo,
    String? referencia,
  }) async {
    final data = await _post('/api/v1/cobranza', body: {
      'action': 'pagar',
      'cotizacionId': cotizacionId,
      'monto': monto,
      'fecha': fecha,
      'metodo': metodo,
      if (referencia != null && referencia.isNotEmpty) 'referencia': referencia,
    });

    if (data['ok'] != true) {
      throw ApiException(data['error'] as String? ?? 'No se pudo registrar el pago');
    }
  }
}
