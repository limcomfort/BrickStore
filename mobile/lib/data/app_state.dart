import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_client.dart';
import 'models.dart';

/// Ключ, под которым токен сессии лежит в настройках приложения.
const String _tokenKey = 'brickstore.session_token';

/// Состояние сессии и избранного, доступное всем экранам через [AppScope].
class AppState extends ChangeNotifier {
  AppState(this._api) {
    _favorites = <int>{};
  }

  final ApiClient _api;

  late Set<int> _favorites;
  Customer? _customer;
  bool _restoring = true;
  String? _error;

  ApiClient get api => _api;
  Customer? get customer => _customer;
  bool get isSignedIn => _customer != null;

  /// Пока true, показываем splash: ещё неясно, есть ли сохранённая сессия.
  bool get restoring => _restoring;
  int get favoritesCount => _favorites.length;
  String? get error => _error;

  bool isFavorite(int productId) => _favorites.contains(productId);

  /// Восстанавливает сессию из хранилища и подтягивает избранное.
  Future<void> bootstrap() async {
    _restoring = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(_tokenKey);
      if (token != null && token.isNotEmpty) {
        _api.authToken = token;
        _customer = await _api.restoreSession();
        if (_customer == null) {
          // Токен протух — чистим, чтобы не дёргать API впустую.
          _api.authToken = null;
          await prefs.remove(_tokenKey);
        }
      }
      await _refreshFavorites();
    } catch (e) {
      _error = _message(e);
    } finally {
      _restoring = false;
      notifyListeners();
    }
  }

  Future<void> signIn({required String name, required String email}) async {
    final result = await _api.login(name: name, email: email);
    _api.authToken = result.token;
    _customer = result.customer;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, result.token);
    _error = null;
    notifyListeners();
    await _refreshFavorites();
  }

  Future<void> signOut() async {
    try {
      await _api.logout();
    } catch (_) {
      // Даже если сервер недоступен, локально сессию закрываем.
    }
    _api.authToken = null;
    _customer = null;
    _favorites = <int>{};
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    notifyListeners();
  }

  /// Переключает избранное с оптимистичным обновлением.
  Future<void> toggleFavorite(int productId) async {
    if (!isSignedIn) {
      throw const ApiException(
        statusCode: 401,
        message: 'Войдите, чтобы сохранять избранное',
      );
    }

    final wasFavorite = _favorites.contains(productId);
    final snapshot = Set<int>.from(_favorites);

    if (wasFavorite) {
      _favorites.remove(productId);
    } else {
      _favorites.add(productId);
    }
    notifyListeners();

    try {
      if (wasFavorite) {
        await _api.removeFavorite(productId);
      } else {
        await _api.addFavorite(productId);
      }
    } catch (e) {
      _favorites = snapshot;
      notifyListeners();
      rethrow;
    }
  }

  Future<List<Product>> loadFavorites() => _api.fetchFavoriteProducts();

  Future<void> _refreshFavorites() async {
    if (!isSignedIn) {
      _favorites = <int>{};
      return;
    }
    _favorites = await _api.fetchFavorites();
  }

  String _message(Object error) =>
      error is ApiException ? error.message : 'Не удалось связаться с сервером';
}

/// Простейший доступ к [AppState] без внешних зависимостей:
/// состояние живёт в одном месте, экраны получают его через `InheritedNotifier`.
class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child})
      : super(notifier: state);

  static AppState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppScope>();
    assert(scope != null, 'AppScope не найден выше по дереву');
    return scope!.notifier!;
  }
}
