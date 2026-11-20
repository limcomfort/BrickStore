import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../data/app_state.dart';
import '../data/models.dart';
import 'theme.dart';

/// Режим заявки: заказ по телефону или вопрос по набору.
enum InquiryMode { phone, question }

/// Открывает нижнюю шторку с формой заявки.
Future<void> showInquirySheet(
  BuildContext context, {
  required InquiryMode mode,
  required Product product,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
    ),
    builder: (_) => _InquirySheet(mode: mode, product: product),
  );
}

class _InquirySheet extends StatefulWidget {
  const _InquirySheet({required this.mode, required this.product});

  final InquiryMode mode;
  final Product product;

  @override
  State<_InquirySheet> createState() => _InquirySheetState();
}

class _InquirySheetState extends State<_InquirySheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _contactController = TextEditingController();
  final _messageController = TextEditingController();

  String? _phone;
  String? _telHref;
  bool _sending = false;
  bool _sent = false;
  String? _error;

  bool get _isPhone => widget.mode == InquiryMode.phone;

  @override
  void initState() {
    super.initState();
    final state = AppScope.of(context);
    final customer = state.customer;
    if (customer != null) {
      _nameController.text = customer.name;
      _contactController.text = customer.email;
    }
    _loadPhone();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _contactController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _loadPhone() async {
    try {
      final settings = await AppScope.of(context).api.fetchSettings();
      final raw = (settings['contactPhone'] as String?)?.trim();
      if (!mounted || raw == null || raw.isEmpty) return;
      setState(() {
        _phone = raw;
        _telHref = 'tel:+${raw.replaceAll(RegExp(r'[^\d]'), '')}';
      });
    } catch (_) {
      // Телефон — дополнительная информация: без него форма остаётся рабочей.
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _sending = true;
      _error = null;
    });

    final message = _isPhone
        ? 'Заказ по телефону: «${widget.product.title}» (арт. ${widget.product.article ?? widget.product.id}).'
        : _messageController.text.trim();

    try {
      await AppScope.of(context).api.sendInquiry(
            name: _nameController.text.trim(),
            contact: _contactController.text.trim(),
            message: message,
            productId: widget.product.id,
          );
      if (!mounted) return;
      setState(() {
        _sent = true;
        _sending = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error is ApiException ? error.message : 'Не удалось отправить заявку';
        _sending = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final padding = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: padding),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(22, 20, 22, 26),
        child: _sent ? _success() : _form(),
      ),
    );
  }

  Widget _success() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text('✅', style: TextStyle(fontSize: 40)),
        const SizedBox(height: 10),
        Text(
          _isPhone ? 'Заявка принята' : 'Вопрос отправлен',
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        Text(
          _isPhone
              ? 'Мы перезвоним в течение рабочего дня, чтобы подтвердить заказ набора «${widget.product.title}».'
              : 'Мы ответим на указанный контакт в течение рабочего дня.',
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppTheme.muted, height: 1.45),
        ),
        const SizedBox(height: 20),
        if (_isPhone && _telHref != null && _phone != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: FilledButton(
              onPressed: () => SystemChannels.platform
                  .invokeMethod<void>('Clipboard.setData', {'text': _phone}),
              style: FilledButton.styleFrom(backgroundColor: AppTheme.ink),
              child: Text(_phone!),
            ),
          ),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: () => Navigator.pop(context),
            style: FilledButton.styleFrom(backgroundColor: AppTheme.accent),
            child: const Text('Готово'),
          ),
        ),
      ],
    );
  }

  Widget _form() {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            _isPhone ? 'Заказать по телефону' : 'Вопрос по набору',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          Text(
            widget.product.title,
            style: const TextStyle(color: AppTheme.muted, fontSize: 13.5),
          ),
          const SizedBox(height: 16),
          if (_isPhone && _phone != null) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF4F3F6),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'ПОЗВОНИТЕ НАМ',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.muted,
                      letterSpacing: 0.6,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _phone!,
                    style: const TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.accent,
                    ),
                  ),
                  const Text(
                    'Ежедневно с 10:00 до 21:00',
                    style: TextStyle(fontSize: 12.5, color: AppTheme.muted),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'или оставьте номер — перезвоним сами',
              style: TextStyle(fontSize: 13, color: AppTheme.muted),
            ),
            const SizedBox(height: 12),
          ],
          TextFormField(
            controller: _nameController,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
              labelText: 'Как к вам обращаться',
              border: OutlineInputBorder(),
            ),
            validator: (value) =>
                (value == null || value.trim().isEmpty) ? 'Укажите имя' : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _contactController,
            keyboardType: TextInputType.text,
            decoration: InputDecoration(
              labelText: _isPhone ? 'Телефон для звонка' : 'Телефон или e-mail',
              border: const OutlineInputBorder(),
            ),
            validator: (value) {
              final text = value?.trim() ?? '';
              if (text.isEmpty) return 'Укажите контакт';
              final isEmail = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$').hasMatch(text);
              final isPhone = RegExp(r'^\+?[\d\s()\-]{7,}$').hasMatch(text);
              return isEmail || isPhone ? null : 'Укажите корректный телефон или e-mail';
            },
          ),
          if (!_isPhone) ...[
            const SizedBox(height: 12),
            TextFormField(
              controller: _messageController,
              maxLines: 4,
              maxLength: 1000,
              decoration: const InputDecoration(
                labelText: 'Ваш вопрос',
                hintText: 'Уточните наличие, комплектацию или срок доставки',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
              ),
              validator: (value) {
                final text = value?.trim() ?? '';
                if (text.length < 10) return 'Опишите вопрос: минимум 10 символов';
                return null;
              },
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 10),
            Text(_error!, style: const TextStyle(color: AppTheme.accent)),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: FilledButton(
                  onPressed: _sending ? null : _submit,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.accent,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text(
                    _sending
                        ? 'Отправляем…'
                        : (_isPhone ? 'Жду звонка' : 'Отправить вопрос'),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton(
                  onPressed: _sending ? null : () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Отмена'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
