import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Quippy from '@/components/Quippy';
import { useAuth } from '@/hooks/useAuth';

const roles = [
  { label: 'Kitchen', icon: '🔥', desc: 'Cook, Chef, Line' },
  { label: 'Bar', icon: '🍸', desc: 'Bartender, Barback' },
  { label: 'Floor', icon: '🍽️', desc: 'Server, Host' },
  { label: 'Management', icon: '📋', desc: 'GM, Manager' },
  { label: 'Ownership', icon: '🔑', desc: 'Owner, Operator' },
  { label: 'Something else', icon: '➕', desc: '' },
];

const equipmentList = [
  'Combi Oven', 'Espresso Machine', 'Commercial Griddle', 'Fryer',
  'Draft Beer System', 'POS System', 'Commercial Dishwasher',
  'Blast Chiller', 'Salamander', 'Sous Vide', 'Bar Blender',
  'Commercial Refrigeration', 'Soft Serve Machine', 'Convection Oven',
];

const TOTAL_SCREENS = 5;

const Onboarding = () => {
  const [screen, setScreen] = useState(1);
  const [role, setRole] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/signup');
  }, [user, loading, navigate]);

  const toggleEquipment = (item: string) => {
    setEquipment((prev) => (prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]));
  };

  const quippyReaction = () => {
    if (equipment.length === 0) return "No worries. That's what we're here for.";
    if (equipment.length >= 5) return "Look at you. Let's make that official.";
    return 'Nice picks. Forward.';
  };

  const finish = () => {
    // TODO(M3): persist role + equipment to backend profile
    navigate('/home', { replace: true });
  };

  const name = user?.firstName ?? 'there';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(screen / TOTAL_SCREENS) * 100}%` }}
        />
      </div>

      {screen > 1 && (
        <button
          onClick={() => setScreen((s) => s - 1)}
          className="fixed top-4 left-4 z-50 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>
      )}

      <AnimatePresence mode="wait">
        {screen === 1 && (
          <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center px-5">
            <Quippy size="xl" />
            <h1 className="text-3xl md:text-[56px] font-bold font-display text-center mt-8 mb-4 leading-[0.95] uppercase text-foreground tracking-tight">
              GET QUIPP'D
            </h1>
            <p className="text-base text-muted-foreground text-center mb-12">The wave is coming. Ride it.</p>
            <Button size="lg" className="w-full max-w-[400px] h-14 text-base font-bold rounded-full" onClick={() => setScreen(2)}>
              Start
            </Button>
          </motion.div>
        )}

        {screen === 2 && (
          <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center px-5">
            <div className="max-w-[400px] w-full space-y-4">
              {[
                { highlight: 'EARN', text: "credentials from the world's best equipment brands." },
                { highlight: 'BUILD', text: 'a Passport that is 100% yours. Forever.' },
                { highlight: 'SHINE', text: 'Let employers find you by what you actually know.' },
              ].map((card, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }} className="bg-card rounded-3xl p-6">
                  <p className="text-lg">
                    <span className="font-bold text-primary">{card.highlight}</span>{' '}
                    <span className="text-card-foreground">{card.text}</span>
                  </p>
                </motion.div>
              ))}
            </div>
            <Button size="lg" className="w-full max-w-[400px] h-14 text-base font-bold mt-8 rounded-full" onClick={() => setScreen(3)}>
              Forward →
            </Button>
          </motion.div>
        )}

        {screen === 3 && (
          <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center px-5">
            <Quippy size="sm" message={`What's your world, ${name}?`} className="mb-6" />
            <div className="grid grid-cols-2 gap-3 max-w-[400px] w-full">
              {roles.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setRole(r.label)}
                  className={`rounded-3xl p-5 text-center transition-all min-h-[100px] ${
                    role === r.label
                      ? 'bg-card border-2 border-primary'
                      : 'bg-card border-2 border-border hover:border-muted-foreground'
                  }`}
                >
                  <span className="text-3xl block mb-2">{r.icon}</span>
                  <span className="text-sm font-semibold text-card-foreground block">{r.label}</span>
                </button>
              ))}
            </div>
            {role && (
              <Button size="lg" className="w-full max-w-[400px] h-14 text-base font-bold mt-6 rounded-full" onClick={() => setScreen(4)}>
                This is me
              </Button>
            )}
          </motion.div>
        )}

        {screen === 4 && (
          <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center px-5 py-16 overflow-y-auto">
            <Quippy size="sm" message={quippyReaction()} className="mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground text-center mb-2 uppercase">
              What equipment do you work with?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">Pick everything you know.</p>
            <div className="flex flex-wrap gap-2 max-w-[400px] justify-center mb-6">
              {equipmentList.map((item) => (
                <button
                  key={item}
                  onClick={() => toggleEquipment(item)}
                  className={`text-sm px-4 py-2 rounded-full transition-all ${
                    equipment.includes(item)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-card-foreground border border-border'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setEquipment([]);
                setScreen(5);
              }}
              className="text-sm text-muted-foreground mb-4 hover:text-foreground"
            >
              None of these
            </button>
            <Button size="lg" className="w-full max-w-[400px] h-14 text-base font-bold rounded-full" onClick={() => setScreen(5)}>
              These are mine
            </Button>
          </motion.div>
        )}

        {screen === 5 && (
          <motion.div key="s5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center px-5">
            <div className="bg-card rounded-3xl p-8 max-w-[400px] w-full mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-muted-foreground uppercase">UNOX</span>
                <span className="text-[11px] font-bold uppercase px-3 py-1 rounded-full bg-foreground text-background">IN</span>
              </div>
              <h3 className="text-xl font-bold font-display text-card-foreground mb-2">Smart Ovens</h3>
              <div className="w-full h-2 rounded-full bg-muted mb-3">
                <div className="h-full bg-primary rounded-full w-0" />
              </div>
              <p className="text-xs text-muted-foreground">0% complete</p>
            </div>
            <p className="text-lg font-semibold text-foreground text-center mb-6">
              This one has your name on it.
            </p>
            <Button size="lg" className="w-full max-w-[400px] h-14 text-base font-bold mb-3 rounded-full" onClick={finish}>
              Start earning
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
