import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../data/api_client.dart';

/// Payload отдаёт путь вида `/api/media/file/...`. На эмуляторе он
/// указывает на CMS, поэтому дополняем его базовым адресом API.
String resolveMediaUrl(String url) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  final base = kApiBaseUrl;
  return url.startsWith('/') ? '$base$url' : '$base/$url';
}

/// Изображение товара из CMS.
///
/// В демо-данных проекта медиа хранятся в SVG, который `Image.network`
/// декодировать не умеет, поэтому для `.svg` используется `flutter_svg`.
class RemoteImage extends StatelessWidget {
  const RemoteImage(
    this.url, {
    super.key,
    this.fit = BoxFit.cover,
    this.placeholder,
  });

  final String url;
  final BoxFit fit;

  /// Что показать, пока картинка грузится или если она недоступна.
  final Widget? placeholder;

  static bool _isSvg(String path) {
    final clean = path.split('?').first.toLowerCase();
    return clean.endsWith('.svg');
  }

  @override
  Widget build(BuildContext context) {
    final absolute = resolveMediaUrl(url);
    final fallback = placeholder ?? const SizedBox.shrink();

    if (_isSvg(absolute)) {
      return SvgPicture.network(
        absolute,
        fit: fit,
        placeholderBuilder: (_) => fallback,
      );
    }

    return Image.network(
      absolute,
      fit: fit,
      errorBuilder: (_, _, _) => fallback,
      loadingBuilder: (context, child, progress) =>
          progress == null ? child : fallback,
    );
  }
}
