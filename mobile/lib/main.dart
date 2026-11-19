import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'data/api_client.dart';
import 'data/app_state.dart';
import 'screens/catalog_screen.dart';
import 'screens/favorites_screen.dart';
import 'screens/login_screen.dart';
import 'ui/theme.dart';

void main() {
  runApp(const BrickStoreApp());
}

class BrickStoreApp extends StatefulWidget {
  const BrickStoreApp({super.key});

  @override
  State<BrickStoreApp> createState() => _BrickStoreAppState();
}

class _BrickStoreAppState extends State<BrickStoreApp> {
  late final ApiClient _api = ApiClient(httpClient: http.Client());
  late final AppState _state = AppState(_api);

  @override
  void initState() {
    super.initState();
    _state.bootstrap();
  }

  @override
  void dispose() {
    _api.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScope(
      state: _state,
      child: MaterialApp(
        title: 'BrickStore',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.build(),
        home: const _Root(),
      ),
    );
  }
}

/// Первый экран зависит от наличия сессии: гость видит вход,
/// вошедший покупатель — каталог с нижней навигацией.
class _Root extends StatelessWidget {
  const _Root();

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);

    if (state.restoring) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return state.isSignedIn ? const _HomeTabs() : const LoginScreen();
  }
}

class _HomeTabs extends StatefulWidget {
  const _HomeTabs();

  @override
  State<_HomeTabs> createState() => _HomeTabsState();
}

class _HomeTabsState extends State<_HomeTabs> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: const [
          CatalogScreen(),
          FavoritesScreen(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.grid_view_outlined),
            selectedIcon: Icon(Icons.grid_view),
            label: 'Каталог',
          ),
          NavigationDestination(
            icon: Icon(Icons.favorite_border),
            selectedIcon: Icon(Icons.favorite),
            label: 'Избранное',
          ),
        ],
      ),
    );
  }
}
