// QUIPP Academy — Complete Course Catalog (20 courses × 3 tiers = 60 credentials)

export type TagName = 'THERMAL' | 'COLD' | 'BEVERAGE' | 'DIGITAL' | 'COMPLIANCE' | 'MANAGEMENT';

export interface CourseTierDetail {
  duration: string;
  modules: number;
  summary: string;
  whatYouWillLearn: string[];
  whoItIsFor: string;
  prerequisites: string;
}

export interface AcademyCourse {
  number: string; // "01" - "20"
  title: string;
  tag: TagName;
  totalTime: string;
  tiers: {
    IN: CourseTierDetail;
    DEEP: CourseTierDetail;
    THERE: CourseTierDetail;
  };
  disclaimer?: string;
}

export const academyCourses: AcademyCourse[] = [
  // ── THERMAL ──
  {
    number: '01', title: 'Combi Oven', tag: 'THERMAL', totalTime: '3.5–4.5 hours',
    tiers: {
      IN: {
        duration: '50 min', modules: 6,
        summary: 'The science behind steam, convection, and their combination — why it matters for every protein, vegetable, and baked item you put inside it.',
        whatYouWillLearn: [
          'The science of steam and convection heat transfer — why each mode does what it does',
          'How humidity percentage affects browning, moisture retention, and surface temperature',
          'How to read any combi oven interface regardless of brand or model',
          'The decision framework for choosing mode, temperature, and time for any ingredient',
        ],
        whoItIsFor: 'Any BOH professional who uses a combi oven — from commis cook to sous chef. No prior technical knowledge required.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '65 min', modules: 6,
        summary: 'Precision control, multi-variable cooking logic, and diagnosing problems before they affect a service.',
        whatYouWillLearn: [
          'How to build and modify cooking programs for specific ingredients and outcomes',
          'Multi-stage cooking logic — when and why to combine modes in sequence',
          'How to read visual and sensory cues that tell you what the machine is actually doing',
          'Diagnosing common combi oven failures and deciding when to intervene',
        ],
        whoItIsFor: 'Sous chefs, head chefs, and senior kitchen professionals.',
        prerequisites: 'Combi Oven IN or verified equivalent experience',
      },
      THERE: {
        duration: '80 min', modules: 6,
        summary: 'Design original cooking logic from first principles. The level where the technology becomes a creative tool.',
        whatYouWillLearn: [
          'Designing original cooking programs from first principles for novel applications',
          'The science of collagen conversion, protein denaturation, and starch gelatinisation at depth',
          'Building a kitchen testing protocol — how to document, adjust, and repeat results',
          'Advanced humidity control and its applications in pastry, charcuterie, and fermentation',
        ],
        whoItIsFor: 'Head chefs, executive chefs, and culinary directors.',
        prerequisites: 'Combi Oven DEEP + verified operator endorsement',
      },
    },
  },
  {
    number: '02', title: 'High-Heat Grilling & Griddle', tag: 'THERMAL', totalTime: '3–4 hours',
    tiers: {
      IN: {
        duration: '48 min', modules: 6,
        summary: 'The Maillard reaction, heat source behaviour, and the decision framework for any grill or flat-top regardless of brand or fuel type.',
        whatYouWillLearn: [
          'The Maillard reaction — what it is, why it matters, and exactly what conditions trigger it',
          'How gas, electric, charcoal, and induction heat sources behave differently at the surface',
          'Why moisture is the enemy of browning — and how to manage it',
          'The temperature and timing decision framework for proteins, vegetables, and bread',
        ],
        whoItIsFor: 'Any BOH professional working a grill or flat-top station.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '62 min', modules: 6,
        summary: 'Zone management, carryover heat, and crust development at depth.',
        whatYouWillLearn: [
          'Zone temperature management on a single grill surface',
          'Carryover cooking — how to account for it and use it deliberately',
          'Crust development variables — fat content, sugar, surface moisture, and their interactions',
          'Managing a high-volume grill station during a service push without sacrificing quality',
        ],
        whoItIsFor: 'Grill section leads, sous chefs, and senior line cooks.',
        prerequisites: 'Grilling & Griddle IN',
      },
      THERE: {
        duration: '75 min', modules: 6,
        summary: 'Design the grill station — setup, sequence, standards, and the training protocol for the people using it.',
        whatYouWillLearn: [
          'Designing a grill station operating system — setup, zone map, cleaning cycle, standard documentation',
          'The science of smoke, char, and controlled carbonisation',
          'Species and cut-specific decision frameworks for proteins you have not cooked before',
          'Building a grill station training protocol for new team members',
        ],
        whoItIsFor: 'Head chefs and senior culinary professionals responsible for grill station standards.',
        prerequisites: 'Grilling & Griddle DEEP + verified operator endorsement',
      },
    },
  },
  {
    number: '03', title: 'Sous Vide & Low-Temperature Cooking', tag: 'THERMAL', totalTime: '3.5–4.5 hours',
    tiers: {
      IN: {
        duration: '52 min', modules: 6,
        summary: 'The actual science of water as a heat transfer medium and precise temperature control — applicable to any immersion circulator or water bath.',
        whatYouWillLearn: [
          'Why water transfers heat more efficiently than air — and what that means for cooking precision',
          'Protein denaturation temperatures — what happens to different proteins at specific heat levels',
          'Food safety in low-temperature cooking — the time and temperature relationship that makes it safe',
          'The decision framework for choosing temperature and time for any ingredient',
        ],
        whoItIsFor: 'Any BOH professional introduced to sous vide equipment.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '68 min', modules: 6,
        summary: 'Pasteurisation curves, collagen conversion, and the science of the finishing sear.',
        whatYouWillLearn: [
          'Pasteurisation curves — how time compensates for lower temperature in food safety terms',
          'Collagen conversion in low-temperature braises — the time and temperature window that works',
          'The finishing step — why the sear after sous vide requires different technique than a direct sear',
          'Batch cooking and holding protocols for high-volume kitchen contexts',
        ],
        whoItIsFor: 'Sous chefs and senior kitchen professionals with hands-on sous vide experience.',
        prerequisites: 'Sous Vide IN',
      },
      THERE: {
        duration: '78 min', modules: 6,
        summary: 'Design custom time-temperature protocols and build the documentation system that makes your results repeatable by anyone on your team.',
        whatYouWillLearn: [
          'Designing custom time-temperature protocols for novel ingredients and applications',
          'The science of texture modification through low-temperature cooking',
          'Multi-stage low-temperature programs — combining bath, rest, and finishing with intent',
          'Building a sous vide program documentation and training system',
        ],
        whoItIsFor: 'Executive chefs and culinary directors.',
        prerequisites: 'Sous Vide DEEP + verified operator endorsement',
      },
    },
  },
  {
    number: '04', title: 'Fryer Operations', tag: 'THERMAL', totalTime: '3–4 hours',
    tiers: {
      IN: {
        duration: '47 min', modules: 6,
        summary: 'Why oil temperature matters, what happens to food in hot oil, and how oil degrades — applicable to any fryer, any oil type.',
        whatYouWillLearn: [
          'Heat transfer in hot oil — why frying works and what variables control the result',
          'Oil degradation — what causes it, how to read it, and when oil must be changed',
          'The relationship between oil temperature, moisture, and crust formation',
          'Food safety fundamentals in high-temperature frying environments',
        ],
        whoItIsFor: 'Any BOH professional operating a fryer. Essential for QSR, casual dining, and hotel kitchens.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '60 min', modules: 6,
        summary: 'Oil chemistry, filtration systems, and quality consistency across a high-volume service.',
        whatYouWillLearn: [
          'Oil chemistry — smoke point, free fatty acids, and how different oil types behave under heat',
          'Filtration systems — how they work, when to filter, and what filtration cannot fix',
          'Batch size management — how overloading a fryer affects oil temperature recovery',
          'Building a fryer station quality and safety protocol',
        ],
        whoItIsFor: 'Kitchen section leads, sous chefs, and QSR managers.',
        prerequisites: 'Fryer Operations IN',
      },
      THERE: {
        duration: '72 min', modules: 6,
        summary: 'Design the fryer program — oil selection, temperature protocols, filtration schedules, and the training system.',
        whatYouWillLearn: [
          'Oil selection for specific menu applications — smoke point, flavour neutrality, and cost variables',
          'Designing a full fryer station operating system',
          'The science of batter and breading — how different coatings behave at different temperatures',
          'Building and implementing a fryer station training protocol',
        ],
        whoItIsFor: 'Head chefs and kitchen operations managers.',
        prerequisites: 'Fryer Operations DEEP + verified operator endorsement',
      },
    },
  },
  {
    number: '05', title: 'Smoker & Slow Cook Technology', tag: 'THERMAL', totalTime: '3.5–4.5 hours',
    tiers: {
      IN: {
        duration: '50 min', modules: 6,
        summary: 'The science of low-and-slow cooking — how collagen converts, what smoke compounds do, and how different wood types produce different results.',
        whatYouWillLearn: [
          'The science of collagen-to-gelatin conversion — why time and low heat transform tough cuts',
          'How smoke works — the compounds in wood smoke and how they interact with meat',
          'Wood type variables — how different species produce different smoke profiles',
          'The decision framework for time, temperature, and wood selection',
        ],
        whoItIsFor: 'Any BOH professional working with smokers or slow-cook systems.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '65 min', modules: 6,
        summary: 'Stall management, bark development, moisture control, and service timing for slow-cooked items.',
        whatYouWillLearn: [
          'The stall — what it is, why it happens, and the decisions available when it occurs',
          'Bark development — the science of the outer crust on slow-cooked proteins',
          'Moisture management in long cooks — wrapping, spritzing, and their effects',
          'Holding and service protocols for slow-cooked items in a high-volume kitchen',
        ],
        whoItIsFor: 'Senior BOH professionals with hands-on smoker experience.',
        prerequisites: 'Smoker & Slow Cook IN',
      },
      THERE: {
        duration: '78 min', modules: 6,
        summary: 'Design the smoking and slow-cook program for your kitchen — wood selection, protocols, timing sequences, and documentation.',
        whatYouWillLearn: [
          'Designing custom slow-cook programs for novel applications and equipment combinations',
          'The chemistry of smoke penetration — the smoke ring, its causes, and what it tells you',
          'Multi-stage slow-cook programs combining different heat sources and methods',
          'Building a slow-cook program documentation and training system',
        ],
        whoItIsFor: 'Executive chefs and culinary directors.',
        prerequisites: 'Smoker & Slow Cook DEEP + verified operator endorsement',
      },
    },
  },
  // ── COLD ──
  {
    number: '06', title: 'Blast Chiller Operations', tag: 'COLD', totalTime: '3–4 hours',
    tiers: {
      IN: {
        duration: '48 min', modules: 6,
        summary: 'The blast chiller is not a fast fridge — it is a food safety system. Learn why rapid chilling matters and the decision framework for any machine.',
        whatYouWillLearn: [
          'Why rapid chilling matters — the microbiology of the danger zone during slow cooling',
          'Ice crystal formation — how fast chilling preserves texture in a way slow chilling cannot',
          'The difference between blast chilling and blast freezing',
          'The decision framework for load size, probe placement, and cycle selection',
        ],
        whoItIsFor: 'Any BOH professional with access to a blast chiller. Essential for cook-chill operations.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '62 min', modules: 6,
        summary: 'Cook-chill systems, regeneration protocols, and quality management across a full production cycle.',
        whatYouWillLearn: [
          'Cook-chill program design — cooking, chilling, holding, and regeneration in sequence',
          'Regeneration science — what happens to food during reheating and how to control it',
          'HACCP documentation for cook-chill systems',
          'Managing a blast chiller in a high-volume banqueting or production kitchen',
        ],
        whoItIsFor: 'Sous chefs, head chefs, and kitchen managers operating cook-chill programs.',
        prerequisites: 'Blast Chiller IN',
      },
      THERE: {
        duration: '75 min', modules: 6,
        summary: 'Design the complete cook-chill program — production schedule, equipment protocols, HACCP documentation, and team training.',
        whatYouWillLearn: [
          'Designing a full cook-chill production program for your kitchen\'s specific volume and menu',
          'Cold chain integrity — mapping every handoff point and the risk at each one',
          'Building a HACCP-compliant documentation system for cook-chill operations',
          'Training your team to operate a cook-chill program to a consistent standard',
        ],
        whoItIsFor: 'Executive chefs, kitchen operations managers, and culinary directors.',
        prerequisites: 'Blast Chiller DEEP + verified operator endorsement',
      },
    },
  },
  {
    number: '07', title: 'Cold Chain & Refrigeration Management', tag: 'COLD', totalTime: '3–4 hours',
    tiers: {
      IN: {
        duration: '47 min', modules: 6,
        summary: 'The cold chain is the entire connected system that keeps food safe from delivery to service — and every link is a decision point.',
        whatYouWillLearn: [
          'The science of bacterial growth in the temperature danger zone',
          'How mechanical refrigeration works — the cycle that removes heat from a space',
          'Cold storage organisation — why layout affects both food safety and product quality',
          'The decision framework for receiving, storing, and monitoring cold chain compliance',
        ],
        whoItIsFor: 'Any hospitality professional with responsibility for cold storage.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '60 min', modules: 6,
        summary: 'Supplier delivery standards, temperature monitoring systems, and building a cold chain compliance system.',
        whatYouWillLearn: [
          'Supplier delivery standards — how to receive, inspect, and reject cold chain deliveries',
          'Temperature monitoring technology — probes, data loggers, and automated systems',
          'Cold chain failure response — what to do when a link breaks',
          'Building a cold chain compliance system for a multi-department operation',
        ],
        whoItIsFor: 'Kitchen managers, F&B managers, and operations professionals.',
        prerequisites: 'Cold Chain IN',
      },
      THERE: {
        duration: '73 min', modules: 6,
        summary: 'Design and manage the cold chain system — from supplier specifications through receiving, storage, production, and service.',
        whatYouWillLearn: [
          'Designing a cold chain specification system — supplier standards, delivery protocols, rejection criteria',
          'HACCP cold chain documentation — the records required and how to build systems that produce them',
          'Cold chain audit preparation — what inspectors look for and how to be ready',
          'Building a cold chain training program for a mixed-experience team',
        ],
        whoItIsFor: 'Executive chefs, operations directors, and food safety leads.',
        prerequisites: 'Cold Chain DEEP + verified operator endorsement',
      },
    },
  },
  {
    number: '08', title: 'Vacuum Packing & Modified Atmosphere', tag: 'COLD', totalTime: '3–4 hours',
    tiers: {
      IN: {
        duration: '46 min', modules: 6,
        summary: 'Vacuum packing extends shelf life and enables sous vide — but creates specific food safety risks most kitchen workers don\'t understand.',
        whatYouWillLearn: [
          'The science of vacuum packing — what removing oxygen does to food',
          'Anaerobic bacteria — the specific food safety risk created by oxygen-free environments',
          'The difference between vacuum packing and modified atmosphere packaging',
          'The decision framework for seal strength, bag selection, and labelling',
        ],
        whoItIsFor: 'Any BOH professional using vacuum packing equipment.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '60 min', modules: 6,
        summary: 'Modified atmosphere systems, shelf life extension protocols, and the food safety management decisions that make operations compliant.',
        whatYouWillLearn: [
          'Modified atmosphere packaging science — gas ratios and their effects on different food categories',
          'Shelf life extension protocols — the science and the regulatory requirements',
          'Anaerobic pathogen management — Clostridium botulinum risk and the controls that address it',
          'Building a vacuum and MAP documentation system',
        ],
        whoItIsFor: 'Sous chefs, head chefs, and kitchen managers operating extended shelf life programs.',
        prerequisites: 'Vacuum Packing IN',
      },
      THERE: {
        duration: '72 min', modules: 6,
        summary: 'Design the complete vacuum and MAP program — product specifications, shelf life parameters, HACCP documentation, and team training.',
        whatYouWillLearn: [
          'Designing a vacuum and MAP production program from scratch',
          'Challenge testing and shelf life validation — how to establish and verify shelf life claims',
          'HACCP documentation for extended shelf life products',
          'Building a vacuum and MAP training and quality assurance system',
        ],
        whoItIsFor: 'Executive chefs and operations directors.',
        prerequisites: 'Vacuum Packing DEEP + verified operator endorsement',
      },
    },
  },
  // ── BEVERAGE ──
  {
    number: '09', title: 'Espresso & Coffee Extraction', tag: 'BEVERAGE', totalTime: '3.5–4.5 hours',
    tiers: {
      IN: {
        duration: '50 min', modules: 6,
        summary: 'The chemistry of extraction, the science of pressure and temperature, and the decision framework for any espresso machine regardless of brand.',
        whatYouWillLearn: [
          'The chemistry of coffee extraction — what dissolves in water, in what order, and why it matters',
          'The four extraction variables — grind size, dose, temperature, and time — and how they interact',
          'How to read an espresso — what over-extraction and under-extraction taste like and why',
          'The decision framework for dialling in any espresso machine to any coffee',
        ],
        whoItIsFor: 'Any hospitality professional making espresso.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '65 min', modules: 6,
        summary: 'Milk science, menu calibration, and the variables behind consistent quality across a full service.',
        whatYouWillLearn: [
          'The science of milk texturing — protein denaturation, fat content, and temperature thresholds',
          'Espresso-to-milk ratio variables and their effect on flavour balance',
          'Machine calibration — how to document a recipe and maintain it across a team',
          'Diagnosing inconsistency on a high-volume espresso bar during service',
        ],
        whoItIsFor: 'Senior baristas, café supervisors, and F&B professionals.',
        prerequisites: 'Espresso IN',
      },
      THERE: {
        duration: '78 min', modules: 6,
        summary: 'Design the coffee program — bean selection, extraction parameters, milk protocols, menu architecture, and team training.',
        whatYouWillLearn: [
          'Coffee sourcing and roast profile variables — how to specify and evaluate beans',
          'Designing extraction parameters for different brew methods and coffee origins',
          'Building a barista training and calibration system for a multi-person operation',
          'Menu design for a coffee program — how drink architecture affects extraction parameters',
        ],
        whoItIsFor: 'Café managers, F&B directors, and senior baristas building a specialty coffee program.',
        prerequisites: 'Espresso DEEP + verified operator endorsement',
      },
    },
  },
  {
    number: '10', title: 'Automatic Coffee Systems', tag: 'BEVERAGE', totalTime: '3–4 hours',
    tiers: {
      IN: {
        duration: '47 min', modules: 6,
        summary: 'How automatic and super-automatic coffee machines work — and why understanding them changes how you maintain and operate them.',
        whatYouWillLearn: [
          'How automatic coffee systems work — the brewing cycle, grinder, and milk system',
          'The variables an automatic system controls and the ones the operator still decides',
          'Cleaning and maintenance cycles — why they matter and what happens when skipped',
          'How to diagnose the most common automatic coffee system failures',
        ],
        whoItIsFor: 'Any hospitality worker operating automatic coffee equipment.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '60 min', modules: 6,
        summary: 'Machine programming, quality management, and maintenance systems for automatic equipment in high-volume environments.',
        whatYouWillLearn: [
          'Programming automatic coffee systems — the parameters available and how to adjust them',
          'Bean-to-cup quality variables — how grind settings, dose, and water temperature interact',
          'Building a cleaning and maintenance schedule for high-volume automatic equipment',
          'Managing automatic coffee quality across a team with varying technical knowledge',
        ],
        whoItIsFor: 'F&B supervisors and hotel operations managers.',
        prerequisites: 'Automatic Coffee IN',
      },
      THERE: {
        duration: '72 min', modules: 6,
        summary: 'Specify, configure, and manage the automatic coffee program — machine selection, programming, maintenance systems, and team training.',
        whatYouWillLearn: [
          'Machine specification for different hospitality contexts',
          'Full system programming — configuring from factory settings for your operation',
          'Building a preventative maintenance system that extends equipment life',
          'Designing a quality assurance and training program for automatic coffee operations',
        ],
        whoItIsFor: 'Operations directors, F&B managers, and procurement leads.',
        prerequisites: 'Automatic Coffee DEEP + verified operator endorsement',
      },
    },
  },
  {
    number: '11', title: 'Bar Equipment & Cocktail Technology', tag: 'BEVERAGE', totalTime: '3–4 hours',
    tiers: {
      IN: {
        duration: '48 min', modules: 6,
        summary: 'The science and technology behind ice machines, carbonation systems, blenders, and speed rails — and how to make decisions at any bar setup.',
        whatYouWillLearn: [
          'Ice science — how different ice types are made and which application each serves',
          'Carbonation systems — how they work, what controls carbonation level, how to maintain them',
          'Blender technology — the variables that determine emulsification and texture',
          'The decision framework for diagnosing bar equipment failure during service',
        ],
        whoItIsFor: 'Any bar professional working with equipment beyond the basics.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '62 min', modules: 6,
        summary: 'Precision tools, batch systems, and the technology behind consistency at high volume — rotary evaporators, centrifuges, batch carbonation.',
        whatYouWillLearn: [
          'Rotary evaporation and vacuum distillation — the science and the bar application',
          'Centrifuge clarification — how it works and what it produces',
          'Batch carbonation and scaling — maintaining quality and consistency at high volume',
          'Building a bar equipment maintenance and quality system',
        ],
        whoItIsFor: 'Senior bartenders, bar managers, and beverage directors with advanced bar technology.',
        prerequisites: 'Bar Equipment IN',
      },
      THERE: {
        duration: '75 min', modules: 6,
        summary: 'Design the bar technology program — equipment specification, operating protocols, maintenance systems, and team training.',
        whatYouWillLearn: [
          'Designing a bar technology program from first principles',
          'Original technique development using precision bar tools — documentation and replication',
          'Building a bar team training program for technology-forward operations',
          'Specification and procurement criteria for bar equipment investment',
        ],
        whoItIsFor: 'Bar directors, beverage managers, and senior bartenders responsible for bar program design.',
        prerequisites: 'Bar Equipment DEEP + verified operator endorsement',
      },
    },
  },
  // ── DIGITAL ──
  {
    number: '12', title: 'Kitchen Display Systems', tag: 'DIGITAL', totalTime: '3–4 hours',
    tiers: {
      IN: {
        duration: '46 min', modules: 6,
        summary: 'How a KDS works, how to read one efficiently, and what to do when it fails — applicable to any brand or layout.',
        whatYouWillLearn: [
          'How a KDS works — the technology connecting POS, kitchen, and pass in real time',
          'How to read a KDS efficiently — ticket prioritisation, timing indicators, and course management',
          'The difference between KDS brands and what stays consistent across systems',
          'How to respond when the KDS fails — service continuity without the screen',
        ],
        whoItIsFor: 'Any BOH professional working with a kitchen display system.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '60 min', modules: 6,
        summary: 'KDS configuration, data analytics, and using the system to manage service quality — not just track tickets.',
        whatYouWillLearn: [
          'KDS configuration — routing logic, station assignments, and timing thresholds',
          'Using KDS data to identify service bottlenecks and make real-time adjustments',
          'Integration with POS and reservation systems',
          'Managing a KDS system across multiple stations in a high-volume kitchen',
        ],
        whoItIsFor: 'Sous chefs, head chefs, and kitchen managers.',
        prerequisites: 'KDS IN',
      },
      THERE: {
        duration: '72 min', modules: 6,
        summary: 'Design and manage the KDS system — configuration, integration, data reporting, and team training.',
        whatYouWillLearn: [
          'Designing a KDS configuration for your specific kitchen layout and service model',
          'KDS data reporting — the metrics that matter and how to build a weekly review practice',
          'Integration with restaurant technology — reservations, delivery platforms, and labour systems',
          'Building a KDS training and onboarding program',
        ],
        whoItIsFor: 'Head chefs, operations managers, and technology leads.',
        prerequisites: 'KDS DEEP + verified operator endorsement',
      },
    },
  },
  {
    number: '13', title: 'POS Systems for Hospitality', tag: 'DIGITAL', totalTime: '3–4 hours',
    tiers: {
      IN: {
        duration: '47 min', modules: 6,
        summary: 'How a POS system actually works, what data it generates, and how to navigate any platform confidently.',
        whatYouWillLearn: [
          'How a POS system works — the technology behind a transaction from order to payment',
          'The data a POS generates — what is recorded and why it matters',
          'Core navigation principles that apply across different POS platforms',
          'How to respond to common POS failures during service',
        ],
        whoItIsFor: 'Any hospitality worker using a POS system — FOH, bar, hotel front desk, and BOH managers.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '60 min', modules: 6,
        summary: 'POS reporting, menu management, and using the system\'s data to make better operational decisions.',
        whatYouWillLearn: [
          'POS reporting fundamentals — the reports that matter and how to read them',
          'Menu management in a POS system — item setup, modifiers, and pricing',
          'Labour and sales data integration',
          'Using POS analytics to identify patterns in sales, voids, and server performance',
        ],
        whoItIsFor: 'Restaurant managers, F&B supervisors, and operations professionals.',
        prerequisites: 'POS IN',
      },
      THERE: {
        duration: '72 min', modules: 6,
        summary: 'Manage the POS system for your operation — configuration, menu architecture, reporting frameworks, integrations, and team training.',
        whatYouWillLearn: [
          'POS system configuration and menu architecture from the ground up',
          'Integration management — connecting POS with reservation, delivery, inventory, and labour systems',
          'Building a POS reporting system — dashboards and weekly reviews that drive decisions',
          'Designing a POS training and onboarding program',
        ],
        whoItIsFor: 'General managers, operations directors, and technology leads.',
        prerequisites: 'POS DEEP + verified operator endorsement',
      },
    },
  },
  {
    number: '14', title: 'Delivery Platform Management', tag: 'DIGITAL', totalTime: '3–4 hours',
    tiers: {
      IN: {
        duration: '46 min', modules: 6,
        summary: 'How delivery platforms work, how orders flow through them, and how to make confident decisions on any platform.',
        whatYouWillLearn: [
          'How delivery platforms work — the technology connecting customer, platform, and kitchen',
          'Order flow management — integrating platform orders with in-house service',
          'The data delivery platforms generate and what it tells you',
          'How to respond to platform failures during service',
        ],
        whoItIsFor: 'Any kitchen or operations professional managing delivery orders.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '60 min', modules: 6,
        summary: 'Menu optimisation, platform analytics, and building a delivery operation that works alongside in-house service.',
        whatYouWillLearn: [
          'Delivery menu architecture — designing a menu that travels well and performs on platform algorithms',
          'Platform analytics — using data to make decisions about pricing, items, and hours',
          'Kitchen capacity management — absorbing delivery volume without degrading in-house service',
          'Managing multiple platforms simultaneously',
        ],
        whoItIsFor: 'Restaurant managers, ghost kitchen operators, and F&B managers.',
        prerequisites: 'Delivery Platforms IN',
      },
      THERE: {
        duration: '72 min', modules: 6,
        summary: 'Design and manage the full delivery operation — platform selection, menu architecture, technology integration, and performance reporting.',
        whatYouWillLearn: [
          'Platform selection and negotiation — evaluating delivery platforms for your operation',
          'Designing a delivery kitchen operation from scratch',
          'Full platform integration — connecting delivery data with POS, inventory, and labour systems',
          'Building a delivery performance reporting framework',
        ],
        whoItIsFor: 'Operations directors, multi-site managers, and hospitality entrepreneurs scaling delivery.',
        prerequisites: 'Delivery Platforms DEEP + verified operator endorsement',
      },
    },
  },
  {
    number: '15', title: 'Inventory & Ordering Technology', tag: 'DIGITAL', totalTime: '3–4 hours',
    tiers: {
      IN: {
        duration: '46 min', modules: 6,
        summary: 'How inventory management systems work, what they track, and how to use any platform to make better purchasing decisions.',
        whatYouWillLearn: [
          'How inventory management systems work — what they track and how data flows',
          'Par levels and reorder points — the logic behind automated ordering',
          'The connection between inventory data and food cost',
          'How to conduct a physical inventory count that produces data you can trust',
        ],
        whoItIsFor: 'Any BOH professional with ordering or inventory responsibilities.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '60 min', modules: 6,
        summary: 'Food cost management, waste reduction, and using inventory data to make operational decisions.',
        whatYouWillLearn: [
          'Recipe costing in an inventory system — how to build a costed recipe and use it for menu decisions',
          'Variance analysis — the gap between theoretical and actual food cost and what it tells you',
          'Supplier management through inventory technology',
          'Building a waste tracking system that identifies where food cost is leaking',
        ],
        whoItIsFor: 'Kitchen managers, sous chefs, and F&B managers responsible for food cost.',
        prerequisites: 'Inventory IN',
      },
      THERE: {
        duration: '72 min', modules: 6,
        summary: 'Design and manage the inventory system — platform configuration, recipe costing architecture, reporting frameworks, and team training.',
        whatYouWillLearn: [
          'Inventory system configuration — setting up an inventory platform for your specific operation',
          'Building a complete recipe costing architecture — from ingredient to menu price',
          'Food cost reporting systems — the weekly and monthly reports that drive purchasing decisions',
          'Designing an inventory management training program',
        ],
        whoItIsFor: 'Executive chefs, operations directors, and F&B managers responsible for food cost.',
        prerequisites: 'Inventory DEEP + verified operator endorsement',
      },
    },
  },
  // ── COMPLIANCE ──
  {
    number: '16', title: 'Food Safety & HACCP', tag: 'COMPLIANCE', totalTime: '3.5–4.5 hours',
    disclaimer: 'This course is comprehensive knowledge training. It does not replace or substitute for official food handler certification required by your local jurisdiction.',
    tiers: {
      IN: {
        duration: '52 min', modules: 6,
        summary: 'Not a checklist — a system of thinking. The microbiology, the hazard logic, and the decision framework that makes HACCP genuinely protective.',
        whatYouWillLearn: [
          'The biology of foodborne illness — the pathogens that matter, how they grow, and what stops them',
          'The seven HACCP principles — as a logic system to understand, not a list to memorise',
          'Critical control points — how to identify them in your own kitchen environment',
          'Temperature as a control — the science behind the danger zone and time-temperature relationship',
        ],
        whoItIsFor: 'Any hospitality professional who handles food.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '65 min', modules: 6,
        summary: 'HACCP plan development, verification procedures, and managing a food safety system in a real kitchen.',
        whatYouWillLearn: [
          'Conducting a hazard analysis — identifying biological, chemical, and physical hazards',
          'CCP determination — applying the decision tree and documenting your reasoning',
          'Monitoring and verification procedures — how to build checks that work in a busy kitchen',
          'Corrective action protocols — what to do when a critical limit is breached',
        ],
        whoItIsFor: 'Kitchen managers, sous chefs, and food safety leads.',
        prerequisites: 'Food Safety IN',
      },
      THERE: {
        duration: '80 min', modules: 6,
        summary: 'Design, implement, and manage the HACCP system — from hazard analysis through plan development, team training, and audit preparation.',
        whatYouWillLearn: [
          'Designing a complete HACCP plan for a specific hospitality operation',
          'Building the verification and validation systems that prove the plan is working',
          'Health inspection preparation — what inspectors assess and how to be genuinely ready',
          'Designing a food safety training system that builds real understanding',
        ],
        whoItIsFor: 'Executive chefs, operations directors, and food safety managers.',
        prerequisites: 'Food Safety DEEP + verified operator endorsement',
      },
    },
  },
  {
    number: '17', title: 'Allergen Awareness', tag: 'COMPLIANCE', totalTime: '3–4 hours',
    disclaimer: 'This course is comprehensive knowledge training. It does not replace or substitute for official food handler certification required by your local jurisdiction.',
    tiers: {
      IN: {
        duration: '50 min', modules: 6,
        summary: 'The science of allergic reaction, the 14 major allergens, and the decision framework for allergen management in any kitchen.',
        whatYouWillLearn: [
          'The immunology of allergic reaction — what happens in the body and why it can be fatal',
          'The 14 major allergens — what they are and where they hide in a professional kitchen',
          'Cross-contamination pathways — how allergens move from one surface to another',
          'The guest communication framework for allergen enquiries',
        ],
        whoItIsFor: 'All hospitality professionals — BOH and FOH.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '62 min', modules: 6,
        summary: 'Allergen management systems — the menus, processes, controls, and communication protocols that protect sensitive guests.',
        whatYouWillLearn: [
          'Allergen matrix development — building and maintaining a complete allergen menu document',
          'Preparation protocols for allergen-sensitive orders',
          'Team communication systems — how allergen information travels from guest to kitchen and back',
          'Incident response — what to do when an allergen error is suspected or confirmed',
        ],
        whoItIsFor: 'Kitchen managers, restaurant managers, and food safety leads.',
        prerequisites: 'Allergen IN',
      },
      THERE: {
        duration: '75 min', modules: 6,
        summary: 'Design and manage the allergen system — menu documentation, kitchen protocols, team training, and audit preparation.',
        whatYouWillLearn: [
          'Designing a complete allergen management system for a hospitality operation',
          'Menu engineering for allergen transparency',
          'Building an allergen training program that produces genuine understanding',
          'Allergen audit preparation — the documentation and procedures that demonstrate compliance',
        ],
        whoItIsFor: 'Operations directors, executive chefs, and food safety managers.',
        prerequisites: 'Allergen DEEP + verified operator endorsement',
      },
    },
  },
  {
    number: '18', title: 'Workplace Hygiene & Sanitation', tag: 'COMPLIANCE', totalTime: '3–4 hours',
    disclaimer: 'This course is comprehensive knowledge training. It does not replace or substitute for official food handler certification required by your local jurisdiction.',
    tiers: {
      IN: {
        duration: '48 min', modules: 6,
        summary: 'The microbiology of cross-contamination, the science behind effective cleaning and sanitising, and the decision framework for any kitchen.',
        whatYouWillLearn: [
          'The microbiology of cross-contamination — how pathogens move from surface to food to person',
          'The difference between cleaning and sanitising — why both are required and neither alone is enough',
          'Personal hygiene standards — the science behind handwashing, glove use, and uniform protocols',
          'The colour-coding system — the logic behind it and how it prevents cross-contamination',
        ],
        whoItIsFor: 'All hospitality professionals.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '60 min', modules: 6,
        summary: 'Cleaning schedules, chemical management, and building a hygiene system that holds up under real operational pressure.',
        whatYouWillLearn: [
          'Chemical selection for different surfaces — dilution, contact time, and compatibility',
          'Building a cleaning and sanitising schedule that fits real kitchen operational patterns',
          'Pest control integration — how kitchen hygiene connects to pest management',
          'Verification procedures — ATP testing and other tools for proving compliance',
        ],
        whoItIsFor: 'Kitchen managers and operations professionals.',
        prerequisites: 'Hygiene IN',
      },
      THERE: {
        duration: '72 min', modules: 6,
        summary: 'Design and manage the hygiene and sanitation system — cleaning schedules, chemical protocols, verification, audit preparation, and team training.',
        whatYouWillLearn: [
          'Designing a complete kitchen cleaning and sanitation program',
          'Health inspection preparation — what inspectors assess for hygiene',
          'Building a hygiene training program that produces behaviour change',
          'Hygiene management across multiple sites or departments',
        ],
        whoItIsFor: 'Operations directors, executive chefs, and hygiene leads.',
        prerequisites: 'Hygiene DEEP + verified operator endorsement',
      },
    },
  },
  // ── MANAGEMENT ──
  {
    number: '19', title: 'BOH Management in the New Age', tag: 'MANAGEMENT', totalTime: '12–15 hours',
    tiers: {
      IN: {
        duration: '~4 hours', modules: 4,
        summary: 'Most kitchen managers were never taught to manage. They were taught to cook — and then given a team. This course is for the cook who just became a chef.',
        whatYouWillLearn: [
          'Why the promotion changed the job — not just the title — and what the new job actually requires',
          'The five domains of kitchen management work and where most new managers go wrong',
          'The 30-60-90 day framework for a new BOH manager entering any kitchen environment',
          'How to identify your real motivation for managing — the one that will still be there on the hardest shift',
        ],
        whoItIsFor: 'Cooks and kitchen professionals stepping into their first management role.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '~6 hours', modules: 6,
        summary: 'For the manager who has been doing it for a year or two and is hitting walls. The skills nobody taught you.',
        whatYouWillLearn: [
          'Why kitchen people behave the way they do — and how to diagnose the real reason before acting',
          'The complete briefing framework for kitchen tasks — what done looks like, by when, and who else needs to know',
          'How to give feedback in a professional kitchen that builds capability rather than just correcting errors',
          'Managing across generations — Boomers, Gen X, Millennials, and Gen Z on the same line',
        ],
        whoItIsFor: 'BOH managers with 1–3 years of experience managing teams.',
        prerequisites: 'BOH Management IN or verified equivalent experience',
      },
      THERE: {
        duration: '~4 hours', modules: 4,
        summary: 'For the experienced kitchen manager who built their career in a different era and needs to adapt — not start over.',
        whatYouWillLearn: [
          'Which parts of the brigade system still serve your kitchen and which parts are quietly costing you your best people',
          'How to adapt your feedback and communication style for a workforce that no longer responds to fear',
          'Building a kitchen that functions to your standard when you are not in it',
          'The management character questions that experienced managers rarely ask themselves — and should',
        ],
        whoItIsFor: 'Experienced BOH managers and executive chefs with 5+ years of kitchen management experience.',
        prerequisites: 'BOH Management DEEP + verified operator endorsement',
      },
    },
  },
  {
    number: '20', title: 'FOH Management in the New Age', tag: 'MANAGEMENT', totalTime: '12–15 hours',
    tiers: {
      IN: {
        duration: '~4 hours', modules: 4,
        summary: 'The best server becomes the floor manager. The skills that produced individual excellence do not automatically produce collective excellence.',
        whatYouWillLearn: [
          'The FOH management job — what it actually contains and where most new managers spend their time wrong',
          'The guest-facing management challenge — how to hold your team accountable without undermining them in front of guests',
          'The first 90 days in an FOH management role — what to listen for before you lead',
          'Why your motivation for managing matters more in FOH than anywhere else in hospitality',
        ],
        whoItIsFor: 'FOH professionals stepping into their first management role.',
        prerequisites: 'None',
      },
      DEEP: {
        duration: '~6 hours', modules: 6,
        summary: 'For the FOH manager who has been doing it for a year or two and is facing the real challenges — a young, transient team, technology-heavy operations, and the generational mix that defines the modern FOH workforce.',
        whatYouWillLearn: [
          'Managing guest complaints through your team — not for them — and why the difference matters',
          'Feedback in a guest-facing environment — how to hold standards without creating a culture of fear',
          'Managing across generations in FOH — the specific dynamics of a younger, more diverse service team',
          'POS and service technology as a management tool — using the data your systems generate',
        ],
        whoItIsFor: 'FOH managers with 1–3 years of experience.',
        prerequisites: 'FOH Management IN or verified equivalent experience',
      },
      THERE: {
        duration: '~4 hours', modules: 4,
        summary: 'For the experienced FOH manager who has built real service culture and now needs to examine which parts of how they manage still work.',
        whatYouWillLearn: [
          'Service culture design — what it actually means to build a FOH culture and how you do it deliberately',
          'Managing technology adoption in a service team without breaking what is working',
          'Building a FOH operation that maintains your standard when you are not on the floor',
          'The FOH leadership character questions — who you are choosing to become as a manager and why it matters',
        ],
        whoItIsFor: 'Experienced FOH managers with 5+ years of team management experience.',
        prerequisites: 'FOH Management DEEP + verified operator endorsement',
      },
    },
  },
];

// Tag styling config per spec
export const tagPillStyles: Record<TagName, { bg: string; text: string }> = {
  THERMAL:    { bg: 'rgba(211,243,0,0.15)', text: 'hsl(73,100%,48%)' },
  COLD:       { bg: 'rgba(109,122,121,0.3)', text: '#ffffff' },
  BEVERAGE:   { bg: 'rgba(211,243,0,0.15)', text: 'hsl(73,100%,48%)' },
  DIGITAL:    { bg: 'rgba(211,243,0,0.15)', text: 'hsl(73,100%,48%)' },
  COMPLIANCE: { bg: 'rgba(237,67,25,0.2)',   text: 'hsl(11,85%,51%)' },
  MANAGEMENT: { bg: 'rgba(211,243,0,0.15)', text: 'hsl(73,100%,48%)' },
};
