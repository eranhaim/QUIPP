import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Quippy from '@/components/Quippy';
import QuippSymbol from '@/components/QuippSymbol';
import { sampleCourses, tierConfig, techTagConfig } from '@/data/mockData';

const CoursePlayer = () => {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const course = sampleCourses.find(c => c.slug === courseSlug);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [completedParts, setCompletedParts] = useState<string[]>([]);
  const [showDeepPrompt, setShowDeepPrompt] = useState(false);

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold font-display text-foreground mb-4">Course not available</h1>
          <Button asChild className="rounded-full"><Link to="/training">← Back to Training</Link></Button>
        </div>
      </div>
    );
  }

  const tier = tierConfig[course.tier];
  const tag = techTagConfig[course.tag];
  const currentPart = course.parts[currentPartIndex];
  const progress = Math.round(((currentPartIndex + 1) / course.parts.length) * 100);

  const handleNext = () => {
    setCompletedParts([...completedParts, currentPart.id]);
    if (currentPartIndex < course.parts.length - 1) {
      setCurrentPartIndex(currentPartIndex + 1);
      setQuestionIndex(0);
      setSelectedAnswer(null);
      setAnsweredCorrectly(null);
    }
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const question = currentPart.questions?.[questionIndex];
    if (question) {
      const correct = index === question.correctIndex;
      setAnsweredCorrectly(correct);
      if (correct) setCorrectCount(c => c + 1);
    }
  };

  const handleNextQuestion = () => {
    const questions = currentPart.questions || [];
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setSelectedAnswer(null);
      setAnsweredCorrectly(null);
    } else {
      handleNext();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-[800px] mx-auto px-5 h-14 flex items-center justify-between">
          <Link to={`/training/${courseSlug}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <span className="text-sm font-medium text-foreground">Part {currentPartIndex + 1} of {course.parts.length}</span>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
        <div className="h-1 bg-muted"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} /></div>
      </header>

      <div className="max-w-[680px] mx-auto px-5 py-8">
        <AnimatePresence mode="wait">
          {currentPart.type === 'real_world' && (
            <motion.div key="rw" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Quippy size="sm" message="This is why this matters." className="mb-6" />
              <div className="bg-card rounded-3xl p-8">
                <h1 className="text-2xl md:text-[32px] font-bold font-display text-card-foreground mb-6">{currentPart.title}</h1>
                <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">{currentPart.content}</p>
              </div>
              <Button className="w-full mt-6 rounded-full h-14 font-bold" onClick={handleNext}>Forward →</Button>
            </motion.div>
          )}

          {currentPart.type === 'knowledge' && (
            <motion.div key="kn" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-card rounded-3xl p-8">
                <h1 className="text-2xl md:text-[32px] font-bold font-display text-card-foreground mb-6">{currentPart.title}</h1>
                <p className="text-base text-muted-foreground mb-6">{currentPart.content}</p>
                {currentPart.topics && (
                  <div className="space-y-4">
                    {currentPart.topics.map((topic, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-background">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{i + 1}</span>
                          <p className="text-sm font-medium text-foreground">{topic}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button className="w-full mt-6 rounded-full h-14 font-bold" onClick={handleNext}>Ready for the check →</Button>
            </motion.div>
          )}

          {currentPart.type === 'mastery_check' && currentPart.questions && currentPart.questions.length > 0 && (
            <motion.div key={`mc-${questionIndex}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-xs text-muted-foreground mb-2 text-center">Question {questionIndex + 1} of {currentPart.questions.length}</p>
              <div className="bg-card rounded-3xl p-8">
                <h2 className="text-lg font-semibold text-card-foreground mb-6">{currentPart.questions[questionIndex].question}</h2>
                <div className="space-y-3">
                  {currentPart.questions[questionIndex].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={selectedAnswer !== null}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all min-h-[44px] ${
                        selectedAnswer === null
                          ? 'border-border hover:border-foreground bg-background'
                          : i === currentPart.questions![questionIndex].correctIndex
                          ? 'border-success bg-success/10'
                          : selectedAnswer === i
                          ? 'border-destructive bg-destructive/10'
                          : 'border-border bg-background opacity-50'
                      }`}
                    >
                      <span className="text-sm text-foreground">{opt}</span>
                    </button>
                  ))}
                </div>
                {selectedAnswer !== null && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                    <Quippy size="sm" message={answeredCorrectly ? "Yes. Exactly." : `Close — ${currentPart.questions![questionIndex].explanation}`} />
                  </motion.div>
                )}
              </div>
              {selectedAnswer !== null && (
                <Button className="w-full mt-6 rounded-full h-14 font-bold" onClick={handleNextQuestion}>
                  {questionIndex < (currentPart.questions?.length || 0) - 1 ? 'Next →' : 'See my credential →'}
                </Button>
              )}
            </motion.div>
          )}

          {currentPart.type === 'mastery_check' && (!currentPart.questions || currentPart.questions.length === 0) && (
            <motion.div key="mc-empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-card rounded-3xl p-8 text-center">
                <Quippy size="md" message="Questions coming soon. Here's your credential." className="mb-4" />
                <Button className="rounded-full h-14 font-bold" onClick={handleNext}>See my credential →</Button>
              </div>
            </motion.div>
          )}

          {/* CREDENTIAL STAMP MOMENT */}
          {currentPart.type === 'credential' && (
            <motion.div key="cred" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              {/* Patch animation */}
              <motion.div
                initial={{ scale: 2, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                className={`w-44 h-44 mx-auto rounded-3xl ${tier.patchBg} ${tier.patchFg} flex flex-col items-center justify-center gap-2 mb-8 relative`}
              >
                <span className="text-4xl">{tag?.icon}</span>
                <span className="text-sm font-bold font-display uppercase">{course.title}</span>
                <span className="text-xs font-bold uppercase opacity-70">{tier.label}</span>
                {course.tier === 'THERE' && <QuippSymbol size="lg" color="inherit" className="absolute top-2 right-2" />}
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <Quippy size="sm" message={['Yours now. Forever.', 'Look at you. Earned.', 'Your Passport just got better.'][Math.floor(Math.random() * 3)]} />
              </motion.div>

              {/* DEEP prompt after IN */}
              {course.tier === 'IN' && !showDeepPrompt && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-6 bg-card rounded-3xl p-6">
                  <p className="text-sm text-card-foreground mb-3">Prove it in real life. Get your supervisor to confirm.</p>
                  <Button variant="secondary" className="rounded-full" onClick={() => setShowDeepPrompt(true)}>Go DEEP →</Button>
                </motion.div>
              )}

              <div className="flex flex-col gap-3 mt-8">
                <Button size="lg" className="rounded-full h-14 font-bold" asChild>
                  <Link to={`/certifications/${course.id}`}>Share</Link>
                </Button>
                <Button variant="secondary" size="lg" className="rounded-full h-14" asChild>
                  <Link to="/passport/alex">View Passport</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CoursePlayer;
