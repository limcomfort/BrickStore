/// Модели данных BrickStore под контракт Payload CMS.
///
/// Разметка полей повторяет `src/payload-types.ts` из веб-части проекта,
/// поэтому при изменении коллекций в CMS модели нужно править синхронно.
library;

/// Товар из коллекции `products`.
class Product {
  const Product({
    required this.id,
    required this.title,
    required this.slug,
    required this.price,
    this.summary,
    this.oldPrice,
    this.pieces,
    this.ageMin,
    this.article,
    this.inStock = true,
    this.featured = false,
    this.imageUrl,
    this.gallery = const [],
    this.description,
    this.categoryTitle,
  });

  final int id;
  final String title;
  final String slug;
  final double price;
  final String? summary;
  final double? oldPrice;
  final int? pieces;
  final int? ageMin;
  final String? article;
  final bool inStock;
  final bool featured;
  final String? imageUrl;

  /// Дополнительные ракурсы из `gallery` — их показывает карточка товара.
  final List<String> gallery;

  /// Описание из richText, сведённое к простому тексту.
  final String? description;

  /// Название серии: в карточке веб-версии показывается над заголовком.
  final String? categoryTitle;

  /// Есть ли скидка: старая цена задана и больше текущей.
  bool get hasDiscount => oldPrice != null && oldPrice! > price;

  /// Размер скидки в процентах, округлённый вниз.
  int get discountPercent =>
      hasDiscount ? ((1 - price / oldPrice!) * 100).floor() : 0;

  factory Product.fromJson(Map<String, dynamic> json) {
    final category = json['category'];
    final gallery = json['gallery'];

    return Product(
      id: json['id'] as int,
      title: json['title'] as String? ?? 'Без названия',
      slug: json['slug'] as String? ?? '',
      price: _toDouble(json['price']) ?? 0,
      summary: json['summary'] as String?,
      oldPrice: _toDouble(json['oldPrice']),
      pieces: _toInt(json['pieces']),
      ageMin: _toInt(json['ageMin']),
      article: json['article'] as String?,
      inStock: json['inStock'] as bool? ?? true,
      featured: json['featured'] as bool? ?? false,
      imageUrl: _mediaUrl(json['heroImage']),
      gallery: gallery is List
          ? gallery.map(_mediaUrl).whereType<String>().toList(growable: false)
          : const [],
      description: _richText(json['description']),
      categoryTitle: category is Map<String, dynamic> ? category['title'] as String? : null,
    );
  }
}

/// Категория из коллекции `categories`.
class Category {
  const Category({required this.id, required this.title, this.slug, this.productCount = 0});

  final int id;
  final String title;
  final String? slug;
  final int productCount;

  factory Category.fromJson(Map<String, dynamic> json) {
    final count = json['productCount'];
    return Category(
      id: json['id'] as int,
      title: json['title'] as String? ?? 'Без названия',
      slug: json['slug'] as String?,
      productCount: count is int ? count : 0,
    );
  }
}

/// Покупатель, вернувшийся в ответе на вход.
class Customer {
  const Customer({required this.id, required this.email, required this.name});

  final int id;
  final String email;
  final String name;

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id'] as int,
      email: json['email'] as String? ?? '',
      name: json['name'] as String? ?? '',
    );
  }
}

/// Ответ `POST /api/account/session` для мобильного клиента.
class LoginResult {
  const LoginResult({required this.customer, required this.token});

  final Customer customer;
  final String token;

  factory LoginResult.fromJson(Map<String, dynamic> json) {
    final token = json['token'];
    if (token is! String || token.isEmpty) {
      throw const ApiException(
        statusCode: 200,
        message: 'Сервер не вернул токен сессии',
      );
    }
    return LoginResult(
      customer: Customer.fromJson(json['customer'] as Map<String, dynamic>),
      token: token,
    );
  }
}

/// Ошибка обращения к API: статус плюс текст, пригодный для показа пользователю.
class ApiException implements Exception {
  const ApiException({required this.statusCode, required this.message});

  final int statusCode;
  final String message;

  bool get isUnauthorized => statusCode == 401;

  @override
  String toString() => message;
}

double? _toDouble(Object? value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

int? _toInt(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value);
  return null;
}

/// Payload отдаёт `upload`-поле либо числом (без depth), либо объектом с `url`.
String? _mediaUrl(Object? value) {
  if (value is int) return null;
  final media = value as Map<String, dynamic>?;
  final url = media?['url'];
  final sizes = media?['sizes'];

  // Для карточек достаточно уменьшенной копии, если CMS её сгенерировала.
  if (sizes is Map<String, dynamic>) {
    for (final key in const ['card', 'thumbnail', 'small']) {
      final size = sizes[key];
      if (size is Map<String, dynamic> && size['url'] is String) {
        return size['url'] as String;
      }
    }
  }

  if (url is int) return null;
  return url is String ? url : null;
}

/// Lexical хранит richText деревом. В мобильном клиенте достаточно плоского
/// текста: собираем все `text`-узлы и склеиваем абзацы пустой строкой.
String? _richText(Object? value) {
  if (value is! Map<String, dynamic>) return null;
  final root = value['root'];
  if (root is! Map<String, dynamic>) return null;
  final paragraphs = root['children'];
  if (paragraphs is! List) return null;

  final blocks = <String>[];
  for (final block in paragraphs) {
    if (block is! Map<String, dynamic>) continue;
    final parts = <String>[];
    _collectText(block, parts);
    final text = parts.join(' ').replaceAll(RegExp(r'\s+'), ' ').trim();
    if (text.isNotEmpty) blocks.add(text);
  }
  return blocks.isEmpty ? null : blocks.join('\n\n');
}

void _collectText(Object? node, List<String> out) {
  if (node is! Map<String, dynamic>) return;
  if (node['type'] == 'text' && node['text'] is String) out.add(node['text'] as String);
  final children = node['children'];
  if (children is List) {
    for (final child in children) {
      _collectText(child, out);
    }
  }
}
