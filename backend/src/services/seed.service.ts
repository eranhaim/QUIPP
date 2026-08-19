import { TechnologyTag, type TagName } from '../models/TechnologyTag.js';
import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { createProfileForUser } from './profile.service.js';
import { logger } from '../lib/logger.js';

const TAGS: Array<{ tagName: TagName; label: string; icon: string; description: string }> = [
  { tagName: 'THERMAL', label: 'Thermal', icon: '🔥', description: 'Ovens, fryers, grills, salamanders — anything that runs hot.' },
  { tagName: 'COLD', label: 'Cold', icon: '❄️', description: 'Refrigeration, blast chillers, freezers, sous vide baths.' },
  { tagName: 'BEVERAGE', label: 'Beverage', icon: '☕', description: 'Espresso, draft, blenders, dispensing systems.' },
  { tagName: 'DIGITAL', label: 'Digital', icon: '💻', description: 'POS, KDS, delivery platforms, inventory systems.' },
  { tagName: 'SERVICE', label: 'Service', icon: '🍽️', description: 'FOH tech, reservations, compliance, HACCP.' },
];

interface SeedQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface SeedPart {
  partId: string;
  type: 'real_world' | 'knowledge' | 'mastery_check' | 'credential';
  title: string;
  duration: string;
  content: string;
  topics?: string[];
  questions?: SeedQuestion[];
}

interface SeedCourse {
  slug: string;
  title: string;
  techFocus: string;
  tagName: TagName;
  tier: 'IN' | 'DEEP' | 'THERE';
  duration: number;
  description: string;
  provider: string;
  isManufacturer: boolean;
  equipmentName: string;
  passMark: number;
  retakeCooldownHours: number;
  techScoreContribution: number;
  technicalCompetencies: string[];
  parts: SeedPart[];
}

const COMBI_QUESTIONS: SeedQuestion[] = [
  { question: "You're roasting chicken at 180°C. The skin isn't crisping. Which mode adjustment fixes this?", options: ['Add more steam', 'Switch to convection only', 'Lower temperature', 'Increase humidity'], correctIndex: 1, explanation: 'Convection mode removes moisture from the surface, allowing the skin to crisp.' },
  { question: 'After service, the combi shows Error Code E1. First step?', options: ['Call a technician', 'Run the cleaning cycle', 'Check the water connection', 'Restart the unit'], correctIndex: 2, explanation: 'E1 typically indicates a water supply issue. Check the simplest fix first.' },
  { question: 'You need to steam vegetables for a banquet of 200. What temperature and mode?', options: ['100°C steam mode', '120°C combination mode', '180°C convection', '90°C steam mode'], correctIndex: 0, explanation: '100°C steam gives consistent vegetable results every time.' },
  { question: 'The oven smells like chemicals after the cleaning cycle. What happened?', options: ['Normal — needs to air out', 'Too much detergent', "The rinse cycle didn't complete", 'The oven is broken'], correctIndex: 2, explanation: "If the rinse cycle doesn't complete, detergent residue remains. Run a rinse cycle before cooking." },
  { question: 'Why is combination mode better for braising?', options: ['It cooks faster', 'Steam keeps it moist while dry heat builds flavor', 'It uses less energy', "It's the default mode"], correctIndex: 1, explanation: 'Combination mode: steam retains moisture while convection builds Maillard reaction on surfaces.' },
  { question: 'You open the oven door and lose all your steam. How do you recover?', options: ['Wait 10 minutes', 'Inject a manual steam burst', 'Restart the program', 'Just keep cooking'], correctIndex: 1, explanation: 'A manual steam burst quickly recovers cavity humidity.' },
  { question: 'Correct cleaning frequency for a combi used 12+ hours daily?', options: ['Once a week', 'Once a day after service', 'Every other day', 'Only when visibly dirty'], correctIndex: 1, explanation: 'Daily cleaning after service is essential for heavy-use combi ovens.' },
  { question: 'A new cook sets the oven to 250°C for baking bread. What is the risk?', options: ["Nothing, that's fine", 'The bread will taste better', 'Possible damage to seals and gaskets over time', 'The oven will turn off automatically'], correctIndex: 2, explanation: 'Extended use at maximum temperatures wears gaskets and seals prematurely.' },
  { question: 'Your combi has a probe thermometer. When should you use it?', options: ['Only for meat', 'For any protein where internal temp matters', 'Only when the chef asks', 'Never — just use time'], correctIndex: 1, explanation: 'Core temperature probes ensure food safety and consistency.' },
  { question: "Switching to a new combi model. What's the most important thing to learn first?", options: ['The brand name', 'The cleaning cycle procedure', 'How it connects to WiFi', 'The color of the display'], correctIndex: 1, explanation: 'Cleaning and maintenance is always job one with new equipment.' },
];

const ESPRESSO_QUESTIONS: SeedQuestion[] = [
  { question: 'Target extraction time for a well-pulled double espresso?', options: ['10–15 seconds', '20–30 seconds', '45–60 seconds', 'AS long as it takes'], correctIndex: 1, explanation: '25 seconds ± 5 is the industry standard for a properly extracted double.' },
  { question: 'Your shot tastes sour and thin. Most likely cause?', options: ['Over-extracted — grind finer', 'Under-extracted — grind finer or extend time', 'Milk was cold', 'Cup was dirty'], correctIndex: 1, explanation: 'Sour + thin = under-extracted. Grind finer or extend contact time.' },
  { question: 'Ideal milk temperature for a cappuccino?', options: ['50°C', '65°C', '85°C', 'Boiling'], correctIndex: 1, explanation: 'Around 60–65°C. Above 70°C the proteins scald and sweetness dies.' },
  { question: 'What creates microfoam?', options: ['Deep-plunged steam wand', 'Steam wand just below the surface stretching then submerging', 'Cold milk left standing', 'A blender'], correctIndex: 1, explanation: 'Aerate by keeping the tip near the surface, then submerge to texture.' },
  { question: 'Correct pump pressure for espresso?', options: ['3 bar', '6 bar', '9 bar', '15 bar'], correctIndex: 2, explanation: '9 bar is the calibrated standard for espresso extraction.' },
  { question: 'Your shot is "channeling" — water finds one path. Fix?', options: ['Increase pressure', 'Redistribute the puck and re-tamp evenly', 'Grind coarser only', 'Use less coffee'], correctIndex: 1, explanation: 'Channeling comes from uneven distribution — redistribute and re-tamp level.' },
  { question: 'Portafilter care during service?', options: ['Wipe between shots', 'Purge + wipe after every shot', 'Only clean at close', 'Never touch it'], correctIndex: 1, explanation: 'Purge and wipe between every shot prevents build-up and off-flavours.' },
  { question: 'Group-head backflush with detergent — how often?', options: ['Every hour', 'Once daily after service', 'Weekly', 'Never'], correctIndex: 2, explanation: 'Detergent backflush is a weekly deep-clean. Water backflushes happen daily.' },
  { question: 'Your shots suddenly slow to a crawl over a week. Likely cause?', options: ['Grinder burrs blunt', 'Beans too fresh', 'Wrong colour cup', 'Barista tired'], correctIndex: 0, explanation: 'Dull burrs produce fines and unpredictable flow. Replace when shots stop dialling in.' },
  { question: 'A guest asks about descaling. Best answer?', options: ['We never descale', 'Descaling schedule depends on water hardness — we track it', 'Only when the machine breaks', 'It descaled itself'], correctIndex: 1, explanation: 'Descaling cadence is water-dependent and logged; slower flow is the first symptom.' },
];

const POS_QUESTIONS: SeedQuestion[] = [
  { question: 'Guest says their card was declined but their bank shows a charge. First move?', options: ['Charge them again', 'Void the last attempt and confirm no duplicate on the batch report', 'Send them away', 'Comp the meal'], correctIndex: 1, explanation: 'Reversal + duplicate check protects both the guest and the venue.' },
  { question: 'Where should "no onions" go on an order?', options: ['Verbally to the kitchen only', 'Item modifier attached to the dish', 'Special notes at checkout', 'Nowhere'], correctIndex: 1, explanation: 'Modifiers ride with the item to the kitchen and to the receipt.' },
  { question: 'End-of-shift: cash drawer is short $6. First step?', options: ['Cover it from tips', 'Log the variance and notify manager', 'Ignore it', 'Reprint receipts'], correctIndex: 1, explanation: 'Every variance is logged. Managers investigate patterns.' },
  { question: 'POS locks up mid-service. Your play?', options: ['Restart everything now', 'Fall back to paper tickets and re-key when service ends', 'Stop taking orders', 'Panic'], correctIndex: 1, explanation: 'Paper fallback keeps guests served. Never restart during service if you can avoid it.' },
  { question: 'A refund typically requires whose authorization?', options: ['Any server', 'Manager or above', 'The guest', 'Nobody'], correctIndex: 1, explanation: 'Manager auth on refunds is a standard theft/error control.' },
  { question: 'Void total on a shift is 3× normal. What does that suggest?', options: ['Great service', 'Investigate for training gap or theft', 'Ignore, it happens', 'The system is broken'], correctIndex: 1, explanation: 'Abnormal voids are the classic tell for theft or a training gap.' },
  { question: 'Splitting a pizza across appetizer and main courses — how?', options: ['Verbally tell the kitchen', 'Use course modifiers so the KDS fires each half at the right time', 'Send both at once', 'Refuse the order'], correctIndex: 1, explanation: 'Course modifiers coordinate the KDS. Verbal-only breaks in the middle of service.' },
  { question: 'Gift card lookup fails at payment. Best next step?', options: ['Refuse the card', 'Look up manually via reference number in the loyalty tool', 'Comp the meal', 'Charge again'], correctIndex: 1, explanation: 'Every gift card has a lookup fallback — use it before writing off revenue.' },
  { question: 'Guest wants to split evenly, but one entrée is on the house. How?', options: ['Split evenly and eat the loss', 'Adjust the item price to zero with manager approval, then split evenly', 'Ask another server', 'Comp the whole bill'], correctIndex: 1, explanation: 'Zero out the specific item with auth, then split — clean audit trail.' },
  { question: 'Modifier accidentally sends a $2 dish at $22. Safest live fix?', options: ['Adjust price with manager auth', 'Ignore, charge $22', 'Refund later after the guest complains', 'Comp everything'], correctIndex: 0, explanation: 'Correct the price in the moment under manager auth. Never assume the guest will notice.' },
];

const BLAST_CHILLER_QUESTIONS: SeedQuestion[] = [
  { question: 'What is the temperature danger zone?', options: ['0–4°C', '4–60°C', '60–100°C', 'Above 100°C'], correctIndex: 1, explanation: '4–60°C is where pathogens multiply fastest. Move food through it fast.' },
  { question: 'Blast chiller vs a walk-in fridge — the difference?', options: ['Same thing, different name', 'A blast chiller drops food through the danger zone rapidly', 'The blast chiller heats food', 'The blast chiller dries food'], correctIndex: 1, explanation: 'Blast chillers are engineered to pull food through the danger zone quickly.' },
  { question: 'HACCP: how long should cooked food take to reach safe cold storage temperature?', options: ['Under 30 minutes', 'Under 2 hours', 'Under 8 hours', 'Overnight is fine'], correctIndex: 1, explanation: 'Standard HACCP: from 60°C to 10°C within 90 minutes, into cold storage within 2 hours.' },
  { question: 'Loading pattern that gets you the fastest chill?', options: ['Stack trays tight to fit more', 'Single trays with airflow gaps', 'One tray in the middle', 'Wrap everything in plastic'], correctIndex: 1, explanation: 'Airflow gaps around every tray let the machine actually chill.' },
  { question: 'Where should the temperature probe go?', options: ['Anywhere in the cavity', 'Thickest part of the food core', 'Attached to the fan', 'On the door seal'], correctIndex: 1, explanation: 'Core temperature at the thickest point is the real number that matters.' },
  { question: 'Minimum safe storage temperature for frozen product?', options: ['-5°C', '-18°C', '-40°C', '0°C'], correctIndex: 1, explanation: '-18°C is the standard for long-term frozen storage.' },
  { question: 'Blast chiller alarm shows "condenser hot". First check?', options: ['Restart the unit', 'Check airflow behind the unit and clean the filter', 'Turn it off and call a technician', 'Ignore it'], correctIndex: 1, explanation: 'Blocked airflow is the number-one cause. Clean the filter first.' },
  { question: 'HACCP temperature records for chilled product — how often?', options: ['Weekly', 'Every batch', 'Only on audits', 'Never'], correctIndex: 1, explanation: 'Every batch is logged. It is the audit trail that keeps the venue compliant.' },
  { question: 'A hot casserole is going into the blast chiller. Cover or not?', options: ['Cover tightly', 'Chill uncovered, then cover once cold', 'Cover with plastic wrap immediately', 'Freeze it hot'], correctIndex: 1, explanation: 'Uncovered while chilling for airflow, covered once cold to prevent contamination.' },
  { question: 'The blast chiller finishes a cycle. What do you do with the product?', options: ['Leave it in the chiller overnight', 'Label with time, date, contents and move to cold storage', 'Serve immediately', 'Freeze it again'], correctIndex: 1, explanation: 'Label, log, and transfer. The blast chiller is not long-term storage.' },
];

const FOH_QUESTIONS: SeedQuestion[] = [
  { question: 'Reservation is 10 minutes late with no message. First move?', options: ['Release the table immediately', 'Wait 30 minutes silently', 'Call the guest to confirm before releasing', 'Blacklist them'], correctIndex: 2, explanation: 'One quick call recovers most no-shows and protects revenue.' },
  { question: 'Tableside ordering tablet freezes mid-order. What now?', options: ['Restart it mid-service', 'Take the order on paper and re-key it after', 'Cancel the order', 'Send the guest to the counter'], correctIndex: 1, explanation: 'Paper fallback keeps the guest experience clean. Reboot later.' },
  { question: 'Guest tells you they have a severe gluten allergy. Where is it safest to record?', options: ['Only verbally to the kitchen', 'The order notes only', 'An allergen flag on the guest / table profile so every ticket carries it', 'Nowhere — you will remember'], correctIndex: 2, explanation: 'A flag on the guest / table follows every ticket. Verbal notes get lost mid-rush.' },
  { question: 'Delivery order arrives with a special request the platform did not send. What do you do?', options: ['Ignore it', 'Phone the guest to confirm before you fire it', 'Cancel the order', 'Call the platform'], correctIndex: 1, explanation: 'A 30-second call to the guest prevents a bad review and a refund.' },
  { question: 'Best guest-facing wait-time display strategy?', options: ['"Any minute now"', 'Live predicted time updated as the pipeline changes', 'Static 15 minutes always', 'No display at all'], correctIndex: 1, explanation: 'Live, honest ETAs are the single biggest lever on lobby satisfaction.' },
  { question: 'Party of eight, everyone wants to pay separately. Cleanest UX?', options: ['One big card and Venmo later', 'Tableside terminal per guest, or QR pay-at-table', 'Cash only', 'Decline the split'], correctIndex: 1, explanation: 'Per-guest tableside or QR pay-at-table is fast and does not tie up service.' },
  { question: 'Guest insists a reservation was booked but nothing is in the system. First response?', options: ['Blame the system', 'Apologize, check the reservation log and email confirmations', 'Refuse them', 'Argue with the guest'], correctIndex: 1, explanation: 'Apologize once, look up the log, resolve the fact — never argue.' },
  { question: 'Menu update cadence for 86\'d items?', options: ['Once a week', 'Once a service', 'Real-time whenever a station 86s an item', 'Never — just tell guests when they order'], correctIndex: 2, explanation: 'Real-time updates from the KDS prevent server rework and guest disappointment.' },
  { question: 'Loyalty QR is not scanning at the register. Fastest recovery?', options: ['Deny the points', 'Look up the loyalty account by phone number and apply manually', 'Ask the guest to email support', 'Comp the meal'], correctIndex: 1, explanation: 'Every loyalty tool has a manual lookup path — memorise it.' },
  { question: 'Guests self-order via QR at the table. Server role now?', options: ['Nothing — the system handles everything', 'Deliver food and drinks and handle exceptions, allergens, and hospitality', 'Only handle payment', 'Wait in the back'], correctIndex: 1, explanation: 'QR handles the transaction. You still handle the hospitality — that is the value.' },
];

const COURSES: SeedCourse[] = [
  {
    slug: 'smart-ovens',
    title: 'Smart Ovens',
    techFocus: 'Combi Oven Operations',
    tagName: 'THERMAL',
    tier: 'IN',
    duration: 35,
    description: 'The combi oven is in 90% of serious kitchens. Master it.',
    provider: 'UNOX',
    isManufacturer: true,
    equipmentName: 'Combi Oven',
    passMark: 80,
    retakeCooldownHours: 24,
    techScoreContribution: 5,
    technicalCompetencies: [
      'Three cooking modes',
      'Temperature & humidity control',
      'Cleaning & maintenance',
      'Error code handling',
      'Food safety protocols',
    ],
    parts: [
      { partId: 'p1', type: 'real_world', title: 'The Real World', duration: '3 min', content: "The combi oven is in 90% of serious kitchens. Once you know this machine, you're untouchable." },
      { partId: 'p2', type: 'knowledge', title: 'The Knowledge', duration: '15 min', content: 'Master the combi oven inside and out.', topics: ['What is a combi oven and why it exists', 'The three cooking modes (steam / convection / combination)', 'Temperature and humidity control', 'Cleaning cycles and maintenance', 'Common mistakes and how to avoid them'] },
      { partId: 'p3', type: 'mastery_check', title: 'The Mastery Check', duration: '10 questions', content: 'Prove you know this equipment. 80% to pass.', questions: COMBI_QUESTIONS },
      { partId: 'p4', type: 'credential', title: 'The Credential', duration: '', content: 'Your Smart Ovens credential. Earned. Yours.' },
    ],
  },
  {
    slug: 'commercial-espresso',
    title: 'Commercial Espresso',
    techFocus: 'Espresso Operations',
    tagName: 'BEVERAGE',
    tier: 'IN',
    duration: 30,
    description: 'Grind, tamp, extract, steam. The espresso machine is your stage.',
    provider: 'quipp',
    isManufacturer: false,
    equipmentName: 'Espresso Machine',
    passMark: 80,
    retakeCooldownHours: 24,
    techScoreContribution: 5,
    technicalCompetencies: ['Grinder calibration', 'Extraction timing', 'Milk texturing', 'Cleaning protocols'],
    parts: [
      { partId: 'p1', type: 'real_world', title: 'The Real World', duration: '3 min', content: 'Every coffee programme depends on the barista who runs the machine.' },
      { partId: 'p2', type: 'knowledge', title: 'The Knowledge', duration: '12 min', content: 'Master espresso operations end to end.', topics: ['Grinder calibration', 'Dose and distribution', 'Extraction timing', 'Milk texturing', 'Cleaning and maintenance'] },
      { partId: 'p3', type: 'mastery_check', title: 'The Mastery Check', duration: '10 questions', content: 'Prove you know this equipment. 80% to pass.', questions: ESPRESSO_QUESTIONS },
      { partId: 'p4', type: 'credential', title: 'The Credential', duration: '', content: 'Your Commercial Espresso credential. Earned. Yours.' },
    ],
  },
  {
    slug: 'pos-systems',
    title: 'POS Systems',
    techFocus: 'Point of Sale Operations',
    tagName: 'DIGITAL',
    tier: 'IN',
    duration: 30,
    description: 'Every order, every payment, every report. Master the system that runs the floor.',
    provider: 'quipp',
    isManufacturer: false,
    equipmentName: 'POS System',
    passMark: 80,
    retakeCooldownHours: 24,
    techScoreContribution: 5,
    technicalCompetencies: ['Order management', 'Payment processing', 'Table management', 'Reporting'],
    parts: [
      { partId: 'p1', type: 'real_world', title: 'The Real World', duration: '3 min', content: 'The POS is the nerve center of every restaurant.' },
      { partId: 'p2', type: 'knowledge', title: 'The Knowledge', duration: '12 min', content: 'Master POS operations end to end.', topics: ['Order management and modifiers', 'Payment processing', 'Table management', 'Reporting and daily close', 'Troubleshooting common issues'] },
      { partId: 'p3', type: 'mastery_check', title: 'The Mastery Check', duration: '10 questions', content: 'Prove you know this system. 80% to pass.', questions: POS_QUESTIONS },
      { partId: 'p4', type: 'credential', title: 'The Credential', duration: '', content: 'Your POS Systems credential. Earned. Yours.' },
    ],
  },
  {
    slug: 'blast-chillers',
    title: 'Blast Chillers',
    techFocus: 'Rapid Cooling Operations',
    tagName: 'COLD',
    tier: 'IN',
    duration: 25,
    description: 'Food safety starts with temperature. Master rapid cooling.',
    provider: 'quipp',
    isManufacturer: false,
    equipmentName: 'Blast Chiller',
    passMark: 80,
    retakeCooldownHours: 24,
    techScoreContribution: 5,
    technicalCompetencies: ['Danger zone management', 'Blast chill cycles', 'HACCP compliance', 'Equipment maintenance'],
    parts: [
      { partId: 'p1', type: 'real_world', title: 'The Real World', duration: '3 min', content: 'Blast chillers prevent the danger zone. Every kitchen needs a cook who knows this.' },
      { partId: 'p2', type: 'knowledge', title: 'The Knowledge', duration: '10 min', content: 'Master blast chilling operations.', topics: ['Temperature danger zone', 'Blast chilling vs slow cooling', 'Shock freezing', 'HACCP compliance', 'Maintenance protocols'] },
      { partId: 'p3', type: 'mastery_check', title: 'The Mastery Check', duration: '10 questions', content: 'Prove you know this equipment. 80% to pass.', questions: BLAST_CHILLER_QUESTIONS },
      { partId: 'p4', type: 'credential', title: 'The Credential', duration: '', content: 'Your Blast Chillers credential. Earned. Yours.' },
    ],
  },
  {
    slug: 'foh-tech',
    title: 'FOH Tech',
    techFocus: 'Front of House Technology',
    tagName: 'SERVICE',
    tier: 'IN',
    duration: 30,
    description: 'Reservations, ordering tablets, guest-facing tech. Own the floor.',
    provider: 'quipp',
    isManufacturer: false,
    equipmentName: 'FOH Systems',
    passMark: 80,
    retakeCooldownHours: 24,
    techScoreContribution: 5,
    technicalCompetencies: ['Reservation systems', 'Tableside ordering', 'Delivery integration', 'Guest experience tech'],
    parts: [
      { partId: 'p1', type: 'real_world', title: 'The Real World', duration: '3 min', content: 'Guests interact with technology before they interact with you. Know the tools.' },
      { partId: 'p2', type: 'knowledge', title: 'The Knowledge', duration: '12 min', content: 'Master front-of-house technology.', topics: ['Reservation systems', 'Tableside ordering', 'Guest-facing displays', 'Delivery platform integration', 'Tech-enhanced service flow'] },
      { partId: 'p3', type: 'mastery_check', title: 'The Mastery Check', duration: '10 questions', content: 'Prove you know FOH tech. 80% to pass.', questions: FOH_QUESTIONS },
      { partId: 'p4', type: 'credential', title: 'The Credential', duration: '', content: 'Your FOH Tech credential. Earned. Yours.' },
    ],
  },
];

export async function seedTaxonomy(): Promise<void> {
  for (const tag of TAGS) {
    await TechnologyTag.updateOne(
      { tagName: tag.tagName },
      { $set: tag },
      { upsert: true },
    );
  }
  logger.info(`Seeded ${TAGS.length} technology tags`);
}

export async function seedCourses(): Promise<void> {
  for (const c of COURSES) {
    await Course.updateOne({ slug: c.slug }, { $set: c }, { upsert: true });
  }
  logger.info(`Seeded ${COURSES.length} courses`);
}

/**
 * Back-fill Profile rows for any User created before Profile was introduced.
 * Idempotent — safe to run every deploy.
 */
export async function backfillProfiles(): Promise<void> {
  const users = await User.find({}).select('_id email firstName');
  let created = 0;
  for (const user of users) {
    const exists = await Profile.exists({ userId: user._id });
    if (exists) continue;
    await createProfileForUser({
      userId: String(user._id),
      firstName: user.firstName ?? null,
      email: user.email,
    });
    created += 1;
  }
  logger.info(`Back-filled ${created} profile(s)`);
}

export async function seedAll(): Promise<void> {
  await seedTaxonomy();
  await seedCourses();
  await backfillProfiles();
}
