import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class DeepReadingPage extends StatelessWidget {
  final String deepText;
  final int score;
  final String? readingId;

  const DeepReadingPage({
    super.key,
    required this.deepText,
    required this.score,
    this.readingId,
  });

  String getAfterglowMain() {
    if (score >= 22) {
      return 'deep_afterglow_main_very_high'.tr();
    }
    if (score >= 12) {
      return 'deep_afterglow_main_high'.tr();
    }
    if (score >= 4) {
      return 'deep_afterglow_main_mid'.tr();
    }
    if (score >= -5) {
      return 'deep_afterglow_main_low'.tr();
    }
    return 'deep_afterglow_main_very_low'.tr();
  }

  String getAfterglowSub() {
    if (score >= 22) {
      return 'deep_afterglow_sub_very_high'.tr();
    }
    if (score >= 12) {
      return 'deep_afterglow_sub_high'.tr();
    }
    if (score >= 4) {
      return 'deep_afterglow_sub_mid'.tr();
    }
    if (score >= -5) {
      return 'deep_afterglow_sub_low'.tr();
    }
    return 'deep_afterglow_sub_very_low'.tr();
  }

  List<TextSpan> _buildFormattedText() {
    final lines = deepText.split('\n');
    final spans = <TextSpan>[];

    for (final line in lines) {
      final trimmed = line.trim();
      final isSection = trimmed.startsWith('【') && trimmed.endsWith('】');

      if (trimmed.isEmpty) {
        spans.add(const TextSpan(text: '\n'));
        continue;
      }

      if (isSection) {
        spans.add(const TextSpan(text: '\n'));
        spans.add(
          TextSpan(
            text: '$trimmed\n',
            style: TextStyle(
              fontSize: 15,
              height: 2.05,
              fontWeight: FontWeight.w700,
              color: Colors.white.withOpacity(0.86),
              letterSpacing: 0.12,
            ),
          ),
        );
      } else {
        spans.add(
          TextSpan(
            text: '$line\n',
            style: TextStyle(
              fontSize: 15.5,
              height: 2.08,
              fontWeight: FontWeight.w500,
              color: Colors.white.withOpacity(0.82),
              letterSpacing: 0.04,
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
    final contentWidth = width > 900 ? 740.0 : double.infinity;
    final horizontalPadding = width > 700 ? 30.0 : 22.0;

    return Scaffold(
      backgroundColor: const Color(0xFF0D0E1C),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D0E1C).withOpacity(0.92),
        elevation: 0,
        foregroundColor: Colors.white.withOpacity(0.92),
        title: Text(
          'deep_reading_appbar'.tr(),
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.4,
            color: Colors.white.withOpacity(0.88),
          ),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: contentWidth),
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: EdgeInsets.fromLTRB(
                horizontalPadding,
                18,
                horizontalPadding,
                88,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 14),
                  Center(
                    child: Container(
                      width: 90,
                      height: 90,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFF8B6BFF), Color(0xFF6246EA)],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF7F5AF0).withOpacity(0.34),
                            blurRadius: 42,
                            spreadRadius: 1,
                            offset: const Offset(0, 18),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.auto_awesome,
                        color: Colors.white,
                        size: 40,
                      ),
                    ),
                  ),
                  const SizedBox(height: 42),
                  Text(
                    'deep_reading_title'.tr(),
                    style: TextStyle(
                      fontSize: width > 700 ? 28 : 25,
                      fontWeight: FontWeight.w800,
                      height: 1.45,
                      color: Colors.white.withOpacity(0.94),
                      letterSpacing: 0.2,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'deep_reading_subtitle'.tr(),
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.9,
                      color: Colors.white.withOpacity(0.46),
                    ),
                  ),
                  const SizedBox(height: 36),
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.fromLTRB(
                      width > 700 ? 30 : 24,
                      30,
                      width > 700 ? 30 : 24,
                      36,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF18192E).withOpacity(0.92),
                      borderRadius: BorderRadius.circular(32),
                      border: Border.all(
                        color: const Color(0xFF7F5AF0).withOpacity(0.14),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.20),
                          blurRadius: 26,
                          offset: const Offset(0, 18),
                        ),
                      ],
                    ),
                    child: RichText(
                      text: TextSpan(children: _buildFormattedText()),
                    ),
                  ),
                  const SizedBox(height: 58),
                  Center(
                    child: Container(
                      width: 42,
                      height: 1,
                      color: Colors.white.withOpacity(0.12),
                    ),
                  ),
                  const SizedBox(height: 36),
                  Center(
                    child: Text(
                      getAfterglowMain(),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 15,
                        height: 2.22,
                        color: Colors.white.withOpacity(0.58),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Center(
                    child: Text(
                      getAfterglowSub(),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        height: 2.08,
                        color: Colors.white.withOpacity(0.34),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  if (readingId != null && readingId!.isNotEmpty) ...[
                    const SizedBox(height: 42),
                    Center(
                      child: Text(
                        'Reading ID  $readingId',
                        style: TextStyle(
                          fontSize: 11,
                          letterSpacing: 1.2,
                          color: Colors.white.withOpacity(0.22),
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 78),
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
                        padding: const EdgeInsets.symmetric(vertical: 19),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(36),
                        ),
                      ),
                      child: Text(
                        'back_to_result'.tr(),
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


