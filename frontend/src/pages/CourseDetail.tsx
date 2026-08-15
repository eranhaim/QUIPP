import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { sampleCourses, tierConfig, techTagConfig } from '@/data/mockData';
import combiOvenImg from '@/assets/combi-oven.jpg';
import coffeeImg from '@/assets/coffee-machine.jpg';

const courseImages: Record<string, string> = {
  'smart-ovens': combiOvenImg,
  'commercial-espresso': coffeeImg,
};

const CourseDetail = () => {
  const { slug } = useParams();
  const course = sampleCourses.find(c => c.slug === slug);

  if (!course) {
    return <Layout><div className="max-w-[680px] mx-auto px-5 py-20 text-center"><h1 className="text-2xl font-bold font-display">Course not found</h1></div></Layout>;
  }

  const tier = tierConfig[course.tier];
  const tag = techTagConfig[course.tag];
  const realWorldPart = course.parts.find(p => p.type === 'real_world');
  const knowledgePart = course.parts.find(p => p.type === 'knowledge');

  return (
    <Layout>
      <section className="pt-16 md:pt-28 pb-32 md:pb-44">
        <div className="max-w-[680px] mx-auto px-5">
          <p className="text-xs text-muted-foreground mb-8">
            <Link to="/training" className="hover:text-foreground">Training</Link> → {course.title}
          </p>

          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">{tag?.icon}</span>
              <span className="text-xs font-bold uppercase text-muted-foreground">{tag?.label}</span>
            </div>
            <h1 className="text-3xl md:text-[56px] font-bold font-display text-foreground mb-4 uppercase leading-[0.95] tracking-tight">{course.title}</h1>
            <span className={`inline-block text-[11px] font-bold uppercase px-4 py-1.5 rounded-full mb-3 ${tier.bgClass} ${tier.fgClass}`}>{tier.label}</span>
            {course.isManufacturer && (
              <span className="inline-block text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-primary/30 text-primary ml-2">{course.provider} CERTIFIED</span>
            )}
            <p className="text-sm text-muted-foreground mt-3">{course.duration} minutes · {course.passMark}% to pass</p>
            <p className="text-sm font-bold text-primary mt-2">+{course.techScoreContribution} Score Points</p>
          </div>

          {courseImages[course.slug] && (
            <img src={courseImages[course.slug]} alt={course.title} className="w-full h-[250px] md:h-[350px] rounded-3xl object-cover mb-10" />
          )}

          <div className="flex justify-center mb-14">
            <Button size="lg" className="rounded-full h-14 px-10 font-bold" asChild>
              <Link to={`/learn/${course.slug}/part-1`}>Start Earning →</Link>
            </Button>
          </div>

          {realWorldPart && (
            <div className="bg-card rounded-3xl p-8 mb-6">
              <h2 className="text-2xl font-bold font-display text-card-foreground mb-4 uppercase">Why This Matters</h2>
              <p className="text-base text-muted-foreground leading-relaxed">{realWorldPart.content}</p>
            </div>
          )}

          {knowledgePart?.topics && (
            <div className="bg-card rounded-3xl p-8 mb-6">
              <h2 className="text-2xl font-bold font-display text-card-foreground mb-4 uppercase">What You'll Master</h2>
              <ul className="space-y-3">
                {knowledgePart.topics.map((topic, i) => (
                  <li key={i} className="flex items-start gap-3 text-base text-muted-foreground"><span className="text-primary font-bold">→</span>{topic}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-card rounded-3xl p-8 mb-6">
            <h2 className="text-2xl font-bold font-display text-card-foreground mb-4 uppercase">How It Works</h2>
            <div className="space-y-4">
              {course.parts.map((part, i) => (
                <div key={part.id} className="flex items-center gap-4 p-4 rounded-2xl bg-background">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{part.title}</p>
                    {part.duration && <p className="text-xs text-muted-foreground">{part.duration}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-3xl p-8 mb-6">
            <h2 className="text-2xl font-bold font-display text-card-foreground mb-4 uppercase">What You'll Earn</h2>
            <ul className="space-y-3 mb-4">
              <li className="flex items-start gap-3 text-base text-muted-foreground"><span className="text-primary">→</span> Verified credential</li>
              <li className="flex items-start gap-3 text-base text-muted-foreground"><span className="text-primary">→</span> +{course.techScoreContribution} to your Score</li>
              <li className="flex items-start gap-3 text-base text-muted-foreground"><span className="text-primary">→</span> Added to your Passport</li>
              <li className="flex items-start gap-3 text-base text-muted-foreground"><span className="text-primary">→</span> Shareable certificate</li>
            </ul>
          </div>

          <div className="flex justify-center">
            <Button size="lg" className="rounded-full h-14 px-10 font-bold" asChild>
              <Link to={`/learn/${course.slug}/part-1`}>Start Earning →</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CourseDetail;
