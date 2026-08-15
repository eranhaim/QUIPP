# QUIPP — LOVABLE BUILD PROMPT
## Version 2.1 · March 12, 2026 · Joonius Inc.

> **Changes from v2.0:** Credit system added. Technology tag taxonomy added. Title unlock system added. Workplace Link added. Patch colours locked. DEEP submission flow added. Thinkific/Teachable replaces custom course player for MVP. Pricing model added. Three customer types added. Manufacturer Portal added.

---

## WHAT YOU ARE BUILDING

QUIPP is the professional identity platform for hospitality workers.

**The one-sentence definition:**
> QUIPP is a professional identity platform where hospitality workers earn verified credentials for the technology they know how to use — owned by them permanently, regardless of where they work.

**The analogy:**
> QUIPP is GitHub for hospitality workers. GitHub didn't replace programmers — it made the great ones impossible to ignore.

**Three-word mission:** EARNED. REAL. YOURS.

**The Passport is the wedge.** It leads in every demo, every pitch, every first conversation.

---

## BRAND IDENTITY — LOCKED

### Color Tokens (use these — never hardcode hex)
```css
--color-navy:   #1d123c;   /* Page background. Nav. Footer. The world. */
--color-purple: #36186b;   /* Card background. The object on the world. */
--color-lime:   #d1f300;   /* CTAs. Signals. Tier pills. URLs. */
--color-white:  #ffffff;   /* All text on dark. Section headers. */
```

**The rule:** Navy is the world. Purple is the object. Lime is the signal.

### Collection Architecture — Mandatory from Day One
- Color tokens only — never hardcoded hex values in any component
- Every component accepts a `theme` prop
- Base theme: Navy/Lime/Purple — the default
- Collection themes applied on top, never replacing the base

### Logo
- Icon: Stylized Q — rounded square with speech bubble tail and dot
- Wordmark: lowercase `quipp`

### Typography
- Display: Space Grotesk — maximum weight for headlines
- Body: Inter — regular weight
- Headlines: 2–4 words. Verb + Payoff. All caps for hero moments.
- Never: two lines of secondary copy

### Tagline Placements
| Surface | Copy |
|---|---|
| Magazine masthead, Onboarding screen 1 | GET QUIPP'D / Your skills. Your story. Your future. / The wave is coming. Ride it. |
| Passport — below score | Your skills. Your story. Your future. |
| Social sharing cards | GET QUIPP'D |
| End of Magazine articles | The wave is coming. Ride it. |

---

## VOICE & COPY — LOCKED

### Seven Voice Rules (apply to all UI copy)
1. Short is always smarter. One breath. Cut it in half.
2. Active stance. Clear subject. Clear action.
3. No corporate softening. No hedging.
4. Earn the emotion. No exclamation marks unless it was genuinely hard.
5. Always a next step. Every screen has a direction.
6. Human before direct. Person first. Information second.
7. Three to Five always. Never one option. Never two.

### CTA Vocabulary
Never: Sign up · Receive · Submit · Register · Available to you
Always: Start · Earn · Go · Join · Yours

### Never Use in Any Copy
`Consultant` `Solutions` `Revolutionary` `Amazing` `Empower` `Synergy` `Best` `Leading` `We recommend` `Talk to your team`

---

## THE THREE CUSTOMER TYPES

### Worker — Primary User
Cooks, chefs, servers, baristas, bartenders, managers. Builds the Passport. Earns credentials. Controls everything.

**Free tier (permanent):** Basic Passport + one IN credential of their choice + QUIPPY Equipment Consultant only.

**Paid:**
- $15 — Single course
- $50 — 5-course pack
- $99 — Full certification track (IN + DEEP + THERE for one category)
- $9.99/month or $89/year — QUIPPY Premium (all 5 modes)

### Operator — B2B Buyer
Restaurant owners, GMs, HR managers. Assigns training. Tracks team. Pays for library packs.

**Library pack pricing:**

| Pack | Seats | Price (CAD) |
|---|---|---|
| Small Dept | 10 | $150 |
| Medium Dept | 25 | $300 |
| Large Dept | 50 | $500 |
| XL Dept | 100 | $800 |
| Full Location Small | Up to 30 staff | $600 |
| Full Location Medium | Up to 75 staff | $1,200 |
| Full Location Large | Up to 150 staff | $2,000 |
| Annual Renewal | Same seats | 40% of original |

### Manufacturer — Strategic Partner
Equipment manufacturers. Co-brands credentials. Accesses worker analytics. Pays annual partnership tier.

| Tier | Annual (CAD) | Includes |
|---|---|---|
| Entry | $12,000 | 1 course, basic analytics |
| Standard | $24,000 | 3 courses, full analytics |
| Premium | $48,000 | Up to 10 courses, real-time analytics, CRM export |
| Credit Pack | $8–$15/credit | 1 credit = 1 worker course access |

---

## THE CREDENTIAL SYSTEM

### Three Tiers — IN / DEEP / THERE (Locked — never use Novice/Intermediate/Expert)

| Tier | How Earned | Patch Colour |
|---|---|---|
| **IN** | Complete course + pass 80% assessment | White patch — lightest |
| **DEEP** | Earn IN + supervisor written confirmation of real-world application | Purple patch — medium |
| **THERE** | Earn DEEP + verified endorsement from operator or manufacturer | Lime patch — heaviest. Most significant moment on the Passport. |

**DEEP submission:** Text field. Supervisor writes confirmation. QUIPP team reviews within 5 business days. Approved → DEEP credential issued. Rejected → worker notified with reason.

**Credentials are permanent.** A worker who unlinks from an employer keeps every credential. Always. The employer cannot revoke, hide, or modify any credential.

### Five Technology Category Tags
Every course carries one primary tag. Workers accumulate tags like a skill tree.

| Tag | Covers |
|---|---|
| THERMAL | Ovens, grills, fryers, smokers, combi steamers |
| COLD | Refrigeration, blast chillers, freezers, cold storage |
| BEVERAGE | Espresso machines, bar equipment, cocktail systems |
| DIGITAL | POS systems, ordering platforms, inventory, kitchen display |
| SERVICE | FOH technology, hosting, delivery integration |

### Tech Proficiency Score (0–100)
**Visible to everyone** on the public Passport — workers, operators, manufacturers, anyone with the link.

| Factor | Points |
|---|---|
| Credential Breadth | 30 |
| Credential Depth (IN=1, DEEP=2, THERE=3) | 30 |
| Recency Weighting | 20 |
| Endorsement Quality | 20 |

| Range | Label |
|---|---|
| 0–24 | BUILDING |
| 25–49 | ESTABLISHED |
| 50–74 | RECOGNISED |
| 75–100 | AUTHORITY |

### Title Unlock System
Titles appear in the Passport header. Earned by accumulating specific credential combinations.

| Title | Requirements | What It Unlocks |
|---|---|---|
| CHAMPION ChefTech | 5+ THERE credentials · 3+ different tags · 1+ manufacturer endorsement · 90%+ completion rate | Priority operator visibility · Manufacturer beta invites · Magazine feature · Insiders eligible |
| THERMAL SPECIALIST | 3+ THERMAL credentials · 1+ DEEP or THERE | Manufacturer brand advocate visibility · Demo event eligibility |
| DIGITAL OPERATOR | 3+ DIGITAL · POS + 1 other · Employer daily use confirmed | Operator tech-manager visibility · QUIPPY Business Architect unlocked |
| FOH LEAD | 4+ SERVICE · 1+ LEADERSHIP · Peer endorsement from 2+ verified | Priority floor manager listings · Mentorship matching |

---

## THE HIERARCHY & CREDIT SYSTEM

### Three-Level Hierarchy
```
MANUFACTURER
    ↓ sends credits
OPERATOR
    ↓ assigns credits
WORKER
    → earns credentials on Passport
```

### Three Credit Paths

**Path A — Manufacturer → Operator → Worker**
Manufacturer buys credit pack → assigns to specific operator → operator assigns to staff → worker completes course → co-branded credential on Passport.

**Path B — Manufacturer → Self-Declared Worker (Direct)**
Worker declares equipment they use daily → QUIPP notifies manufacturer → manufacturer buys credits → sends free certification to all workers who declared their equipment.

**Path C — Operator Direct Purchase**
No manufacturer. Operator buys Library Pack → assigns to department → workers complete QUIPP-branded courses → credentials on Passport.

---

## THE WORKPLACE LINK

Formal mechanism connecting workers to operators.

**Flow:**
1. Worker searches for current employer by name or city
2. Worker sends link request
3. Operator receives notification and confirms or declines
4. Confirmed → worker appears on team roster and can receive assigned courses

### Hard-Coded Privacy Rules

| Operator CAN See | Operator CANNOT See |
|---|---|
| Courses they assigned — completion status | Courses the worker paid for independently |
| Credentials earned through their library | Credentials earned at previous employers |
| Total credential count | QUIPPY conversation history (ever) |
| Last active date | Job-seeking status or toggle state |

**On unlink:** Operator loses all visibility immediately. Worker keeps every credential permanently. Previous workplace shows as alumni on Passport with employment dates.

---

## THE PASSPORT — SCREEN SPEC

### Screen 1 — My Passport (Home)
| Element | Specification |
|---|---|
| Header | Avatar · Full name · @username · Title if earned (lime text on navy) |
| Tech Proficiency Score | Large number · `/100` always visible · Status label below (BUILDING/ESTABLISHED/RECOGNISED/AUTHORITY) |
| Status Toggle | OPEN · EMPLOYED · PRIVATE — worker-controlled. Operator never sees which state. |
| Credential Patch Grid | 3-column grid · Rounded square patches · White (IN) / Purple (DEEP) / Lime (THERE) · Empty slots: dashed with 'Earn your next credential' |
| Tech Stack Pills | Declared equipment as scrollable pill row |
| Workplace Link | Current employer · Alumni employers with dates |
| Permanently Yours | Named section (not footer): "Permanently Yours." headline · URL in lime · QR code · Copy Link |
| Share Button | Primary CTA · Lime bg · Navy text · Always visible |

### Screen 2 — Credential Detail (Single Patch Expanded)
| Element | Specification |
|---|---|
| Patch Visual | Large rounded square · Tier colour fill · Technology icon centred · quipp mark bottom left · Manufacturer logo bottom right if co-branded |
| Credential Name | Full course name · Bold · Large |
| Tier Badge | IN / DEEP / THERE with description |
| Technology Tag | Category pill (THERMAL/COLD/BEVERAGE/DIGITAL/SERVICE) |
| Date Earned | Never expires from Passport |
| Credential Status | Active / Update Available |
| Share This Credential | Secondary CTA |

### Screen 3 — Earn (Course Discovery)
| Element | Specification |
|---|---|
| QUIPPY Recommended | Based on declared tech stack and current credentials |
| Assigned by Employer | Highlighted separately. Clear who assigned. |
| Free from Manufacturers | Lime accent. "Free from [Brand]." |
| Browse by Category | THERMAL / COLD / BEVERAGE / DIGITAL / SERVICE as filter tabs |
| Course Card | Name · Tag · Duration · Tier it leads to · Price or Free · Manufacturer logo if co-branded |

### Screen 4 — Course Player (MVP: Thinkific/Teachable Embed)
- Embed Thinkific or Teachable — do not build custom
- Credential issuance on completion: course completion triggers patch appearing on Passport
- The patch animation is the magic moment — patch lands on Passport with motion
- Completion screen: patch animation + celebration + immediate share prompt
- DEEP prompt after IN completion: "Prove it in real life. Get your supervisor to confirm."

### Screen 5 — Share (Passport Export)
| Format | Use |
|---|---|
| 1:1 square | Instagram post |
| 1.91:1 landscape | LinkedIn post |
| 9:16 vertical | Stories |
| QR card | Links to public Passport URL |

Public Passport URL: `quipp.co/p/[username]` — permanent, always current.

---

## THE OPERATOR DASHBOARD — SCREEN SPEC

### Home Screen
- Top left: Company logo · Location name · Location code
- Hero: Three numbers — Fully Certified (green) · In Progress (amber) · Not Started (red) · Total staff count
- Quick actions: Assign Course · Add Staff Member · Download Report
- Alerts: Credentials due for renewal · Staff inactive 30+ days · Credit balance low

### Screen 1 — Team Overview
Traffic light summary. Recent completions feed. Outstanding assignments (7+ days unstarted) with Send Reminder per row. Credit balance if manufacturer credits received.

### Screen 2 — Library Manager
Library packs owned as cards (seats assigned/total). Assign flow: Select library → Select department or worker → Confirm. Three taps max. Manufacturer credits in separate section. Inline upsell to add more seats.

### Screen 3 — Team Roster
Worker row: Photo · Name · Role · Credentials earned · Last active · Completion rate · View Passport link. Filter by department/status/tier. Champion workers highlighted with lime accent.

### Screen 4 — Compliance Export
One-click PDF. Location name, date range, all staff credentials, QUIPP verification seal. Looks like an official document. For insurance, HR, inspections.

---

## THE MANUFACTURER PORTAL — SCREEN SPEC (Phase 1.5 — fake manually at MVP)

### Home Screen
- Brand logo · Company name · Partnership tier badge
- Four numbers: Total enrolled · Completion rate · Active certifications · Month-over-month growth
- Quick actions: Create Course · Send Credits · Download Report

### Screen 1 — Program Dashboard
Enrollment metrics · Completion rates · Share rate (% who shared Passport after earning credential — brand reach metric) · Month-over-month trend.

### Screen 2 — Course Manager
Course cards with enrollment/completion stats. Create new course flow. QUIPP review process (5 business days). Co-brand settings.

### Screen 3 — Credential Analytics
Worker intelligence: who earned the credential, role, employer, city. Equipment declaration map. Employer connections for sales leads. Export (anonymised default, worker consent for identified).

### Screen 4 — Credit Manager
Credit balance. Purchase credits. Send Path A (to operator) or Path B (to self-declared workers). Real-time tracking: delivered/started/completed.

---

## QUIPPY

### System Prompt Architecture
- **Layer 1 — Core Identity:** Seven Voice Rules, vocabulary system, brand personality, Founder Principle, IN/DEEP/THERE language, tag taxonomy. Every conversation.
- **Layer 2 — User Context:** Passport data, credentials, tech declarations, workplace link, Magazine activity. Per user.
- **Layer 3 — Role Activation:** Opening posture, pace, signature move, guardrails. On role switch.

### Five Fixed Roles (architecturally locked)
**Equipment Consultant:** Question before answer. Affiliate declaration before options. Closing: Research support → Peer connection → Human expert → Patient close. Never "talk to your team."

**Career Mentor:** Acknowledge journey before horizon. Founder reference. Story then question. Three to five options — never directive.

**Technical First Responder:** "Okay. Tell me exactly what it is doing." Max three diagnostic steps. Name the cost saved before the tech call.

**Business Architect:** Three questions first. No agenda visible. Living document delivered at end. Never prescribe before diagnosing.

**Confidant:** "What is going on?" Hold → Pivot → Options → Patience. Zero platform access. Four-phase distress flow always.

### Response Validation (build this — not optional)
```
1. Three-to-Five check → regenerate if single recommendation
2. Vocabulary scan → regenerate if never-use word found
3. Affiliate declaration → inject before delivery if affiliated
4. Tier language → regenerate if Novice/Expert detected
5. Tag language → regenerate if wrong tag name detected
```

### Proactive Engagement
Max 1 proactive message per 48 hours. 3 ignores → 14-day quiet. QUIPPY initiates — never guilts.

---

## THE DATA MODEL

### New Tables (v2.1 additions)

**TECHNOLOGY_TAGS**
`id · tag_name [THERMAL/COLD/BEVERAGE/DIGITAL/SERVICE] · description · active`

**WORKER_TECH_DECLARATIONS**
`id · user_id · equipment_name · brand · tag_id · declared_at · verified`

**CREDITS**
`id · purchaser_type [manufacturer/operator] · purchaser_id · course_id · quantity · used · balance · purchased_at · expires_at [12 months from purchase]`

**CREDIT_TRANSACTIONS**
`id · credit_id · action [purchased/assigned_to_operator/assigned_to_worker/consumed] · from_id · to_id · quantity · timestamp`

**DEEP_SUBMISSIONS**
`id · credential_id · worker_id · supervisor_name · supervisor_role · supervisor_confirmation_text · submitted_at · review_status [pending/approved/rejected] · reviewed_by · reviewed_at · rejection_reason · deep_credential_issued_at`

**TITLE_UNLOCKS**
`id · user_id · title_name · earned_at · qualifying_credentials [array of credential IDs]`

**WORKPLACE_LINKS**
`id · worker_id · operator_id · requested_at · confirmed_at · confirmed_by · status [pending/active/unlinked] · unlinked_at · alumni · operator_visibility_ends_at`

### All Previous Tables (unchanged from v1.2)
USERS · PASSPORTS · CREDENTIALS · COURSES · COURSE_LEVELS · QUIZZES · ENDORSEMENTS · CONVERSATIONS · PAYMENTS · COURSE_ACCESS · CORPORATE_PURCHASES · SEAT_ASSIGNMENTS · LIBRARIES · LIBRARY_COURSES · LIBRARY_ASSIGNMENTS · MANUFACTURERS · PAIN_RECORDS · MATCH_ATTEMPTS · CONNECTION_TRACKING · PROACTIVE_TRIGGERS · PROACTIVE_SUPPRESSION · LIVING_BOOK_ENTRIES · QUIPPY_KNOWLEDGE_BASE

---

## MVP SCOPE — BUILD NOW

### Critical (ship with these or don't ship)
- Worker Passport — Home, Credential Detail, Earn, Share screens
- Course delivery — Thinkific or Teachable embedded. Credential issued on completion.
- Workplace Link — basic version with hard-coded privacy rules
- Technology declaration on worker profile
- Operator Dashboard — 4 screens (Overview, Library, Roster, Compliance Export)
- Public Passport URL — quipp.co/p/[username]
- Share export — 3 formats
- 5 launch courses across THERMAL/BEVERAGE/DIGITAL/SERVICE

### High (MVP but not day-one blockers)
- DEEP submission flow — text field + manual review queue
- Admin backend for manual credit assignment (Idan assigns manually, no portal)
- Basic QUIPPY (Equipment Consultant mode only at free tier)

### Fake manually until post-seed
- Manufacturer Portal → email + spreadsheet
- Title unlock automation → manual review by team
- Tag taxonomy engine → Idan tags each course manually
- Full QUIPPY intelligence → basic chatbot first
- Manufacturer analytics → monthly PDF compiled manually

---

## WHAT IS LOCKED — NEVER REOPEN

```
GET QUIPP'D — tagline. Permanent.
IN · DEEP · THERE — tier names. Permanent.
White / Purple / Lime — patch colours per tier. Permanent.
The Passport — product name and core concept. Permanent.
QUIPPY — AI name and five fixed roles. Permanent.
Fashion brand philosophy — permanent identity, rotating collections. Permanent.
Passport as the wedge — lead product everywhere. Permanent.
Idan Os is the CEO — not seeking a CEO. Permanent.
CTO + CMO — the two co-founder roles being filled. Permanent.
Lime #d1f300 / Navy #1d123c / Purple #36186b — the palette. Permanent.
Q icon + lowercase quipp — the logo. Permanent.
KOHO.ca — visual and voice reference. Permanent until further notice.
Claude API — QUIPPY's brain. Permanent.
Stripe — payment processor. Permanent.
Pain-based matching — community philosophy. Permanent.
Credentials are permanent — employer cannot revoke. Permanent.
DEEP proof = supervisor written confirmation only. Locked March 12, 2026.
Tech Proficiency Score = public on Passport. Locked March 12, 2026.
Thinkific/Teachable for MVP course player. Locked March 12, 2026.
```

---

## WHAT QUIPP IS NOT

- **Not a training app.** Training is a byproduct of professional identity.
- **Not a job board.** The Passport enables opportunity — QUIPP doesn't broker it.
- **Not a social network.** The community is a structured connection layer — not a feed.
- **Not a chatbot.** QUIPPY is a relationship with a memory.
- **Not a generic platform.** Every decision is specific to hospitality. If it could belong to any industry — it doesn't belong here.

---

**quipp · Joonius Inc. · Canada · quipp.co**
*Confidential · March 2026 · Lovable Build Prompt v2.1*
