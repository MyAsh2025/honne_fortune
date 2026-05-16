import 'package:flutter/material.dart';

class DeepReadingPage extends StatelessWidget {
  final String deepText;
  final int score;

  const DeepReadingPage({
    super.key,
    required this.deepText,
    required this.score,
  });

  String getAfterglowMain() {
    if (score >= 22) {
      return 'あなたのやさしさは、\nもう十分に誰かを支えてきました。';
    }
    if (score >= 12) {
      return 'あなたの心は、\nまだ誰かを大切にしたいと願っています。';
    }
    if (score >= 4) {
      return '言えなかった本音は、\nまだあなたの中で静かに待っています。';
    }
    if (score >= -5) {
      return '考えすぎてしまう心も、\nあなたを守ろうとしてきた一部です。';
    }
    return '閉じてきた心にも、\nちゃんと理由がありました。';
  }

  String getAfterglowSub() {
    if (score >= 22) {
      return '今は、誰かのためではなく、自分を戻す時間が必要なのかもしれません。';
    }
    if (score >= 12) {
      return 'でもその前に、あなた自身の声も少しだけ聞いてあげてください。';
    }
    if (score >= 4) {
      return '急がなくて大丈夫です。気づけた時点で、もう少し進んでいます。';
    }
    if (score >= -5) {
      return '答えを急がず、まずは心が疲れていることを責めないでください。';
    }
    return '無理に開かなくても大丈夫です。安心できる場所からでいいのです。';
  }

  List<TextSpan> _buildFormattedText() {
    final lines = deepText.split('\n');
    final spans = <TextSpan>[];

    for (final line in lines) {
      final trimmed = line.trim();
      final isSection = trimmed.startsWith('【') && trimmed.endsWith('】');

      if (isSection) {
        spans.add(const TextSpan(text: '\n'));
        spans.add(
          TextSpan(
            text: '$trimmed\n',
            style: const TextStyle(
              fontSize: 17,
              height: 2.25,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              letterSpacing: 0.2,
            ),
          ),
        );
      } else {
        spans.add(
          TextSpan(
            text: '$line\n',
            style: const TextStyle(
              fontSize: 16,
              height: 2.15,
              fontWeight: FontWeight.w500,
              color: Colors.white,
            ),
          ),
        );
      }
    }

    return spans;
  }

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final contentWidth = width > 900 ? 760.0 : double.infinity;

    return Scaffold(
      backgroundColor: const Color(0xFF0F1020),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.white,
        title: const Text(
          '深層リーディング',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.4,
          ),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: contentWidth),
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(30, 18, 30, 90),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),
                  Center(
                    child: Container(
                      width: 92,
                      height: 92,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Color(0xFF8B6BFF),
                            Color(0xFF6246EA),
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF7F5AF0).withOpacity(0.36),
                            blurRadius: 40,
                            spreadRadius: 2,
                            offset: const Offset(0, 16),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.auto_awesome,
                        color: Colors.white,
                        size: 42,
                      ),
                    ),
                  ),
                  const SizedBox(height: 42),
                  const Text(
                    'あなたの深層リーディング',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      height: 1.5,
                      color: Colors.white,
                      letterSpacing: 0.2,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    '今の心の流れを、静かに見つめていきます。',
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.9,
                      color: Colors.white.withOpacity(0.50),
                    ),
                  ),
                  const SizedBox(height: 34),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(26, 28, 26, 34),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1A1B31),
                      borderRadius: BorderRadius.circular(34),
                      border: Border.all(
                        color: const Color(0xFF7F5AF0).withOpacity(0.16),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.22),
                          blurRadius: 24,
                          offset: const Offset(0, 16),
                        ),
                      ],
                    ),
                    child: RichText(
                      text: TextSpan(
                        children: _buildFormattedText(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 52),
                  Center(
                    child: Container(
                      width: 42,
                      height: 1,
                      color: Colors.white12,
                    ),
                  ),
                  const SizedBox(height: 34),
                  Center(
                    child: Text(
                      getAfterglowMain(),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 15,
                        height: 2.2,
                        color: Colors.white.withOpacity(0.56),
                      ),
                    ),
                  ),
                  const SizedBox(height: 22),
                  Center(
                    child: Text(
                      getAfterglowSub(),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        height: 2,
                        color: Colors.white.withOpacity(0.36),
                      ),
                    ),
                  ),
                  const SizedBox(height: 74),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF7F5AF0),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(36),
                        ),
                      ),
                      child: const Text(
                        '結果へ戻る',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
