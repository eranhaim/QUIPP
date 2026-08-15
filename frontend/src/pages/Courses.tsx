import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { sampleCourses, tierConfig, tagLabels, techTagConfig } from '@/data/mockData';
import combiOvenImg from '@/assets/combi-oven.jpg';
import coffeeImg from '@/assets/coffee-machine.jpg';

const tags = ['all', 'THERMAL', 'COLD', 'BEVERAGE', 'DIGITAL', 'SERVICE'] as const;

const courseImages: Record<string, string> = {
  'smart-ovens': combiOvenImg,
  'commercial-espresso': coffeeImg,
};

const Courses = () => {
  const [filter, setFilter] = useState<string>('all');
  const filtered = filter === 'all' ? sampleCourses : sampleCourses.filter(c => c.tag === filter);

  return (
    <Layout>
      <section className="pt-20 md:pt-32 pb-32 md:pb-44">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-[72px] font-bold font-display text-foreground mb-4 uppercase leading-[0.95] tracking-tight">
              EARN YOUR <span className="text-primary">CREDENTIALS</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-[480px] mx-auto">Equipment mastery. Verified. Yours forever.</p>
          </div>

          {/* Filter Tabs — THERMAL / COLD / BEVERAGE / DIGITAL / SERVICE */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {tags.map(t => {
              const icon = t !== 'all' ? techTagConfig[t]?.icon + ' ' : '';
              return (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`text-sm font-medium px-6 py-2.5 rounded-full border transition-colors ${
                    filter === t
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:border-foreground'
                  }`}
                >
                  {t === 'all' ? 'All' : `${icon}${tagLabels[t]}`}
                </button>
              );
            })}
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(course => {
              const tier = tierConfig[course.tier];
              const tag = techTagConfig[course.tag];
              return (
                <div key={course.id} className={`bg-card rounded-3xl overflow-hidden animate-fade-in ${course.status === 'coming_soon' ? 'opacity-60' : ''}`}>
                  {courseImages[course.slug] && (
                    <img src={courseImages[course.slug]} alt={course.title} className="w-full h-[200px] object-cover" />
                  )}
                  <div className="p-7">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{tag?.icon}</span>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">{tag?.label}</span>
                    </div>
                    <h3 className="text-xl font-bold font-display text-card-foreground mb-2">{course.title}</h3>
                    <span className={`inline-block text-[11px] font-bold uppercase px-3 py-1 rounded-full mb-3 ${tier.bgClass} ${tier.fgClass}`}>
                      {tier.label}
                    </span>
                    {course.isManufacturer && (
                      <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-primary/30 text-primary ml-2">
                        {course.provider}
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground mb-2">{course.duration} minutes · 80% to pass</p>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                    <p className="text-xs font-bold text-primary mb-5">+{course.techScoreContribution} Score Points</p>
                    {course.status === 'published' ? (
                      <Button className="w-full rounded-full" asChild>
                        <Link to={`/training/${course.slug}`}>Earn This →</Link>
                      </Button>
                    ) : (
                      <Button variant="secondary" className="w-full rounded-full">Coming Soon</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Courses;
