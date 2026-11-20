import 'package:flutter/material.dart';

import '../data/app_state.dart';
import '../data/models.dart';
import '../ui/product_card.dart';
import '../ui/theme.dart';

/// Каталог: поиск, категории-фильтры, сортировка и сетка товаров из CMS.
class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key, this.initialCategoryId});

  /// Категория, выбранная на главной до перехода в каталог.
  final int? initialCategoryId;

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  List<Category> _categories = const [];
  List<Product> _products = const [];
  late int? _selectedCategory = widget.initialCategoryId;
  String _search = '';
  String _sort = '-featured';
  bool _loading = true;
  Object? _error;
  final TextEditingController _searchController = TextEditingController();

  /// Варианты сортировки — те же, что в веб-версии (`SORTS`).
  static const _sorts = <(String, String)>[
    ('-featured', 'По популярности'),
    ('price', 'Сначала дешевле'),
    ('-price', 'Сначала дороже'),
    ('-createdAt', 'Новинки'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void didUpdateWidget(CatalogScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Пользователь выбрал категорию на главной — подхватываем его выбор.
    if (widget.initialCategoryId != oldWidget.initialCategoryId) {
      _selectedCategory = widget.initialCategoryId;
      _load();
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final api = AppScope.of(context).api;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        api.fetchCategories(),
        api.fetchProducts(
          categoryId: _selectedCategory,
          search: _search,
          sort: _sort,
        ),
      ]);
      if (!mounted) return;
      setState(() {
        _categories = results[0] as List<Category>;
        _products = results[1] as List<Product>;
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

  Future<void> _selectCategory(int? id) async {
    setState(() => _selectedCategory = id);
    await _load();
  }

  Future<void> _submitSearch(String value) async {
    setState(() => _search = value);
    await _load();
  }

  Future<void> _selectSort(String value) async {
    setState(() => _sort = value);
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('BrickStore'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(
              child: Text(
                state.customer?.name.isNotEmpty == true
                    ? state.customer!.name
                    : 'Профиль',
                style: const TextStyle(
                  color: AppTheme.muted,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          IconButton(
            tooltip: 'Выйти',
            onPressed: () => _confirmLogout(state),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _searchBar()),
            SliverToBoxAdapter(child: _categoryBar()),
            SliverToBoxAdapter(child: _sortRow()),
            if (_loading)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              SliverFillRemaining(
                hasScrollBody: false,
                child: _ErrorView(error: _error!, onRetry: _load),
              )
            else if (_products.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      _search.isNotEmpty
                          ? 'По запросу «$_search» ничего не нашлось'
                          : 'В этой категории пока нет наборов',
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              )
            else ...[
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  child: Text(
                    'Найдено: ${_products.length}',
                    style: const TextStyle(color: AppTheme.muted, fontSize: 12.5),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                    maxCrossAxisExtent: 260,
                    mainAxisSpacing: 14,
                    crossAxisSpacing: 14,
                    childAspectRatio: 0.62,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => ProductCard(product: _products[index]),
                    childCount: _products.length,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _searchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: TextField(
        controller: _searchController,
        textInputAction: TextInputAction.search,
        onSubmitted: _submitSearch,
        decoration: InputDecoration(
          hintText: 'Найти набор…',
          prefixIcon: const Icon(Icons.search),
          suffixIcon: _searchController.text.isEmpty
              ? null
              : IconButton(
                  tooltip: 'Очистить',
                  icon: const Icon(Icons.close),
                  onPressed: () {
                    _searchController.clear();
                    _submitSearch('');
                  },
                ),
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFD8D6DD)),
          ),
        ),
      ),
    );
  }

  Widget _sortRow() {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        itemCount: _sorts.length + 1,
        separatorBuilder: (_, _) => const SizedBox(width: 6),
        itemBuilder: (context, index) {
          if (index == 0) {
            return const Center(
              child: Text(
                'Сортировка:',
                style: TextStyle(color: AppTheme.muted, fontSize: 12.5),
              ),
            );
          }
          final (value, label) = _sorts[index - 1];
          final active = _sort == value;
          return TextButton(
            onPressed: () => _selectSort(value),
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              foregroundColor: active ? AppTheme.accent : AppTheme.muted,
            ),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: active ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _categoryBar() {
    if (_categories.isEmpty) return const SizedBox(height: 12);

    return SizedBox(
      height: 58,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        itemCount: _categories.length + 1,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final isAll = index == 0;
          final category = isAll ? null : _categories[index - 1];
          final selected = _selectedCategory == category?.id;

          return ChoiceChip(
            label: Text(isAll ? 'Все наборы' : category!.title),
            selected: selected,
            onSelected: (_) => _selectCategory(isAll ? null : category!.id),
            selectedColor: AppTheme.ink,
            labelStyle: TextStyle(
              color: selected ? Colors.white : AppTheme.ink,
              fontWeight: FontWeight.w600,
            ),
            backgroundColor: Colors.white,
            side: BorderSide(
              color: selected ? AppTheme.ink : const Color(0xFFD8D6DD),
            ),
          );
        },
      ),
    );
  }

  Future<void> _confirmLogout(AppState state) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Выйти из кабинета?'),
        content: const Text('Сохранённое избранное останется на сервере.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Отмена'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Выйти'),
          ),
        ],
      ),
    );

    if (confirmed == true) await state.signOut();
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.error, required this.onRetry});

  final Object error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final message = error is ApiException
        ? (error as ApiException).message
        : 'Не удалось загрузить каталог';

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.cloud_off, size: 48, color: AppTheme.muted),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 20),
          SizedBox(
            width: 200,
            child: FilledButton(onPressed: onRetry, child: const Text('Повторить')),
          ),
        ],
      ),
    );
  }
}
