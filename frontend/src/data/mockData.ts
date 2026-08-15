export interface TechStackEquipment {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  status: 'Certified' | 'Learning' | 'Proficient';
  certificationId?: string;
}

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  location: string;
  visibilityStatus: 'open' | 'employed' | 'private';
  baseRole: string;
  specialty: string;
  yearsExperience: number;
  techRole: string;
  techProficiencyScore: number;
  equipment: TechStackEquipment[];
  title?: string;
}

export interface Credential {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  courseNumber: string;
  tier: 'IN' | 'DEEP' | 'THERE';
  tag: 'THERMAL' | 'COLD' | 'BEVERAGE' | 'DIGITAL' | 'SERVICE';
  provider: string;
  isManufacturer?: boolean;
  techFocus: string;
  earnedDate: string;
  quizScore?: number;
  verificationId: string;
  skillsDemonstrated: string[];
  techScoreContribution: number;
}

export interface WorkExperience {
  id: string;
  userId: string;
  companyName: string;
  position: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description?: string;
  techAdopted: string[];
  isEndorsed: boolean;
}

export interface MasteryQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CoursePart {
  id: string;
  type: 'real_world' | 'knowledge' | 'mastery_check' | 'credential';
  title: string;
  duration: string;
  content: string;
  topics?: string[];
  questions?: MasteryQuestion[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  techFocus: string;
  tag: 'THERMAL' | 'COLD' | 'BEVERAGE' | 'DIGITAL' | 'SERVICE';
  tier: 'IN' | 'DEEP' | 'THERE';
  duration: number;
  description: string;
  parts: CoursePart[];
  technicalCompetencies: string[];
  techScoreContribution: number;
  provider: string;
  isManufacturer?: boolean;
  status: 'published' | 'coming_soon';
  equipmentName: string;
  passMark: number;
  retakeCooldownHours: number;
}

export interface Article {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
}

// ── Tier patch config (LOCKED: White IN / Purple DEEP / Lime THERE) ──
export const tierConfig: Record<string, { label: string; bgClass: string; fgClass: string; patchBg: string; patchFg: string }> = {
  IN:    { label: 'IN',    bgClass: 'bg-foreground',  fgClass: 'text-background',     patchBg: 'bg-background border border-foreground',  patchFg: 'text-foreground' },
  DEEP:  { label: 'DEEP',  bgClass: 'bg-secondary',   fgClass: 'text-secondary-foreground', patchBg: 'bg-secondary',  patchFg: 'text-secondary-foreground' },
  THERE: { label: 'THERE', bgClass: 'bg-primary',     fgClass: 'text-primary-foreground', patchBg: 'bg-primary', patchFg: 'text-primary-foreground' },
};

// ── Technology Tag Config ──
export const techTagConfig: Record<string, { label: string; icon: string }> = {
  THERMAL:  { label: 'Thermal',  icon: '🔥' },
  COLD:     { label: 'Cold',     icon: '❄️' },
  BEVERAGE: { label: 'Beverage', icon: '☕' },
  DIGITAL:  { label: 'Digital',  icon: '💻' },
  SERVICE:  { label: 'Service',  icon: '🍽️' },
};

// ── Sample User ──
export const sampleUser: User = {
  id: 'u1',
  username: 'alex',
  firstName: 'Alex',
  lastName: '',
  nickname: 'Alex',
  email: 'alex@example.com',
  location: 'Toronto, Canada',
  visibilityStatus: 'open',
  baseRole: 'Kitchen',
  specialty: 'Line Cook',
  yearsExperience: 3,
  techRole: 'TechCook',
  techProficiencyScore: 28,
  equipment: [
    { id: 'eq1', name: 'UNOX Combi Oven', manufacturer: 'UNOX', category: 'Combi Ovens', status: 'Certified', certificationId: 'cr1' },
    { id: 'eq2', name: 'Commercial Espresso Machine', manufacturer: 'quipp', category: 'Coffee Equipment', status: 'Certified', certificationId: 'cr2' },
  ],
};

// ── Sample Credentials ──
export const sampleCredentials: Credential[] = [
  {
    id: 'cr1', userId: 'u1', courseId: 'c1',
    courseName: 'Smart Ovens', courseNumber: 'UNOX-IN-001', tier: 'IN',
    tag: 'THERMAL', provider: 'UNOX', isManufacturer: true,
    techFocus: 'Combi Oven Operations',
    earnedDate: '2024-01-15', quizScore: 85, verificationId: 'ver-abc123',
    skillsDemonstrated: ['Three cooking modes', 'Temperature & humidity control', 'Cleaning cycles', 'Error code troubleshooting'],
    techScoreContribution: 5,
  },
  {
    id: 'cr2', userId: 'u1', courseId: 'c2',
    courseName: 'Commercial Espresso', courseNumber: 'QUIPP-IN-002', tier: 'IN',
    tag: 'BEVERAGE', provider: 'quipp',
    techFocus: 'Espresso Operations',
    earnedDate: '2024-02-10', quizScore: 90, verificationId: 'ver-def456',
    skillsDemonstrated: ['Grind settings', 'Tamping technique', 'Extraction timing', 'Milk steaming', 'Machine cleaning'],
    techScoreContribution: 5,
  },
];

// ── Sample Work Experiences ──
export const sampleExperiences: WorkExperience[] = [
  {
    id: 'we1', userId: 'u1',
    companyName: 'The Drake Hotel', position: 'Line Cook',
    city: 'Toronto', country: 'Canada',
    startDate: '2023', endDate: null, isCurrent: true,
    description: 'Earning equipment credentials. Building my Passport.',
    techAdopted: ['UNOX Combi Oven'],
    isEndorsed: false,
  },
  {
    id: 'we2', userId: 'u1',
    companyName: 'Various Kitchens', position: 'Prep Cook',
    city: 'Toronto', country: 'Canada',
    startDate: '2021', endDate: '2023', isCurrent: false,
    description: 'Traditional kitchen training.',
    techAdopted: [],
    isEndorsed: false,
  },
];

// ── Mastery Questions for UNOX Combi ──
const combiQuestions: MasteryQuestion[] = [
  {
    id: 'q1',
    question: "You're roasting chicken at 180°C. The skin isn't crisping. Which mode adjustment fixes this?",
    options: ['Add more steam', 'Switch to convection only', 'Lower temperature', 'Increase humidity'],
    correctIndex: 1,
    explanation: "Convection mode removes moisture from the surface, allowing the skin to crisp.",
  },
  {
    id: 'q2',
    question: "After service, the combi shows Error Code E1. First step?",
    options: ['Call a technician', 'Run the cleaning cycle', 'Check the water connection', 'Restart the unit'],
    correctIndex: 2,
    explanation: "E1 typically indicates a water supply issue. Check the simplest fix first.",
  },
  {
    id: 'q3',
    question: "You need to steam vegetables for a banquet of 200. What temperature and mode?",
    options: ['100°C steam mode', '120°C combination mode', '180°C convection', '90°C steam mode'],
    correctIndex: 0,
    explanation: "100°C steam mode gives perfect, consistent vegetable results every time.",
  },
  {
    id: 'q4',
    question: "The oven smells like chemicals after the cleaning cycle. What happened?",
    options: ['Normal — needs to air out', 'Too much detergent', 'The rinse cycle didn\'t complete', 'The oven is broken'],
    correctIndex: 2,
    explanation: "If the rinse cycle doesn't complete, detergent residue remains. Run a rinse cycle before cooking.",
  },
  {
    id: 'q5',
    question: "Why is combination mode better for braising?",
    options: ['It cooks faster', 'Steam keeps it moist while dry heat builds flavor', 'It uses less energy', 'It\'s the default mode'],
    correctIndex: 1,
    explanation: "Combination mode — steam retains moisture while convection builds Maillard reaction on surfaces.",
  },
  {
    id: 'q6',
    question: "You open the oven door and lose all your steam. How do you recover?",
    options: ['Wait 10 minutes', 'Inject a manual steam burst', 'Restart the program', 'Just keep cooking'],
    correctIndex: 1,
    explanation: "A manual steam burst quickly recovers the cavity humidity.",
  },
  {
    id: 'q7',
    question: "Correct cleaning frequency for a combi used 12+ hours daily?",
    options: ['Once a week', 'Once a day after service', 'Every other day', 'Only when visibly dirty'],
    correctIndex: 1,
    explanation: "Daily cleaning after service is essential for heavy-use combi ovens.",
  },
  {
    id: 'q8',
    question: "A new cook sets the oven to 250°C for baking bread. What's the risk?",
    options: ['Nothing, that\'s fine', 'The bread will taste better', 'Possible damage to seals and gaskets over time', 'The oven will turn off automatically'],
    correctIndex: 2,
    explanation: "Extended use at maximum temperatures wears gaskets and seals prematurely.",
  },
  {
    id: 'q9',
    question: "Your combi has a probe thermometer. When should you use it?",
    options: ['Only for meat', 'For any protein where internal temp matters', 'Only when the chef asks', 'Never — just use time'],
    correctIndex: 1,
    explanation: "Core temperature probes ensure food safety and consistency.",
  },
  {
    id: 'q10',
    question: "Switching to a new combi model. What's the most important thing to learn first?",
    options: ['The brand name', 'The cleaning cycle procedure', 'How it connects to WiFi', 'The color of the display'],
    correctIndex: 1,
    explanation: "Cleaning and maintenance is always job one with new equipment.",
  },
];

// ── Sample Courses (5 launch courses across tags) ──
export const sampleCourses: Course[] = [
  {
    id: 'c1', slug: 'smart-ovens', title: 'Smart Ovens',
    techFocus: 'Combi Oven Operations', tag: 'THERMAL', tier: 'IN',
    duration: 35, provider: 'UNOX', isManufacturer: true,
    equipmentName: 'Combi Oven',
    passMark: 80, retakeCooldownHours: 24,
    description: 'The combi oven is in 90% of serious kitchens. Master it.',
    parts: [
      { id: 'p1-1', type: 'real_world', title: 'The Real World', duration: '3 min', content: 'The combi oven is in 90% of serious kitchens. Once you know this machine, you\'re untouchable.' },
      { id: 'p1-2', type: 'knowledge', title: 'The Knowledge', duration: '15 min', content: 'Master the combi oven inside and out.', topics: ['What is a combi oven and why it exists', 'The three cooking modes (steam / convection / combination)', 'Temperature and humidity control', 'Cleaning cycles and maintenance', 'Common mistakes and how to avoid them'] },
      { id: 'p1-3', type: 'mastery_check', title: 'The Mastery Check', duration: '10 questions', content: 'Prove you know this equipment. 80% to pass.', questions: combiQuestions },
      { id: 'p1-4', type: 'credential', title: 'The Credential', duration: '', content: 'Your Smart Ovens credential. Earned. Yours.' },
    ],
    technicalCompetencies: ['Three cooking modes', 'Temperature & humidity control', 'Cleaning & maintenance', 'Error code handling', 'Food safety protocols'],
    techScoreContribution: 5, status: 'published',
  },
  {
    id: 'c2', slug: 'commercial-espresso', title: 'Commercial Espresso',
    techFocus: 'Espresso Operations', tag: 'BEVERAGE', tier: 'IN',
    duration: 30, provider: 'quipp',
    equipmentName: 'Espresso Machine',
    passMark: 80, retakeCooldownHours: 24,
    description: 'Grind, tamp, extract, steam. The espresso machine is your stage.',
    parts: [
      { id: 'p2-1', type: 'real_world', title: 'The Real World', duration: '3 min', content: 'Every coffee programme depends on the barista who runs the machine.' },
      { id: 'p2-2', type: 'knowledge', title: 'The Knowledge', duration: '12 min', content: 'Master espresso operations end to end.', topics: ['Grinder calibration', 'Dose and distribution', 'Extraction timing', 'Milk texturing', 'Cleaning and maintenance'] },
      { id: 'p2-3', type: 'mastery_check', title: 'The Mastery Check', duration: '10 questions', content: 'Prove you know this equipment. 80% to pass.', questions: [] },
      { id: 'p2-4', type: 'credential', title: 'The Credential', duration: '', content: 'Your Commercial Espresso credential. Earned. Yours.' },
    ],
    technicalCompetencies: ['Grinder calibration', 'Extraction timing', 'Milk texturing', 'Cleaning protocols'],
    techScoreContribution: 5, status: 'published',
  },
  {
    id: 'c3', slug: 'pos-systems', title: 'POS Systems',
    techFocus: 'Point of Sale Operations', tag: 'DIGITAL', tier: 'IN',
    duration: 30, provider: 'quipp',
    equipmentName: 'POS System',
    passMark: 80, retakeCooldownHours: 24,
    description: 'Every order, every payment, every report. Master the system that runs the floor.',
    parts: [
      { id: 'p3-1', type: 'real_world', title: 'The Real World', duration: '3 min', content: 'The POS is the nerve center of every restaurant.' },
      { id: 'p3-2', type: 'knowledge', title: 'The Knowledge', duration: '12 min', content: 'Master POS operations end to end.', topics: ['Order management and modifiers', 'Payment processing', 'Table management', 'Reporting and daily close', 'Troubleshooting common issues'] },
      { id: 'p3-3', type: 'mastery_check', title: 'The Mastery Check', duration: '10 questions', content: 'Prove you know this system. 80% to pass.', questions: [] },
      { id: 'p3-4', type: 'credential', title: 'The Credential', duration: '', content: 'Your POS Systems credential. Earned. Yours.' },
    ],
    technicalCompetencies: ['Order management', 'Payment processing', 'Table management', 'Reporting'],
    techScoreContribution: 5, status: 'published',
  },
  {
    id: 'c4', slug: 'blast-chillers', title: 'Blast Chillers',
    techFocus: 'Rapid Cooling Operations', tag: 'COLD', tier: 'IN',
    duration: 25, provider: 'quipp',
    equipmentName: 'Blast Chiller',
    passMark: 80, retakeCooldownHours: 24,
    description: 'Food safety starts with temperature. Master rapid cooling.',
    parts: [
      { id: 'p4-1', type: 'real_world', title: 'The Real World', duration: '3 min', content: 'Blast chillers prevent the danger zone. Every kitchen needs a cook who knows this.' },
      { id: 'p4-2', type: 'knowledge', title: 'The Knowledge', duration: '10 min', content: 'Master blast chilling operations.', topics: ['Temperature danger zone', 'Blast chilling vs slow cooling', 'Shock freezing', 'HACCP compliance', 'Maintenance protocols'] },
      { id: 'p4-3', type: 'mastery_check', title: 'The Mastery Check', duration: '10 questions', content: 'Prove you know this equipment. 80% to pass.', questions: [] },
      { id: 'p4-4', type: 'credential', title: 'The Credential', duration: '', content: 'Your Blast Chillers credential. Earned. Yours.' },
    ],
    technicalCompetencies: ['Danger zone management', 'Blast chill cycles', 'HACCP compliance', 'Equipment maintenance'],
    techScoreContribution: 5, status: 'published',
  },
  {
    id: 'c5', slug: 'foh-tech', title: 'FOH Tech',
    techFocus: 'Front of House Technology', tag: 'SERVICE', tier: 'IN',
    duration: 30, provider: 'quipp',
    equipmentName: 'FOH Systems',
    passMark: 80, retakeCooldownHours: 24,
    description: 'Reservations, ordering tablets, guest-facing tech. Own the floor.',
    parts: [
      { id: 'p5-1', type: 'real_world', title: 'The Real World', duration: '3 min', content: 'Guests interact with technology before they interact with you. Know the tools.' },
      { id: 'p5-2', type: 'knowledge', title: 'The Knowledge', duration: '12 min', content: 'Master front-of-house technology.', topics: ['Reservation systems', 'Tableside ordering', 'Guest-facing displays', 'Delivery platform integration', 'Tech-enhanced service flow'] },
      { id: 'p5-3', type: 'mastery_check', title: 'The Mastery Check', duration: '10 questions', content: 'Prove you know FOH tech. 80% to pass.', questions: [] },
      { id: 'p5-4', type: 'credential', title: 'The Credential', duration: '', content: 'Your FOH Tech credential. Earned. Yours.' },
    ],
    technicalCompetencies: ['Reservation systems', 'Tableside ordering', 'Delivery integration', 'Guest experience tech'],
    techScoreContribution: 5, status: 'published',
  },
];

// ── Sample Articles (The Magazine) ──
export const sampleArticles: Article[] = [
  { id: 'a1', category: 'EQUIPMENT', title: 'UNOX Launches Cloud-Connected Combi Ovens', excerpt: 'Monitor your kitchen from anywhere with IoT-enabled commercial ovens.', readTime: '3 min' },
  { id: 'a2', category: 'INDUSTRY', title: 'Why Every Cook Should Know Their Combi', excerpt: 'The combi oven is the most important piece of equipment in modern kitchens.', readTime: '2 min' },
  { id: 'a3', category: 'CREDENTIALS', title: 'Digital Credentials Are Replacing Paper Certificates', excerpt: 'Why leading hospitality groups are switching to verifiable digital credentials.', readTime: '3 min' },
  { id: 'a4', category: 'TECHNOLOGY', title: 'How Equipment Training Is Changing', excerpt: 'From paper manuals to digital credentials — the shift is here.', readTime: '2 min' },
  { id: 'a5', category: 'LEADERSHIP', title: 'The Kitchen of 2027', excerpt: 'AI-powered menus, connected equipment, and the workers who run it all.', readTime: '4 min' },
];

// ── Helpers ──
export function getTechScoreLabel(score: number): string {
  if (score <= 24) return 'Building';
  if (score <= 49) return 'Growing';
  if (score <= 74) return 'Recognised';
  return 'Authority';
}

export const tagLabels: Record<string, string> = {
  THERMAL: 'Thermal',
  COLD: 'Cold',
  BEVERAGE: 'Beverage',
  DIGITAL: 'Digital',
  SERVICE: 'Service',
};
