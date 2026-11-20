import 'package:flutter/material.dart';

import '../data/app_state.dart';
import '../data/models.dart';
import '../ui/product_card.dart';
import '../ui/theme.dart';

/// Главная витрина мобильного клиента: баннер, категории и хиты.
/// Повторяет структуру `src/app/(frontend)/page.tsx`.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, this.onOpenCatalog});

  /// Переход на вкладку каталога с выбранной категорией.
  final void Function(int? categoryId)? onOpenCatalog;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic> _settings = const {};
  List<Category> _categories = const [];
  Map<int, int> _counts = const {};
  List<Product> _featured = const [];
  bool _loading = true;
  Object? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final api = AppScope.of(context).api;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        api.fetchSettings(),
        api.fetchCategories(),
        api.fetchFeatured(),
        api.fetchCategoryCounts(),
      ]);
      if (!mounted) return;
      setState(() {
        _settings = results[0] as Map<String, dynamic>;
        _categories = results[1] as List<Category>;
        _featured = results[2] as List<Product>;
        _counts = results[3] as Map<int, int>;
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

  String get _heading => (_settings['heroHeading'] as String?) ?? 'Собирай свой мир из';
  String get _highlight => (_settings['heroHighlight'] as String?) ?? 'кирпичиков';
  String get _heroText =>
      (_settings['heroText'] as String?) ??
      'BrickStore — интернет-магазин конструкторов LEGO.';
  String get _announcement => (_settings['announcement'] as String?) ?? '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('BrickStore'),
        actions: [
          IconButton(
            tooltip: 'Каталог',
            onPressed: () => widget.onOpenCatalog?.call(null),
            icon: const Icon(Icons.grid_view),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? _errorView()
                : ListView(
                    padding: const EdgeInsets.only(bottom: 24),
                    children: [
                      if (_announcement.isNotEmpty) _announce(),
                      _hero(),
                      _categorySection(),
                      _featuredSection(),
                    ],
                  ),
      ),
    );
  }

  Widget _announce() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: const Color(0xFFFFCE00),
      child: Text(
        _announcement,
        textAlign: TextAlign.center,
        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, height: 1.35),
      ),
    );
  }

  Widget _hero() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      padding: const EdgeInsets.fromLTRB(22, 26, 22, 24),
      decoration: BoxDecoration(
        color: AppTheme.ink,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'КОНСТРУКТОРЫ LEGO',
            style: TextStyle(
              color: Color(0xFFFFCE00),
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 10),
          Text.rich(
            TextSpan(
              children: [
                TextSpan(text: '$_heading '),
                TextSpan(
                  text: _highlight,
                  style: const TextStyle(color: Color(0xFFFFCE00)),
                ),
              ],
            ),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.w800,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            _heroText,
            style: const TextStyle(color: Color(0xFFCDCBD4), fontSize: 14, height: 1.45),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: FilledButton(
                  onPressed: () => widget.onOpenCatalog?.call(null),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFFFCE00),
                    foregroundColor: AppTheme.ink,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text(
                    (_settings['heroCtaLabel'] as String?) ?? 'Смотреть каталог',
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _sectionHead(String title, String action, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 12, 10),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
            ),
          ),
          TextButton(onPressed: onTap, child: Text(action)),
        ],
      ),
    );
  }

  /// Русское склонение: 1 набор, 2 набора, 5 наборов.
  static String _plural(int count, String one, String few, String many) {
    final mod100 = count % 100;
    final mod10 = count % 10;
    if (mod100 >= 11 && mod100 <= 14) return many;
    if (mod10 == 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
  }

  Widget _categorySection() {
    if (_categories.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHead('Наши наборы', 'Все →', () => widget.onOpenCatalog?.call(null)),
        SizedBox(
          height: 96,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _categories.length,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              final category = _categories[index];
              final count = _counts[category.id] ?? 0;
              return InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => widget.onOpenCatalog?.call(category.id),
                child: Container(
                  width: 104,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE4E2E8)),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        category.title,
                        maxLines: 2,
                        textAlign: TextAlign.center,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '$count ${_plural(count, 'набор', 'набора', 'наборов')}',
                        style: const TextStyle(color: AppTheme.muted, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _featuredSection() {
    if (_featured.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHead('Хиты сезона', 'Каталог →', () => widget.onOpenCatalog?.call(null)),
        SizedBox(
          height: 296,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _featured.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, index) => SizedBox(
              width: 168,
              child: ProductCard(product: _featured[index]),
            ),
          ),
        ),
      ],
    );
  }

  Widget _errorView() {
    final message =
        _error is ApiException ? (_error as ApiException).message : 'Не удалось загрузить витрину';
    return ListView(
      padding: const EdgeInsets.all(32),
      children: [
        const Icon(Icons.cloud_off, size: 48, color: AppTheme.muted),
        const SizedBox(height: 12),
        Text(message, textAlign: TextAlign.center),
        const SizedBox(height: 20),
        Center(
          child: FilledButton(onPressed: _load, child: const Text('Повторить')),
        ),
      ],
    );
  }
}
