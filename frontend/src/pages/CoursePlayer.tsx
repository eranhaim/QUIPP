import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Quippy from '@/components/Quippy';
import QuippSymbol from '@/components/QuippSymbol';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Course, Enrollment, QuizResult, TagName, Tier } from '@/lib/types';

const TAG_ICON: Record<TagName, string> = {
  THERMAL: '🔥',
  COLD: '❄️',
  BEVERAGE: '☕',
  DIGITAL: '💻',
  SERVICE: '🍽️',
};

const TIER_PATCH: Record<Tier, { bg: string; fg: string }> = {
  IN: { bg: 'bg-background border-2 border-foreground', fg: 'text-foreground' },
  DEEP: { bg: 'bg-secondary', fg: 'text-secondary-foreground' },
  THERE: { bg: 'bg-primary', fg: 'text-primary-foreground' },
};

const encouragements = ['Yours now. Forever.', 'Look at you. Earned.', 'Your Passport just got better.'];

const CoursePlayer = () => {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { refreshProfile } = useAuth();

  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);

  const courseQuery = useQuery({
    queryKey: ['course', slug],
    queryFn: () => api<{ course: Course }>(`/api/courses/${slug}`, { auth: true }),
    enabled: !!slug,
  });

  const enrollMutation = useMutation({
    mutationFn: () =>
      api<{ enrollment: Enrollment }>(`/api/courses/${slug}/enroll`, {
        method: 'POST',
        auth: true,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollments', 'me'] }),
  });

  const submitMutation = useMutation({
    mutationFn: (submitAnswers: number[]) =>
      api<{ result: QuizResult }>(`/api/courses/${slug}/submit`, {
        method: 'POST',
        auth: true,
        body: { answers: submitAnswers },
      }),
    onSuccess: ({ result }) => {
      setResult(result);
      qc.invalidateQueries({ queryKey: ['enrollments', 'me'] });
      qc.invalidateQueries({ queryKey: ['credentials', 'me'] });
      qc.invalidateQueries({ queryKey: ['profile', 'me'] });
      // Refresh the auth context so the sidebar's cached tech score updates immediately.
      refreshProfile().catch(() => undefined);
    },
  });

  // Fire-and-forget enroll on mount; duplicates 200 with same enrollment.
  useEffect(() => {
    if (courseQuery.data && !enrollMutation.isSuccess && !enrollMutation.isPending) {
      enrollMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseQuery.data]);

  const course = courseQuery.data?.course;
  const currentPart = course?.parts[currentPartIndex];
  const progress = course
    ? Math.round(((currentPartIndex + 1) / course.parts.length) * 100)
    : 0;
  const masteryQuestions = useMemo(
    () => (currentPart?.type === 'mastery_check' ? currentPart.questions : []),
    [currentPart],
  );

  if (courseQuery.isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading course…</div>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold font-display text-foreground mb-4">
            Course not available
          </h1>
          <Button asChild className="rounded-full">
            <Link to="/academy">← Back to Academy</Link>
          </Button>
        </div>
      </div>
    );
  }

  const advanceToNextPart = () => {
    if (currentPartIndex < course.parts.length - 1) {
      setCurrentPartIndex((i) => i + 1);
      setQuestionIndex(0);
      setAnswers([]);
    }
  };

  const handlePickAnswer = (index: number) => {
    const next = [...answers, index];
    setAnswers(next);
    if (questionIndex < masteryQuestions.length - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      submitMutation.mutate(next);
    }
  };

  const handleRetake = () => {
    setResult(null);
    setAnswers([]);
    setQuestionIndex(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-[800px] mx-auto px-5 h-14 flex items-center justify-between">
          <Link
            to={`/training/${slug}`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <span className="text-sm font-medium text-foreground">
            Part {currentPartIndex + 1} of {course.parts.length}
          </span>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="max-w-[680px] mx-auto px-5 py-8">
        <AnimatePresence mode="wait">
          {currentPart?.type === 'real_world' && (
            <motion.div
              key="rw"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Quippy size="sm" message="This is why this matters." className="mb-6" />
              <div className="bg-card rounded-3xl p-8">
                <h1 className="text-2xl md:text-[32px] font-bold font-display text-card-foreground mb-6">
                  {currentPart.title}
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                  {currentPart.content}
                </p>
              </div>
              <Button className="w-full mt-6 rounded-full h-14 font-bold" onClick={advanceToNextPart}>
                Forward →
              </Button>
            </motion.div>
          )}

          {currentPart?.type === 'knowledge' && (
            <motion.div
              key="kn"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-card rounded-3xl p-8">
                <h1 className="text-2xl md:text-[32px] font-bold font-display text-card-foreground mb-6">
                  {currentPart.title}
                </h1>
                <p className="text-base text-muted-foreground mb-6">{currentPart.content}</p>
                {currentPart.topics.length > 0 && (
                  <div className="space-y-3">
                    {currentPart.topics.map((topic, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-background">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-sm font-medium text-foreground">{topic}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button className="w-full mt-6 rounded-full h-14 font-bold" onClick={advanceToNextPart}>
                Ready for the check →
              </Button>
            </motion.div>
          )}

          {currentPart?.type === 'mastery_check' && !result && masteryQuestions.length > 0 && (
            <motion.div
              key={`mc-${questionIndex}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-xs text-muted-foreground mb-2 text-center">
                Question {questionIndex + 1} of {masteryQuestions.length}
              </p>
              <div className="bg-card rounded-3xl p-8">
                <h2 className="text-lg font-semibold text-card-foreground mb-6">
                  {masteryQuestions[questionIndex].question}
                </h2>
                <div className="space-y-3">
                  {masteryQuestions[questionIndex].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handlePickAnswer(i)}
                      disabled={submitMutation.isPending}
                      className="w-full text-left p-4 rounded-2xl border-2 border-border hover:border-foreground bg-background transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
                    >
                      <span className="text-sm text-foreground">{opt}</span>
                    </button>
                  ))}
                </div>
                {submitMutation.isPending && (
                  <p className="text-xs text-muted-foreground text-center mt-6">
                    Grading your answers…
                  </p>
                )}
                {submitMutation.error && (
                  <p className="text-xs text-destructive text-center mt-6">
                    {submitMutation.error instanceof ApiError
                      ? submitMutation.error.message
                      : 'Could not submit. Try again.'}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {currentPart?.type === 'mastery_check' && result && !result.passed && (
            <motion.div
              key="fail"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-card rounded-3xl p-8 text-center">
                <XCircle className="w-14 h-14 text-destructive mx-auto mb-4" aria-hidden />
                <h2 className="text-2xl font-bold font-display uppercase text-card-foreground mb-2">
                  Not this time
                </h2>
                <p className="text-sm text-muted-foreground">
                  You scored {result.scorePct}%. Pass mark is {result.passMark}%. Review below,
                  then retake.
                </p>
                {result.cooldownEndsAt && new Date(result.cooldownEndsAt) > new Date() && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Retake available after {new Date(result.cooldownEndsAt).toLocaleString()}.
                  </p>
                )}
              </div>
              <div className="mt-4 space-y-3">
                {result.review.map((r, i) => (
                  <ReviewItem key={i} number={i + 1} item={r} />
                ))}
              </div>
              <Button
                className="w-full mt-6 rounded-full h-14 font-bold"
                onClick={handleRetake}
                disabled={
                  !!(result.cooldownEndsAt && new Date(result.cooldownEndsAt) > new Date())
                }
              >
                Retake
              </Button>
            </motion.div>
          )}

          {currentPart?.type === 'mastery_check' && result?.passed && (
            <motion.div
              key="pass"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 2, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                className={`w-44 h-44 mx-auto rounded-3xl ${TIER_PATCH[course.tier].bg} ${TIER_PATCH[course.tier].fg} flex flex-col items-center justify-center gap-2 mb-8 relative`}
              >
                <span className="text-4xl">{TAG_ICON[course.tagName]}</span>
                <span className="text-sm font-bold font-display uppercase text-center px-3">
                  {course.title}
                </span>
                <span className="text-xs font-bold uppercase opacity-70">{course.tier}</span>
                {course.tier === 'THERE' && (
                  <QuippSymbol size="lg" color="inherit" className="absolute top-2 right-2" />
                )}
              </motion.div>

              <Quippy
                size="sm"
                message={encouragements[Math.floor(Math.random() * encouragements.length)]}
              />

              <p className="text-xs text-muted-foreground mt-6">
                {result.correctCount} / {result.totalQuestions} correct · {result.scorePct}%
              </p>
              {result.verificationId && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {result.verificationId}
                </p>
              )}

              <div className="flex flex-col gap-3 mt-8">
                <Button
                  size="lg"
                  className="rounded-full h-14 font-bold"
                  onClick={() => navigate('/passport/me')}
                >
                  View Passport
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-full h-14"
                  onClick={() => navigate('/academy')}
                >
                  Back to Academy
                </Button>
              </div>
            </motion.div>
          )}

          {currentPart?.type === 'credential' && !result && (
            <motion.div
              key="cred-precheck"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <Quippy size="md" message="Pass the check and it lands here." className="mb-6" />
              <Button
                className="rounded-full h-14 font-bold px-8"
                onClick={() => {
                  const masteryIndex = course.parts.findIndex((p) => p.type === 'mastery_check');
                  if (masteryIndex >= 0) setCurrentPartIndex(masteryIndex);
                }}
              >
                Go to the mastery check
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ReviewItem = ({
  number,
  item,
}: {
  number: number;
  item: QuizResult['review'][number];
}) => (
  <div className="bg-card rounded-2xl p-5">
    <div className="flex items-start gap-3">
      {item.correct ? (
        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden />
      ) : (
        <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden />
      )}
      <div className="flex-1">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Question {number}
        </p>
        <p className="text-sm font-medium text-foreground mt-1">{item.question}</p>
        {!item.correct && (
          <p className="text-xs text-muted-foreground mt-2">
            <span className="font-bold">Correct answer:</span> option {item.correctIndex + 1}. {item.explanation}
          </p>
        )}
      </div>
    </div>
  </div>
);

export default CoursePlayer;
