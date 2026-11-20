import 'package:flutter/material.dart';

import '../data/app_state.dart';
import '../data/models.dart';
import '../ui/inquiry_sheet.dart';
import '../ui/remote_image.dart';
import '../ui/theme.dart';

/// Карточка набора: галерея, характеристики, описание и действия —
/// «Заказать по телефону», «Задать вопрос», избранное.
class ProductScreen extends StatelessWidget {
  const ProductScreen({super.key, required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final favorite = state.isFavorite(product.id);
    final images = <String>[
      if (product.imageUrl != null) product.imageUrl!,
      ...product.gallery.where((url) => url != product.imageUrl),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(product.title, overflow: TextOverflow.ellipsis),
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          _gallery(images),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (product.categoryTitle != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Text(
                      product.categoryTitle!.toUpperCase(),
                      style: const TextStyle(
                        color: AppTheme.muted,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
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
                const SizedBox(height: 10),
                Row(
                  children: [
                    if (product.article != null)
                      Padding(
                        padding: const EdgeInsets.only(right: 12),
                        child: Text(
                          'Арт. ${product.article}',
                          style: const TextStyle(
                            color: AppTheme.muted,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    _stockBadge(),
                  ],
                ),
                if (product.summary != null) ...[
                  const SizedBox(height: 12),
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
                const SizedBox(height: 18),
                _actions(context, state, favorite),
                const SizedBox(height: 20),
                _specs(),
              ],
            ),
          ),
          if (product.description != null) _description(product.description!),
        ],
      ),
    );
  }

  Widget _gallery(List<String> images) {
    if (images.isEmpty) {
      return Container(
        height: 280,
        color: const Color(0xFFF0EFF3),
        child: const Center(
          child: Icon(Icons.toys_outlined, size: 64, color: Color(0xFFB9B6C2)),
        ),
      );
    }

    return Container(
      height: 300,
      color: const Color(0xFFF7F7F9),
      child: PageView(
        children: [
          for (final url in images)
            Padding(
              padding: const EdgeInsets.all(16),
              child: RemoteImage(
                url,
                fit: BoxFit.contain,
                placeholder: const Center(
                  child: Icon(Icons.toys_outlined,
                      size: 64, color: Color(0xFFB9B6C2)),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _stockBadge() {
    final inStock = product.inStock;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: inStock ? const Color(0xFFE6F4EA) : const Color(0xFFF1F0F3),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        inStock ? '✓ В наличии' : 'Под заказ',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: inStock ? const Color(0xFF0F6B2C) : AppTheme.muted,
        ),
      ),
    );
  }

  Widget _actions(BuildContext context, AppState state, bool favorite) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: FilledButton(
                onPressed: () => showInquirySheet(
                  context,
                  mode: InquiryMode.phone,
                  product: product,
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.accent,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text(
                  'Заказать по телефону',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton(
                onPressed: () => showInquirySheet(
                  context,
                  mode: InquiryMode.question,
                  product: product,
                ),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text('Задать вопрос'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () async {
              try {
                await state.toggleFavorite(product.id);
              } catch (error) {
                if (context.mounted) showError(context, error);
              }
            },
            icon: Icon(favorite ? Icons.favorite : Icons.favorite_border),
            label: Text(favorite ? 'В избранном' : 'В избранное'),
          ),
        ),
      ],
    );
  }

  Widget _specs() {
    final rows = <(String, String)>[
      if (product.pieces != null) ('Деталей', '${product.pieces}'),
      if (product.ageMin != null) ('Возраст', '${product.ageMin}+'),
      if (product.categoryTitle != null) ('Серия', product.categoryTitle!),
      if (product.article != null) ('Артикул', product.article!),
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

  Widget _description(String text) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 26, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Об этом наборе',
            style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 10),
          Text(text, style: const TextStyle(fontSize: 15, height: 1.5)),
        ],
      ),
    );
  }
}
