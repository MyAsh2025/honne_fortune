import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'deep_reading_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EasyLocalization.ensureInitialized();

  runApp(
    EasyLocalization(
      supportedLocales: const [Locale('ja'), Locale('en')],
      path: 'assets/translations',
      fallbackLocale: const Locale('ja'),
      child: const HonneApp(),
    ),
  );
}

class HonneApp extends StatelessWidget {
  const HonneApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Inner Fortune',
      debugShowCheckedModeBanner: false,
      locale: context.locale,
      supportedLocales: context.supportedLocales,
      localizationsDelegates: context.localizationDelegates,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: AppColors.background,
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
      ),
      home: const HomePage(),
    );
  }
}

class AppColors {
  static const background = Color(0xFF141420);
  static const purple1 = Color(0xFF7F5AF0);
  static const purple2 = Color(0xFF6246EA);
  static const card = Color(0xFF1E1E2E);
  static const cardSoft = Color(0xFF242436);
}

class FortuneAnswer {
  final int index;
  final String questionKey;
  final String answerKey;
  final int value;

  const FortuneAnswer({
    required this.index,
    required this.questionKey,
    required this.answerKey,
    required this.value,
  });

  Map<String, dynamic> toJson() {
    return {
      'index': index,
      'questionKey': questionKey,
      'answerKey': answerKey,
      'value': value,
    };
  }
}

class HonneFortuneApi {
  static const String endpoint = 'http://127.0.0.1:8787/fortune';

  static Future<String> generateFortune({
    required int score,
    required List<FortuneAnswer> answers,
    required String locale,
  }) async {
    final response = await http
        .post(
          Uri.parse(endpoint),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'score': score,
            'locale': locale,
            'answers': answers.map((answer) => answer.toJson()).toList(),
          }),
        )
        .timeout(const Duration(seconds: 18));

    final data = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode != 200 || data['ok'] != true) {
      throw Exception(data['error'] ?? 'Failed to generate fortune.');
    }

    final text = (data['text'] ?? '').toString().trim();

    if (text.isEmpty) {
      throw Exception('Empty response from local model.');
    }

    return text;
  }
}

Widget languageButton(BuildContext context) {
  final isJa = context.locale.languageCode == 'ja';

  return GestureDetector(
    onTap: () {
      context.setLocale(isJa ? const Locale('en') : const Locale('ja'));
    },
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.08),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.12)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.language, size: 16, color: Colors.white),
          const SizedBox(width: 6),
          Text(
            isJa ? 'EN' : '日本語',
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    ),
  );
}

class PrimaryGradientButton extends StatefulWidget {
  final String label;
  final VoidCallback onTap;

  const PrimaryGradientButton({
    super.key,
    required this.label,
    required this.onTap,
  });

  @override
  State<PrimaryGradientButton> createState() => _PrimaryGradientButtonState();
}

class _PrimaryGradientButtonState extends State<PrimaryGradientButton> {
  bool pressed = false;

  void _setPressed(bool value) {
    if (!mounted) return;
    setState(() => pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: widget.onTap,
      onTapDown: (_) => _setPressed(true),
      onTapUp: (_) => _setPressed(false),
      onTapCancel: () => _setPressed(false),
      onLongPressEnd: (_) => _setPressed(false),
      child: AnimatedScale(
        scale: pressed ? 0.975 : 1.0,
        duration: const Duration(milliseconds: 90),
        curve: Curves.easeOut,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(30),
            gradient: const LinearGradient(
              colors: [AppColors.purple1, AppColors.purple2],
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.purple1.withOpacity(pressed ? 0.18 : 0.30),
                blurRadius: pressed ? 16 : 26,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Center(
            child: Text(
              widget.label,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ),
    );
  }
}

class FadeInSection extends StatefulWidget {
  final Widget child;
  final int delayMs;

  const FadeInSection({super.key, required this.child, required this.delayMs});

  @override
  State<FadeInSection> createState() => _FadeInSectionState();
}

class _FadeInSectionState extends State<FadeInSection> {
  bool visible = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration(milliseconds: widget.delayMs), () {
      if (mounted) setState(() => visible = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      opacity: visible ? 1 : 0,
      duration: const Duration(milliseconds: 560),
      curve: Curves.easeOutCubic,
      child: AnimatedSlide(
        offset: visible ? Offset.zero : const Offset(0, 0.045),
        duration: const Duration(milliseconds: 560),
        curve: Curves.easeOutCubic,
        child: widget.child,
      ),
    );
  }
}

class PressableAnswerButton extends StatefulWidget {
  final String label;
  final VoidCallback onTap;

  const PressableAnswerButton({
    super.key,
    required this.label,
    required this.onTap,
  });

  @override
  State<PressableAnswerButton> createState() => _PressableAnswerButtonState();
}

class _PressableAnswerButtonState extends State<PressableAnswerButton> {
  bool pressed = false;

  void _setPressed(bool value) {
    if (!mounted) return;
    setState(() => pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.onTap,
        onTapDown: (_) => _setPressed(true),
        onTapUp: (_) => _setPressed(false),
        onTapCancel: () => _setPressed(false),
        onLongPressEnd: (_) => _setPressed(false),
        child: AnimatedScale(
          scale: pressed ? 0.975 : 1.0,
          duration: const Duration(milliseconds: 90),
          curve: Curves.easeOut,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 130),
            curve: Curves.easeOut,
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 18),
            decoration: BoxDecoration(
              color: pressed
                  ? AppColors.purple1.withOpacity(0.22)
                  : AppColors.cardSoft,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: pressed
                    ? AppColors.purple1.withOpacity(0.45)
                    : Colors.white.withOpacity(0.08),
              ),
              boxShadow: pressed
                  ? [
                      BoxShadow(
                        color: AppColors.purple1.withOpacity(0.18),
                        blurRadius: 18,
                        offset: const Offset(0, 8),
                      ),
                    ]
                  : [],
            ),
            child: Center(
              child: Text(
                widget.label,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String? lastReadingId;
  String? lastDeepText;
  int? lastScore;

  @override
  void initState() {
    super.initState();
    _loadLastReading();
  }

  Future<void> _loadLastReading() async {
    final prefs = await SharedPreferences.getInstance();

    if (!mounted) return;

    setState(() {
      lastReadingId = prefs.getString('last_reading_id');
      lastDeepText = prefs.getString('last_deep_text');
      lastScore = prefs.getInt('last_score');
    });
  }

  bool get hasLastReading {
    return lastReadingId != null &&
        lastReadingId!.isNotEmpty &&
        lastDeepText != null &&
        lastDeepText!.isNotEmpty &&
        lastScore != null;
  }

  void openLastReading() {
    if (!hasLastReading) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DeepReadingPage(
          deepText: lastDeepText!,
          score: lastScore!,
          readingId: lastReadingId,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Align(
                  alignment: Alignment.topRight,
                  child: languageButton(context),
                ),
                const SizedBox(height: 46),
                FadeInSection(
                  delayMs: 60,
                  child: Container(
                    width: 98,
                    height: 98,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        colors: [AppColors.purple1, AppColors.purple2],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.purple1.withOpacity(0.42),
                          blurRadius: 34,
                          offset: const Offset(0, 12),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.visibility,
                      color: Colors.white,
                      size: 46,
                    ),
                  ),
                ),
                const SizedBox(height: 30),
                FadeInSection(
                  delayMs: 160,
                  child: Text(
                    'app_title'.tr(),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 34,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                FadeInSection(
                  delayMs: 260,
                  child: Text(
                    'app_subtitle'.tr(),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 15,
                      color: Colors.white.withOpacity(0.72),
                      height: 1.7,
                    ),
                  ),
                ),
                if (hasLastReading) ...[
                  const SizedBox(height: 34),
                  FadeInSection(
                    delayMs: 320,
                    child: GestureDetector(
                      onTap: openLastReading,
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.045),
                          borderRadius: BorderRadius.circular(26),
                          border: Border.all(
                            color: AppColors.purple1.withOpacity(0.18),
                          ),
                        ),
                        child: Column(
                          children: [
                            Text(
                              'previous_reading'.tr(),
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: Colors.white.withOpacity(0.72),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              lastReadingId ?? '',
                              style: TextStyle(
                                fontSize: 11,
                                letterSpacing: 1.1,
                                color: Colors.white.withOpacity(0.34),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 46),
                FadeInSection(
                  delayMs: 380,
                  child: PrimaryGradientButton(
                    label: 'start'.tr(),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const QuestionPage()),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 16),
                FadeInSection(
                  delayMs: 500,
                  child: Text(
                    'minutes'.tr(),
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.45),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class QuestionPage extends StatefulWidget {
  const QuestionPage({super.key});

  @override
  State<QuestionPage> createState() => _QuestionPageState();
}

class _QuestionPageState extends State<QuestionPage> {
  int index = 0;
  int score = 0;
  final answers = <FortuneAnswer>[];

  final questions = const [
    'q1',
    'q2',
    'q3',
    'q4',
    'q5',
    'q6',
    'q7',
    'q8',
    'q9',
    'q10',
    'q11',
    'q12',
    'q13',
    'q14',
    'q15',
  ];

  void answer(String answerKey, int value) {
    answers.add(
      FortuneAnswer(
        index: index + 1,
        questionKey: questions[index],
        answerKey: answerKey,
        value: value,
      ),
    );

    score += value;

    if (index < questions.length - 1) {
      setState(() => index++);
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ReadingPage(
            score: score,
            answers: List<FortuneAnswer>.from(answers),
          ),
        ),
      );
    }
  }

  void restartDiagnosis() {
    Navigator.pop(context);
    setState(() {
      index = 0;
      score = 0;
      answers.clear();
    });
  }

  void goHome() {
    Navigator.pop(context);
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const HomePage()),
      (route) => false,
    );
  }

  Future<void> showExitDialog() async {
    await showDialog<void>(
      context: context,
      barrierColor: Colors.black.withOpacity(0.62),
      builder: (dialogContext) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 24),
          child: Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: Colors.white.withOpacity(0.10)),
              boxShadow: [
                BoxShadow(
                  color: AppColors.purple1.withOpacity(0.16),
                  blurRadius: 28,
                  offset: const Offset(0, 12),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.purple1.withOpacity(0.12),
                    border: Border.all(
                      color: AppColors.purple1.withOpacity(0.22),
                    ),
                  ),
                  child: const Icon(
                    Icons.pause_rounded,
                    color: Colors.white,
                    size: 34,
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  'exit_title'.tr(),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'exit_message'.tr(),
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.white.withOpacity(0.68),
                    height: 1.65,
                  ),
                ),
                const SizedBox(height: 24),
                PrimaryGradientButton(
                  label: 'continue'.tr(),
                  onTap: () => Navigator.pop(dialogContext),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: restartDiagnosis,
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Colors.white.withOpacity(0.06),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                        side: BorderSide(color: Colors.white.withOpacity(0.09)),
                      ),
                    ),
                    child: Text(
                      'restart'.tr(),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: goHome,
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.white70,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(
                      'back_home'.tr(),
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget answerButton(String keyName, int value) {
    return PressableAnswerButton(
      label: keyName.tr(),
      onTap: () => answer(keyName, value),
    );
  }

  @override
  Widget build(BuildContext context) {
    final progress = (index + 1) / questions.length;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: showExitDialog,
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 14),
            child: languageButton(context),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: TweenAnimationBuilder<double>(
                  tween: Tween<double>(begin: 0, end: progress),
                  duration: const Duration(milliseconds: 280),
                  curve: Curves.easeOutCubic,
                  builder: (context, value, child) {
                    return LinearProgressIndicator(
                      value: value,
                      minHeight: 10,
                      backgroundColor: Colors.white.withOpacity(0.08),
                      valueColor: const AlwaysStoppedAnimation(
                        AppColors.purple1,
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 18),
              Text(
                '${index + 1} / ${questions.length}',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.white.withOpacity(0.55),
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 280),
                switchInCurve: Curves.easeOutCubic,
                switchOutCurve: Curves.easeInCubic,
                transitionBuilder: (child, animation) {
                  final offsetAnimation = Tween<Offset>(
                    begin: const Offset(0, 0.04),
                    end: Offset.zero,
                  ).animate(animation);

                  return FadeTransition(
                    opacity: animation,
                    child: SlideTransition(
                      position: offsetAnimation,
                      child: child,
                    ),
                  );
                },
                child: Container(
                  key: ValueKey(index),
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 28,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.035),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(color: Colors.white.withOpacity(0.08)),
                  ),
                  child: Text(
                    questions[index].tr(),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      height: 1.55,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 34),
              answerButton('yes', 2),
              answerButton('maybe_yes', 1),
              answerButton('neutral', 0),
              answerButton('maybe_no', -1),
              answerButton('no', -2),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}

class ReadingPage extends StatefulWidget {
  final int score;
  final List<FortuneAnswer> answers;

  const ReadingPage({super.key, required this.score, required this.answers});

  @override
  State<ReadingPage> createState() => _ReadingPageState();
}

class _ReadingPageState extends State<ReadingPage>
    with SingleTickerProviderStateMixin {
  int step = 0;
  late final AnimationController _pulseController;

  final readingKeys = const ['loading_1', 'loading_2', 'loading_3'];

  @override
  void initState() {
    super.initState();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1850),
    )..repeat(reverse: true);

    _startReading();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _startReading() async {
    String? generatedText;
    bool usedFallback = false;

    final apiFuture = HonneFortuneApi.generateFortune(
      score: widget.score,
      answers: widget.answers,
      locale: WidgetsBinding.instance.platformDispatcher.locale.languageCode,
    );

    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    setState(() => step = 1);

    await Future.delayed(const Duration(milliseconds: 1250));
    if (!mounted) return;
    setState(() => step = 2);

    try {
      generatedText = await apiFuture.timeout(
        const Duration(seconds: 18),
        onTimeout: () => '',
      );

      if (generatedText == null || generatedText!.trim().isEmpty) {
        usedFallback = true;
        generatedText = null;
      }
    } catch (_) {
      usedFallback = true;
      generatedText = null;
    }

    await Future.delayed(const Duration(milliseconds: 700));
    if (!mounted) return;

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => ResultPage(
          score: widget.score,
          answers: widget.answers,
          generatedText: generatedText,
          usedFallback: usedFallback,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final progress = (step + 1) / 3;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 30),
          child: Column(
            children: [
              Align(
                alignment: Alignment.topRight,
                child: languageButton(context),
              ),
              const Spacer(),
              AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  final pulse = _pulseController.value;
                  final scale = 0.96 + (pulse * 0.06);
                  final glow = 0.24 + (pulse * 0.22);

                  return Stack(
                    alignment: Alignment.center,
                    children: [
                      Transform.scale(
                        scale: 1.88 + (pulse * 0.18),
                        child: Container(
                          width: 112,
                          height: 112,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: AppColors.purple1.withOpacity(
                                0.045 + (pulse * 0.065),
                              ),
                              width: 1.4,
                            ),
                          ),
                        ),
                      ),
                      Transform.scale(
                        scale: 1.42 + (pulse * 0.14),
                        child: Container(
                          width: 112,
                          height: 112,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.purple1.withOpacity(
                              0.035 + (pulse * 0.055),
                            ),
                          ),
                        ),
                      ),
                      Transform.scale(
                        scale: scale,
                        child: Container(
                          width: 112,
                          height: 112,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: const LinearGradient(
                              colors: [AppColors.purple1, AppColors.purple2],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.purple1.withOpacity(glow),
                                blurRadius: 34 + (pulse * 18),
                                spreadRadius: 1 + (pulse * 3),
                                offset: const Offset(0, 12),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.auto_awesome,
                            color: Colors.white,
                            size: 46,
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 38),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 620),
                switchInCurve: Curves.easeOutCubic,
                switchOutCurve: Curves.easeInCubic,
                transitionBuilder: (child, animation) {
                  return FadeTransition(
                    opacity: animation,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0, 0.08),
                        end: Offset.zero,
                      ).animate(animation),
                      child: child,
                    ),
                  );
                },
                child: Text(
                  readingKeys[step].tr(),
                  key: ValueKey(step),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    height: 1.7,
                    letterSpacing: 0.2,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              AnimatedOpacity(
                opacity: 0.55 + (step * 0.12),
                duration: const Duration(milliseconds: 520),
                child: Text(
                  'warning'.tr(),
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.7,
                    color: Colors.white.withOpacity(0.52),
                  ),
                ),
              ),
              const SizedBox(height: 34),
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: TweenAnimationBuilder<double>(
                  tween: Tween<double>(begin: 0.18, end: progress),
                  duration: const Duration(milliseconds: 720),
                  curve: Curves.easeOutCubic,
                  builder: (context, value, child) {
                    return LinearProgressIndicator(
                      value: value,
                      minHeight: 8,
                      backgroundColor: Colors.white.withOpacity(0.08),
                      valueColor: const AlwaysStoppedAnimation(
                        AppColors.purple1,
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 22),
              AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  return Opacity(
                    opacity: 0.26 + (_pulseController.value * 0.22),
                    child: child,
                  );
                },
                child: const Text(
                  '●   ●   ●',
                  style: TextStyle(
                    color: Colors.white54,
                    fontSize: 10,
                    letterSpacing: 6,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                'paid_sub'.tr(),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.36),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ResultPage extends StatelessWidget {
  final int score;
  final List<FortuneAnswer> answers;
  final String? generatedText;
  final bool usedFallback;

  const ResultPage({
    super.key,
    required this.score,
    required this.answers,
    this.generatedText,
    this.usedFallback = false,
  });

  String getType() {
    if (score >= 22) return 'type_self_abandon';
    if (score >= 12) return 'type_empathy';
    if (score >= 4) return 'type_suppression';
    if (score >= -5) return 'type_overthink';
    return 'type_guarded';
  }

  String getResult() {
    if (score >= 22) return 'result_self_abandon';
    if (score >= 12) return 'result_empathy';
    if (score >= 4) return 'result_suppression';
    if (score >= -5) return 'result_overthink';
    return 'result_guarded';
  }

  String displayResult(BuildContext context) {
    final text = generatedText?.trim();

    if (text != null && text.isNotEmpty) {
      return text;
    }

    return getResult().tr();
  }

  @override
  Widget build(BuildContext context) {
    final resultText = displayResult(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        toolbarHeight: 42,
        leading: IconButton(
          icon: const Icon(Icons.home_outlined, size: 21),
          onPressed: () {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (_) => const HomePage()),
              (route) => false,
            );
          },
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 14),
            child: languageButton(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(24, 2, 24, 26),
        child: Column(
          children: [
            FadeInSection(
              delayMs: 80,
              child: Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    colors: [AppColors.purple1, AppColors.purple2],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.purple1.withOpacity(0.30),
                      blurRadius: 26,
                      offset: const Offset(0, 9),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.auto_awesome,
                  color: Colors.white,
                  size: 34,
                ),
              ),
            ),
            const SizedBox(height: 16),
            FadeInSection(
              delayMs: 240,
              child: Text(
                getType().tr(),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  height: 1.42,
                ),
              ),
            ),
            const SizedBox(height: 14),
            FadeInSection(
              delayMs: 520,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: usedFallback
                        ? Colors.white.withOpacity(0.07)
                        : AppColors.purple1.withOpacity(0.18),
                  ),
                ),
                child: Text(
                  resultText,
                  style: const TextStyle(fontSize: 14.5, height: 1.68),
                ),
              ),
            ),
            const SizedBox(height: 22),
            FadeInSection(
              delayMs: 860,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(
                    color: AppColors.purple1.withOpacity(0.22),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.purple1.withOpacity(0.14),
                      blurRadius: 24,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      width: 62,
                      height: 62,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.purple1.withOpacity(0.10),
                        border: Border.all(
                          color: AppColors.purple1.withOpacity(0.25),
                        ),
                      ),
                      child: const Icon(
                        Icons.lock_outline,
                        color: Colors.white70,
                        size: 30,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'hook'.tr(),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.82),
                        height: 1.7,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 20),
                    PrimaryGradientButton(
                      label: 'paid_button'.tr(),
                      onTap: () async {
                        try {
                          final response = await http.post(
                            Uri.parse('http://127.0.0.1:8787/deep-fortune'),
                            headers: {'Content-Type': 'application/json'},
                            body: jsonEncode({
                              'score': score,
                              'answers': answers
                                  .map((answer) => answer.toJson())
                                  .toList(),
                            }),
                          );

                          final data =
                              jsonDecode(response.body) as Map<String, dynamic>;

                          final deepText = (data['text'] ?? '')
                              .toString()
                              .trim();

                          final readingId = (data['readingId'] ?? '')
                              .toString()
                              .trim();

                          final prefs = await SharedPreferences.getInstance();

                          await prefs.setString('last_reading_id', readingId);

                          await prefs.setString('last_deep_text', deepText);

                          await prefs.setInt('last_score', score);

                          await prefs.setString(
                            'last_created_at',
                            DateTime.now().toIso8601String(),
                          );

                          if (!context.mounted) return;

                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => DeepReadingPage(
                                deepText: deepText,
                                score: score,
                                readingId: readingId,
                              ),
                            ),
                          );
                        } catch (_) {
                          if (!context.mounted) return;

                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('paid_reading_fetch_failed'.tr())),
                          );
                        }
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            FadeInSection(
              delayMs: 1040,
              child: Text(
                'daily_limit'.tr(),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.42),
                  height: 1.6,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


