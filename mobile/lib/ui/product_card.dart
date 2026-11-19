import 'package:flutter/material.dart';

import '../data/app_state.dart';
import '../data/models.dart';
import '../screens/product_screen.dart';
import 'remote_image.dart';
import 'theme.dart';

/// Карточка набора в сетке каталога: картинка, название, цена, сердечко.
class ProductCard extends StatelessWidget {
  const ProductCard({super.key, required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final favorite = state.isFavorite(product.id);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => ProductScreen(product: product)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: _image()),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 4, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        formatPrice(product.price),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      if (product.hasDiscount) ...[
                        const SizedBox(width: 6),
                        Text(
                          formatPrice(product.oldPrice!),
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.muted,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                      const Spacer(),
                      _favoriteButton(context, state, favorite),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _image() {
    final url = product.imageUrl;
    return Stack(
      fit: StackFit.expand,
      children: [
        if (url != null)
          RemoteImage(url, placeholder: _placeholder())
        else
          _placeholder(),
        if (product.hasDiscount)
          Positioned(
            top: 10,
            left: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.accent,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '−${product.discountPercent}%',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _placeholder() => Container(
        color: const Color(0xFFF0EFF3),
        child: const Center(
          child: Icon(Icons.toys_outlined, size: 36, color: Color(0xFFB9B6C2)),
        ),
      );

  Widget _favoriteButton(BuildContext context, AppState state, bool favorite) {
    return IconButton(
      visualDensity: VisualDensity.compact,
      tooltip: favorite ? 'Убрать из избранного' : 'В избранное',
      onPressed: () async {
        try {
          await state.toggleFavorite(product.id);
        } catch (error) {
          if (context.mounted) showError(context, error);
        }
      },
      icon: Icon(
        favorite ? Icons.favorite : Icons.favorite_border,
        color: favorite ? AppTheme.accent : AppTheme.muted,
      ),
    );
  }
}
