import 'package:flutter/material.dart';

import '../data/app_state.dart';
import '../data/models.dart';
import '../ui/product_card.dart';
import '../ui/theme.dart';

/// Экран избранного: тянет карточки товаров по id из кабинета.
class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  List<Product> _products = const [];
  bool _loading = true;
  Object? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final state = AppScope.of(context);
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final products = await state.loadFavorites();
      if (!mounted) return;
      setState(() {
        _products = products;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Слушаем счётчик: снятие сердечка в каталоге должно обновлять и этот экран.
    final state = AppScope.of(context);
    final count = state.favoritesCount;

    return Scaffold(
      appBar: AppBar(
        title: Text('Избранное${count > 0 ? ' · $count' : ''}'),
        actions: [
          IconButton(
            tooltip: 'Обновить',
            onPressed: _load,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _errorView()
              : _products.isEmpty
                  ? _empty()
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: GridView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                        gridDelegate:
                            const SliverGridDelegateWithMaxCrossAxisExtent(
                          maxCrossAxisExtent: 260,
                          mainAxisSpacing: 14,
                          crossAxisSpacing: 14,
                          childAspectRatio: 0.62,
                        ),
                        itemCount: _products.length,
                        itemBuilder: (context, index) =>
                            ProductCard(product: _products[index]),
                      ),
                    ),
    );
  }

  Widget _empty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.favorite_border, size: 56, color: AppTheme.muted),
            const SizedBox(height: 16),
            const Text(
              'Пока пусто',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'Откройте каталог и нажмите на сердечко у подходящего набора.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.muted, height: 1.4),
            ),
          ],
        ),
      ),
    );
  }

  Widget _errorView() {
    final message =
        _error is ApiException ? (_error as ApiException).message : 'Ошибка загрузки';
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off, size: 48, color: AppTheme.muted),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 20),
            SizedBox(
              width: 200,
              child: FilledButton(
                onPressed: _load,
                child: const Text('Повторить'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
