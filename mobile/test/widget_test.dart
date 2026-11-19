import 'package:brickstore_mobile/main.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('Экран входа показывается гостю', (tester) async {
    // Сохранённого токена нет, поэтому приложение не пойдёт на сервер
    // и сразу покажет экран входа.
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const BrickStoreApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('BrickStore'), findsWidgets);
    expect(find.text('Личный кабинет'), findsOneWidget);
  });
}
