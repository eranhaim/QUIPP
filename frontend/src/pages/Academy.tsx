import { useState } from 'react';
import Layout from '@/components/Layout';
import { academyCourses, tagPillStyles, type TagName, type AcademyCourse } from '@/data/academyCourses';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Clock, ArrowRight, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const tags: Array<'ALL' | TagName> = ['ALL', 'COMPLIANCE', 'THERMAL', 'COLD', 'BEVERAGE', 'DIGITAL', 'MANAGEMENT'];
const tierLabels = ['IN', 'DEEP', 'THERE'] as const;

const categoryOrder: TagName[] = ['COMPLIANCE', 'THERMAL', 'COLD', 'BEVERAGE', 'DIGITAL', 'MANAGEMENT'];

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-6">
    <h2 className="text-xl md:text-2xl font-bold font-display text-foreground uppercase">{children}</h2>
    <div className="w-12 h-0.5 bg-primary mt-2" />
  </div>
);

const latestUpdates = [
  { text: 'A Toronto barista just earned their THERE in Espresso', type: 'credential' },
  { text: 'New course: Delivery Platform Management — now live', type: 'new' },
  { text: 'Food Safety certifications — renewal window now open', type: 'compliance' },
];

const Academy = () => {
  const [filter, setFilter] = useState<'ALL' | TagName>('ALL');
  const [selectedCourse, setSelectedCourse] = useState<AcademyCourse | null>(null);
  const [selectedTier, setSelectedTier] = useState<'IN' | 'DEEP' | 'THERE'>('IN');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const openCourse = (course: AcademyCourse) => {
    setSelectedCourse(course);
    setSelectedTier('IN');
  };

  // Group courses by category
  const coursesByCategory = categoryOrder.map(cat => ({
    category: cat,
    courses: academyCourses.filter(c => c.tag === cat),
  }));

  const filteredShelves = filter === 'ALL'
    ? coursesByCategory
    : coursesByCategory.filter(s => s.category === filter);

  return (
    <Layout>
      {/* ──── HERO (Purple) ──── */}
      <section className="py-16 md:py-24" style={{ background: '#36186b' }}>
        <div className="max-w-[1200px] mx-auto px-5 text-center">
          <h1 className="text-4xl md:text-[64px] font-extrabold font-display text-white mb-4 uppercase leading-[0.95] tracking-tight">
            QUIPP Academy
          </h1>
          <p className="text-base md:text-lg text-white/70 max-w-[600px] mx-auto mb-10">
            20 courses. 60 credentials.<br />
            Built for the professional running the modern kitchen.
          </p>
          <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
            {[
              { num: '20', label: 'Courses' },
              { num: '60', label: 'Credentials' },
              { num: '5', label: 'Categories' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <span className="text-3xl md:text-4xl font-bold font-display text-primary">{s.num}</span>
                <span className="block text-xs text-white/60 mt-1">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── FILTER TABS ──── */}
      <section className="py-8 bg-background">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex flex-wrap justify-center gap-2">
            {tags.map(t => {
              const isActive = filter === t;
              return (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className="text-sm font-bold px-5 py-2 rounded-full transition-all"
                  style={
                    isActive
                      ? { background: '#d1f300', color: '#221f20' }
                      : { background: 'transparent', color: '#221f20', border: '1px solid #221f20' }
                  }
                >
                  {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──── CATEGORY SHELVES ──── */}
      <section className="pb-16 bg-background">
        <div className="max-w-[1200px] mx-auto px-5 space-y-12">
          {filteredShelves.map(shelf => (
            <div key={shelf.category}>
              <SectionHeader>{shelf.category} Courses</SectionHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shelf.courses.map(course => {
                  const isHovered = hoveredCard === course.number;
                  return (
                    <div
                      key={course.number}
                      className="bg-background border border-border rounded-lg overflow-hidden cursor-pointer relative"
                      style={{
                        boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
                        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                        transition: 'all 200ms ease',
                      }}
                      onMouseEnter={() => setHoveredCard(course.number)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={() => openCourse(course)}
                    >
                      {/* Thumbnail placeholder */}
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
                          {course.tag === 'THERMAL' ? '🔥' : course.tag === 'COLD' ? '❄️' : course.tag === 'BEVERAGE' ? '☕' : course.tag === 'DIGITAL' ? '💻' : course.tag === 'COMPLIANCE' ? '📋' : '📊'}
                        </div>
                        {/* Hover overlay */}
                        {isHovered && (
                          <div
                            className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end"
                            style={{ background: 'rgba(34, 31, 32, 0.85)', minHeight: '60%' }}
                          >
                            <p className="text-sm text-white leading-relaxed line-clamp-2 mb-3">
                              {course.tiers.IN.summary}
                            </p>
                            <span
                              className="inline-flex items-center gap-1 text-sm font-bold px-4 py-2 rounded-full self-start"
                              style={{ background: '#d1f300', color: '#221f20' }}
                            >
                              START COURSE <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="p-4">
                        {/* Tag pill */}
                        <span
                          className="text-[11px] font-bold uppercase px-3 py-1 rounded-full inline-block mb-2 text-white"
                          style={{ background: '#221f20' }}
                        >
                          {course.tag}
                        </span>

                        <h3 className="text-base font-bold font-display text-foreground mb-3 line-clamp-2">{course.title}</h3>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{course.totalTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border text-foreground" style={{ borderColor: '#221f20' }}>IN</span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white" style={{ background: '#36186b' }}>DEEP</span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ background: '#d1f300', color: '#221f20' }}>THERE</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──── LATEST UPDATES ──── */}
      <section className="py-12 bg-background">
        <div className="max-w-[1200px] mx-auto px-5">
          <SectionHeader>Latest from QUIPP Academy</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {latestUpdates.map((item, i) => (
              <div key={i} className="bg-background border border-border rounded-lg p-5 flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-sm text-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── CATALOG TABLE ──── */}
      <section className="py-12 bg-background">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="rounded-lg overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">#</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Course</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Tag</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Levels</th>
                  </tr>
                </thead>
                <tbody>
                  {academyCourses.map(c => (
                    <tr key={c.number} className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => openCourse(c)}>
                      <td className="px-5 py-3 text-muted-foreground font-mono">{c.number}</td>
                      <td className="px-5 py-3 text-foreground font-medium">{c.title}</td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full text-white" style={{ background: '#221f20' }}>{c.tag}</span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">IN · DEEP · THERE</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap mt-10">
            {[
              { num: '20', label: 'Courses' },
              { num: '60', label: 'Credentials' },
              { num: '5', label: 'Categories' },
              { num: '0', label: 'Resumes Required' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <span className="text-3xl md:text-5xl font-bold font-display text-primary">{s.num}</span>
                <span className="block text-xs text-muted-foreground mt-1">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── COURSE DETAIL MODAL ──── */}
      <Dialog open={!!selectedCourse} onOpenChange={(open) => !open && setSelectedCourse(null)}>
        <DialogContent className="max-w-2xl p-0 border border-border overflow-hidden bg-background rounded-xl">
          {selectedCourse && (
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold uppercase px-3 py-1 rounded-full text-white" style={{ background: '#221f20' }}>
                    {selectedCourse.tag}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">Course {selectedCourse.number}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">{selectedCourse.title}</h2>
              </div>

              {/* Compliance disclaimer */}
              {selectedCourse.disclaimer && (
                <div className="flex items-start gap-2 p-3 rounded-lg mb-6 bg-muted border border-border">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground italic">{selectedCourse.disclaimer}</p>
                </div>
              )}

              {/* Tier Tabs */}
              <div className="flex gap-2 mb-6">
                {tierLabels.map(tier => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className="text-sm font-bold px-5 py-2 rounded-full transition-all"
                    style={
                      selectedTier === tier
                        ? { background: '#d1f300', color: '#221f20' }
                        : { background: 'transparent', color: '#221f20', border: '1px solid #221f20' }
                    }
                  >
                    {tier}
                  </button>
                ))}
              </div>

              {/* Active Tier Content */}
              {(() => {
                const tier = selectedCourse.tiers[selectedTier];
                return (
                  <div className="space-y-5">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{tier.duration} · {tier.modules} modules</span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">What this course is</h4>
                      <p className="text-[15px] text-foreground leading-relaxed">{tier.summary}</p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">What you will learn</h4>
                      <ul className="space-y-2">
                        {tier.whatYouWillLearn.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="text-primary mt-1 text-xs">●</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Who it is for</h4>
                      <p className="text-sm text-muted-foreground">{tier.whoItIsFor}</p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Prerequisites</h4>
                      <p className={`text-sm ${tier.prerequisites === 'None' ? 'text-muted-foreground' : 'text-foreground font-bold'}`}>
                        {tier.prerequisites}
                      </p>
                    </div>

                    <div className="border-t border-border pt-5">
                      <button
                        className="w-full py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all"
                        style={{ background: '#d1f300', color: '#221f20' }}
                      >
                        EARN YOUR {selectedTier} CREDENTIAL <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Academy;
