import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { sampleArticles } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

const features = [
  { title: 'EARN', subtitle: 'CREDENTIALS', desc: 'Prove your skills with industry-recognised digital credentials.' },
  { title: 'BUILD', subtitle: 'YOUR PASSPORT', desc: 'A living profile of every technology you\'ve mastered.' },
  { title: 'GET', subtitle: 'NOTICED', desc: 'Show employers exactly what you can do — verified.' },
  { title: 'GROW', subtitle: 'YOUR SCORE', desc: 'Track your tech proficiency as you learn and earn.' },
];

const transformPaths = [
  { role: 'TechChef', from: 'Chef', desc: 'Smart equipment, IoT systems, data operations', icon: '👨‍🍳' },
  { role: 'TechBarista', from: 'Barista', desc: 'Connected coffee tech, digital experience', icon: '☕' },
  { role: 'TechCook', from: 'Cook', desc: 'Smart cooking systems, automated workflows', icon: '🍳' },
  { role: 'TechServer', from: 'Server', desc: 'Tech-enhanced guest experience', icon: '🍽️' },
  { role: 'TechBartender', from: 'Bartender', desc: 'Smart beverage systems', icon: '🍸' },
  { role: 'TechManager', from: 'Manager', desc: 'Operations technology, analytics', icon: '📊' },
];

const Index = () => {
  const { user, loading } = useAuth();
  const featured = sampleArticles[0];
  const updates = sampleArticles.slice(1, 5);

  if (!loading && user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <Layout>
      {/* ──── HERO (purple section) ──── */}
      <section style={{ background: '#36186b' }} className="pt-28 md:pt-44 pb-32 md:pb-44 -mt-[1px]">
        <motion.div {...fade()} className="max-w-[1000px] mx-auto px-5 text-center">
          <h1 className="text-5xl md:text-[88px] lg:text-[104px] font-extrabold font-display text-white leading-[0.95] mb-8 tracking-tight uppercase">
            THE APP FOR{' '}
            <span className="text-primary">HOSPITALITY TECH</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-[520px] mx-auto mb-10 leading-relaxed">
            Earn credentials. Build your Passport. Get ahead.
          </p>
          <Button size="lg" className="rounded-full h-14 px-10 text-base font-bold" asChild>
            <Link to="/signup">Get quipp'd</Link>
          </Button>
        </motion.div>
      </section>

      {/* ──── FEATURE PILLARS ──── */}
      <section className="py-24 md:py-32 bg-background">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} {...fade(i * 0.08)} className="text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold font-display text-foreground uppercase leading-tight mb-1">{f.title}</h3>
                <h3 className="text-2xl md:text-3xl font-bold font-display text-secondary uppercase leading-tight mb-4">{f.subtitle}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── TRANSFORMATION PATHS ──── */}
      <section className="pb-24 md:pb-32 bg-background">
        <div className="max-w-[1200px] mx-auto px-5">
          <motion.h2 {...fade()} className="text-3xl md:text-5xl font-bold font-display text-foreground mb-4 text-center uppercase">
            CHOOSE YOUR <span className="text-secondary">PATH</span>
          </motion.h2>
          <p className="text-base text-muted-foreground text-center max-w-[480px] mx-auto mb-12">Every hospitality role has a tech future. Pick yours.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {transformPaths.map((path, i) => (
              <motion.div key={path.role} {...fade(i * 0.06)} className="bg-background border border-border rounded-lg p-8 hover:shadow-lg transition-all duration-300 group cursor-pointer">
                <span className="text-4xl mb-4 block">{path.icon}</span>
                <h3 className="text-2xl font-bold font-display text-foreground mb-1 uppercase">{path.role}</h3>
                <p className="text-sm text-muted-foreground mb-4">{path.from} → {path.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{path.desc}</p>
                <Link to="/academy" className="text-sm font-bold text-secondary mt-6 inline-block group-hover:underline">Start →</Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── THE MAGAZINE ──── */}
      <section className="pb-24 md:pb-32 bg-background">
        <div className="max-w-[1200px] mx-auto px-5">
          <motion.h2 {...fade()} className="text-3xl md:text-5xl font-bold font-display text-foreground mb-12 uppercase">
            THE <span className="text-secondary">MAGAZINE</span>
          </motion.h2>
          <motion.div {...fade(0.1)} className="bg-background border border-border rounded-lg overflow-hidden mb-6">
            <div className="p-10 md:p-16">
              <span className="text-xs font-bold uppercase tracking-widest text-secondary mb-4 block">{featured.category}</span>
              <h3 className="text-3xl md:text-[40px] font-bold font-display text-foreground leading-tight mb-4">{featured.title}</h3>
              <p className="text-base text-muted-foreground mb-8 max-w-[600px]">{featured.excerpt}</p>
              <span className="text-xs text-muted-foreground">{featured.readTime} read</span>
            </div>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {updates.map((article, i) => (
              <motion.div key={article.id} {...fade(0.15 + i * 0.05)} className="bg-background border border-border rounded-lg p-7 hover:shadow-lg transition-shadow cursor-pointer">
                <span className="text-xs font-bold uppercase tracking-widest text-secondary mb-3 block">{article.category}</span>
                <h3 className="text-base font-semibold text-foreground mb-2 leading-snug">{article.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── CTA (almost-black section) ──── */}
      <section style={{ background: '#221f20' }} className="py-32 md:py-44">
        <motion.div {...fade()} className="max-w-[680px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold font-display text-white mb-3 uppercase">GET <span className="text-primary">QUIPP'D</span></h2>
          <p className="text-base text-white/60 mb-10 max-w-[400px] mx-auto">Your skills. Your story. Your future.</p>
          <Button size="lg" className="rounded-full h-14 px-10 font-bold text-base" asChild>
            <Link to="/signup">Start Free →</Link>
          </Button>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Index;
