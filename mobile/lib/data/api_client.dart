import 'dart:convert';

import 'package:http/http.dart' as http;

import 'models.dart';

/// Базовый адрес CMS.
///
/// Значение по умолчанию — хост с точки зрения Android-эмулятора
/// (`10.0.2.2` — это `localhost` машины разработчика).
/// Переопределяется при запуске:
/// `flutter run --dart-define=BRICKSTORE_API_URL=https://example.com`
const String kApiBaseUrl = String.fromEnvironment(
  'BRICKSTORE_API_URL',
  defaultValue: 'http://10.0.2.2:3000',
);

/// Клиент Payload REST API.
///
/// Токен сессии передаётся в `Authorization: Bearer`, поэтому cookie
/// и браузерное окружение не нужны. Хранилище токена задаёт вызывающая
/// сторона через [authToken].
class ApiClient {
  ApiClient({http.Client? httpClient, String? baseUrl})
      : _http = httpClient ?? http.Client(),
        _baseUrl = baseUrl ?? kApiBaseUrl;

  final http.Client _http;
  final String _baseUrl;

  /// Текущий токен сессии или `null` для гостя.
  String? authToken;

  void dispose() => _http.close();

  Uri _uri(String path, [Map<String, String>? query]) =>
      Uri.parse('$_baseUrl$path').replace(queryParameters: query);

  Map<String, String> _headers({bool json = false}) {
    return {
      if (json) 'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (authToken != null) 'Authorization': 'Bearer $authToken',
    };
  }

  /// Каталог товаров. [categoryId] ограничивает выборку одной категорией.
  Future<List<Product>> fetchProducts({int? categoryId, String? search}) async {
    final where = <String, dynamic>{};
    if (categoryId != null) where['category'] = {'equals': categoryId};
    if (search != null && search.trim().isNotEmpty) {
      where['title'] = {'like': search.trim()};
    }

    final query = <String, String>{
      'depth': '1',
      'limit': '100',
      'sort': '-featured',
      if (where.isNotEmpty) 'where': jsonEncode(where),
    };

    final body = await _get('/api/products', query);
    return _docs(body).map(Product.fromJson).toList(growable: false);
  }

  /// Один товар по slug — так открывается карточка с экрана каталога.
  Future<Product> fetchProductBySlug(String slug) async {
    final body = await _get('/api/products', {
      'depth': '1',
      'limit': '1',
      'where': jsonEncode({
        'slug': {'equals': slug},
      }),
    });
    final docs = _docs(body);
    if (docs.isEmpty) {
      throw const ApiException(statusCode: 404, message: 'Товар не найден');
    }
    return Product.fromJson(docs.first);
  }

  Future<List<Category>> fetchCategories() async {
    final body = await _get('/api/categories', {'depth': '0', 'limit': '100'});
    return _docs(body).map(Category.fromJson).toList(growable: false);
  }

  /// Вход по имени и e-mail. Возвращает покупателя и токен сессии.
  Future<LoginResult> login({required String name, required String email}) async {
    final response = await _http.post(
      _uri('/api/account/session'),
      headers: {
        ..._headers(json: true),
        // Явный признак: cookie не нужна, верните токен в теле ответа.
        'x-client': 'mobile',
      },
      body: jsonEncode({'name': name, 'email': email}),
    );
    final body = _decode(response);
    if (response.statusCode >= 400) throw _error(response, body);
    return LoginResult.fromJson(body as Map<String, dynamic>);
  }

  /// Текущий покупатель по сохранённому токену.
  Future<Customer?> restoreSession() async {
    if (authToken == null) return null;
    final response = await _http.get(_uri('/api/account/session'), headers: _headers());
    if (response.statusCode == 401) return null;
    final body = _decode(response);
    if (response.statusCode >= 400) throw _error(response, body);
    if (body is! Map<String, dynamic>) return null;
    final customer = body['customer'];
    return customer is Map<String, dynamic> ? Customer.fromJson(customer) : null;
  }

  Future<void> logout() async {
    final response = await _http.delete(
      _uri('/api/account/session'),
      headers: _headers(),
    );
    if (response.statusCode >= 400) {
      throw _error(response, _decode(response));
    }
  }

  /// Идентификаторы товаров в избранном текущего покупателя.
  Future<Set<int>> fetchFavorites() async {
    final body = await _get('/api/account/favorites', null);
    final ids = body['productIds'];
    if (ids is! List) return <int>{};
    return ids.whereType<num>().map((id) => id.toInt()).toSet();
  }

  /// Полные карточки избранного — для экрана избранного.
  Future<List<Product>> fetchFavoriteProducts() async {
    final ids = await fetchFavorites();
    if (ids.isEmpty) return const [];
    final body = await _get('/api/products', {
      'depth': '1',
      'limit': '100',
      'where': jsonEncode({
        'id': {
          'in': ids.toList(),
        },
      }),
    });
    // Порядок выбирает сервер; для ленты избранного он не принципиален.
    return _docs(body).map(Product.fromJson).toList(growable: false);
  }

  /// Добавляет товар в избранное. Повторное добавление не считается ошибкой.
  Future<void> addFavorite(int productId) async {
    final response = await _http.post(
      _uri('/api/account/favorites'),
      headers: _headers(json: true),
      body: jsonEncode({'productId': productId}),
    );
    if (response.statusCode >= 400) {
      throw _error(response, _decode(response));
    }
  }

  Future<void> removeFavorite(int productId) async {
    final response = await _http.delete(
      _uri('/api/account/favorites', {'productId': '$productId'}),
      headers: _headers(),
    );
    if (response.statusCode >= 400) {
      throw _error(response, _decode(response));
    }
  }

  Future<Map<String, dynamic>> _get(String path, Map<String, String>? query) async {
    final response = await _http.get(_uri(path, query), headers: _headers());
    final body = _decode(response);
    if (response.statusCode >= 400) throw _error(response, body);
    if (body is! Map<String, dynamic>) {
      throw const ApiException(
        statusCode: 200,
        message: 'Неожиданный ответ сервера',
      );
    }
    return body;
  }

  List<Map<String, dynamic>> _docs(Object? body) {
    final docs = (body as Map<String, dynamic>?)?['docs'];
    if (docs is! List) return const [];
    return docs.whereType<Map<String, dynamic>>().toList(growable: false);
  }

  Object? _decode(http.Response response) {
    if (response.body.isEmpty) return null;
    try {
      return jsonDecode(utf8.decode(response.bodyBytes));
    } on FormatException {
      return null;
    }
  }

  /// Payload кладёт текст ошибки в `errors[0].message`, своя
  /// авторизация — в `error`.
  ApiException _error(http.Response response, Object? body) {
    if (body is Map<String, dynamic>) {
      final single = body['error'];
      if (single is String && single.isNotEmpty) {
        return ApiException(statusCode: response.statusCode, message: single);
      }
      final errors = body['errors'];
      if (errors is List && errors.isNotEmpty) {
        final first = errors.first;
        if (first is Map<String, dynamic> && first['message'] is String) {
          return ApiException(
            statusCode: response.statusCode,
            message: first['message'] as String,
          );
        }
      }
    }
    return ApiException(
      statusCode: response.statusCode,
      message: response.statusCode == 401
          ? 'Требуется вход в кабинет'
          : 'Ошибка сервера (${response.statusCode})',
    );
  }
}
