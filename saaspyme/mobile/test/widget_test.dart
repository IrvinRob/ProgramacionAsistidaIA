import 'package:flutter_test/flutter_test.dart';
import 'package:gestorpyme_mobile/main.dart';

void main() {
  testWidgets('App compila el widget raíz', (WidgetTester tester) async {
    await tester.pumpWidget(const GestorPymeApp());
    expect(find.text('GestorPyme'), findsWidgets);
  });
}
