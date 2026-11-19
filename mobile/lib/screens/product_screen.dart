import 'package:flutter/material.dart';

import '../data/app_state.dart';
import '../data/models.dart';
import '../ui/remote_image.dart';
import '../ui/theme.dart';

/// Карточка набора: большое изображение, характеристики, цена, избранное.
class ProductScreen extends StatelessWidget {
  const ProductScreen({super.key, required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final favorite = state.isFavorite(product.id);

    return Scaffold(
      appBar: AppBar(
        title: Text(product.title, overflow: TextOverflow.ellipsis),
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          AspectRatio(
            aspectRatio: 1.2,
            child: Container(
              color: const Color(0xFFF0EFF3),
              child: product.imageUrl == null
                  ? const Center(
                      child: Icon(Icons.toys_outlined,
                          size: 64, color: Color(0xFFB9B6C2)),
                    )
                  : RemoteImage(
                      product.imageUrl!,
                      fit: BoxFit.contain,
                      placeholder: const Center(
                        child: Icon(Icons.toys_outlined,
                            size: 64, color: Color(0xFFB9B6C2)),
                      ),
                    ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (product.article != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Text(
                      'Артикул ${product.article}',
                      style: const TextStyle(
                        color: AppTheme.muted,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                Text(
                  product.title,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                  ),
                ),
                if (product.summary != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    product.summary!,
                    style: const TextStyle(fontSize: 15, height: 1.45),
                  ),
                ],
                const SizedBox(height: 18),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      formatPrice(product.price),
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    if (product.hasDiscount) ...[
                      const SizedBox(width: 10),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          formatPrice(product.oldPrice!),
                          style: const TextStyle(
                            fontSize: 15,
                            color: AppTheme.muted,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  product.inStock ? 'В наличии' : 'Нет в наличии',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: product.inStock
                        ? const Color(0xFF0F6B2C)
                        : AppTheme.accent,
                  ),
                ),
                const SizedBox(height: 20),
                _specs(),
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: () async {
                    try {
                      await state.toggleFavorite(product.id);
                    } catch (error) {
                      if (context.mounted) showError(context, error);
                    }
                  },
                  icon: Icon(favorite ? Icons.favorite : Icons.favorite_border),
                  label: Text(
                    favorite ? 'В избранном' : 'В избранное',
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: favorite ? AppTheme.ink : AppTheme.accent,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _specs() {
    final rows = <(String, String)>[
      if (product.pieces != null) ('Деталей', '${product.pieces}'),
      if (product.ageMin != null) ('Возраст', '${product.ageMin}+'),
    ];
    if (rows.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          for (var i = 0; i < rows.length; i++) ...[
            if (i > 0) const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      rows[i].$1,
                      style: const TextStyle(color: AppTheme.muted),
                    ),
                  ),
                  Text(
                    rows[i].$2,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
