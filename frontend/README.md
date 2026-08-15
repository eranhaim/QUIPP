# Alma Passport

BUILD A PROFESSIONAL CREDENTIAL PLATFORM FOR HOSPITALITY WORKERS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OVERVIEW:

Create a modern web application called ALMA - a professional identity and credentialing platform for hospitality workers. Think LinkedIn meets Apple Store design meets digital credentials.

Workers earn verified credentials by completing equipment training, build a professional Passport showcasing their skills, and share it with employers.

Core features:

- Magazine-style homepage (industry news and updates)

- Training courses with completion tracking

- Digital credential system (like certificates)

- Professional Passport page (main profile/identity)

- Public verification system

- Endorsements (LinkedIn-style)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 1: GLOBAL DESIGN SYSTEM

DESIGN PHILOSOPHY:

Apple Store minimalism. Clean, focused, mobile-first.

Every element must earn its place on screen.

When in doubt — remove it.

COLORS:

- Background: Clean Chalk #F5F2EC (entire site background)

- Cards: Pure White #FFFFFF with shadow: 0 2px 12px rgba(0,0,0,0.06)

- Primary Text: Deep Slate #1C2B3A

- Secondary Text: Medium Grey #8A8A8A

- Accent: Ember Orange #E8612C (buttons, highlights only)

- Success: Verified Green #2ECC8F (checkmarks, completed states)

TYPOGRAPHY (Inter font family):

- Hero: 48-64px bold (36px on mobile)

- Section Titles: 28-32px bold

- Card Titles: 18-20px semibold

- Body Text: 15-16px regular

- Labels: 11-12px uppercase with letter-spacing

- Subtitles: 16-18px italic

SPACING:

- Card padding: 24px minimum

- Section spacing: 64px minimum between sections

- Mobile padding: 20px on sides

- Max content width: 680px (centered)

- Max wide content width: 1200px (for grids)

LAYOUT RULES:

- NO sidebars anywhere

- Full width layout

- Maximum 3 items per row on desktop

- 1 column on mobile

- Everything centered with max-width

BUTTONS:

- Primary: Pill shape (rounded-full), Ember Orange bg, white text

- Secondary: Pill shape, white bg, Deep Slate border

- Ghost: No background, Ember Orange text

CARDS:

- White background

- Rounded corners: 24px (rounded-2xl in Tailwind)

- Shadow: subtle (shadow-sm)

- 24px padding

ANIMATIONS:

- Fade in only (opacity 0 to 1, 300ms)

- No complex animations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 2: PAGE STRUCTURE

Build these 8 pages:

1. Homepage (Magazine)

2. Course Catalog

3. Course Detail

4. Course Player

5. Passport (main profile page) ⭐ MOST IMPORTANT

6. Credential Display

7. Verification Page (public)

8. Login/Signup

Navigation Bar (all pages):

- Logo left: "ALMA" text, Deep Slate

- Center: News | Training | My Passport (only when logged in)

- Right: Search icon | Login button (or user avatar if logged in)

- Mobile: Hamburger menu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAGE 1: HOMEPAGE (Magazine Style)

URL: /

Background: Clean Chalk #F5F2EC

HEADER:

- Navigation bar (as specified above)

HERO SECTION (Featured Story):

Full width white card, max-width 1200px, centered

Large padding (80px top on desktop, 40px mobile)

Layout:

- Large image (600px height, rounded-xl)

- Label: "🔥 FEATURED TODAY" (12px, Ember Orange, uppercase)

- Headline: Large bold (32px), Deep Slate

- Excerpt: 2-3 lines (16px, grey)

- Two buttons side by side:

  * "Read Full Story →" (primary)

  * "Learn Combi Basics →" (secondary)

Example content:

Headline: "Rational Launches New iCombi Pro With AI Cooking Intelligence"

Excerpt: "The world's most popular combi oven just got smarter. Here's what operators need to know."

TODAY'S UPDATES (3-column grid):

3 cards in a row (1 on mobile)

Each card: white, rounded-2xl, shadow, 24px padding

Card structure:

- Category label (12px uppercase, Ember Orange)

  Examples: "🆕 EQUIPMENT", "💡 TECH TREND", "📱 NEW APP"

- Image (200px height, rounded-xl)

- Headline (18px semibold)

- Brief excerpt (14px, grey, 2 lines)

- "Read More →" link (Ember Orange)

EQUIPMENT SPOTLIGHT:

Full width white card, centered

Layout:

- Small label: "EQUIPMENT OF THE WEEK" (12px uppercase, grey)

- Large image (400px height, rounded-xl)

- Headline (32px bold)

- Description (16px, 3-4 lines)

- Two buttons:

  * "Read Equipment Guide →"

  * "Take Training Course →"

LATEST ARTICLES (2-column grid):

Left column: Article cards

Right column: Mix of Quick Tips, New Courses, Worker Stories

Each article card:

- Label (reading time or category)

- Headline (18px semibold)

- Excerpt (14px grey)

- "Continue Reading →" link

NEWSLETTER SIGNUP:

White card, centered, max-width 600px

- Icon: 📬

- Headline: "Daily Hospitality Tech Brief"

- Description: "Get top 3 stories every morning"

- Email input + Subscribe button (Ember Orange)

FOOTER:

Simple, centered

Links: About | Training | Verify Credential | Contact

© 2026 Joonius Inc.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAGE 2: COURSE CATALOG

URL: /courses

Background: Clean Chalk

HEADER:

- Page title: "Available Training" (48px bold, centered)

- Subtitle: "Master equipment. Earn credentials." (16px grey, centered)

FILTER TABS:

Row of filter buttons (pill shaped, secondary style)

- All | Cooking | Coffee | Bar | Warewashing

- Active tab: Ember Orange background

COURSE GRID:

3 columns desktop, 2 columns tablet, 1 column mobile

Max-width: 1200px, centered

Gap: 32px

Each course card (white, rounded-2xl, shadow):

- Course image (220px height, rounded-xl, object-cover)

- Category badge (top-right absolute position on image)

  Pill shape: "COOKING" / "COFFEE" / "BAR"

- Course title (18px semibold)

- Level badge pill:

  * "OPERATOR" (Ember Orange bg, white text)

  * "SPECIALIST" (Deep Slate bg, white text)

  * "ENGINEER" (Verified Green bg, white text)

- Duration: "8 modules • 45 minutes" (12px grey)

- Brief description (14px grey, 2 lines)

- "Start Course →" button (Ember Orange pill, full width)

For "Coming Soon" courses:

- Greyed out

- "Coming Soon" badge instead of level

- "Notify Me" button (secondary style)

Empty state (if no courses):

- Simple illustration

- "Courses coming soon"

- "Subscribe to get notified"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAGE 3: COURSE DETAIL

URL: /courses/[slug]

Example: /courses/combi-oven-fundamentals

Background: Clean Chalk

HERO SECTION:

Centered, max-width 800px

- Small breadcrumb: "Courses > Combi Oven Fundamentals" (12px grey)

- Course title (48px bold)

- Level badge (large pill, 14px)

- Duration info: "8 modules • 45 minutes • Operator Level"

- Large hero image (600px height, rounded-xl)

- "Start Course" button (large Ember Orange pill, centered)

WHAT YOU'LL LEARN:

White card, 24px padding

- Section title: "What You'll Learn" (24px bold)

- Bullet list (16px, with checkmark icons in Verified Green):

  * Master three cooking modes

  * Operate controls correctly

  * Clean and maintain properly

  * Prevent common service calls

  * Recognize warning signs

CURRICULUM:

White card, 24px padding

- Section title: "Course Curriculum" (24px bold)

- Module list (expandable/collapsible)

Each module row:

- Module number (grey circle with number)

- Module title (16px semibold)

- Duration (12px grey)

- Lock icon if not accessible yet

- Expand arrow

Example:

[1] Introduction to Combi Technology (5 min) [▼]

    What is a combi oven and why operators choose it

[2] Understanding Modes (6 min) [▶]

Final item:

[✓] Final Quiz: Mastery Check (10 questions, 70% to pass)

WHAT YOU'LL EARN:

White card, 24px padding

- Section title: "What You'll Earn" (24px bold)

- Preview of credential card (visual mockup)

- Description of credential

- List with checkmarks:

  * Verified digital credential

  * QR code for instant verification

  * Shareable on social media

  * Permanent and portable

CTA:

Large "Start Course" button (Ember Orange pill, centered)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAGE 4: COURSE PLAYER

URL: /learn/[course-slug]/[module-slug]

Example: /learn/combi-oven-fundamentals/module-1

MINIMAL, DISTRACTION-FREE LAYOUT

STICKY HEADER:

- "← Back to My Passport" link (left)

- Progress: "Module 1 of 8" (center)

- Course completion: "12%" progress bar (right)

LAYOUT:

LEFT SIDEBAR (250px width, fixed):

White card, rounded-2xl

- Course title (16px semibold)

- Module list:

  Each module:

  * ✓ checkmark if completed (Verified Green)

  * Number + title (14px)

  * Active module: Ember Orange background

  * Locked modules: grey with lock icon

- Bottom: "📝 Final Quiz" (special styling)

MAIN CONTENT (remaining width):

White card, rounded-2xl, 24px padding

- Module title (32px bold)

- Content (text or video placeholder)

- Reading time estimate

- Key takeaways box (light background):

  * "KEY TAKEAWAYS" label

  * Bullet list of main points

- Bottom: "Mark Complete & Continue →" button (Ember Orange pill, full width)

MOBILE LAYOUT:

- Sidebar collapses to top dropdown

- Swipe between modules

- Bottom sticky: Progress bar + Continue button

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAGE 5: THE PASSPORT ⭐ MOST IMPORTANT PAGE

URL: /passport/[username]

Example: /passport/alex-riviere

This is the professional identity page. The core of the platform.

Background: Clean Chalk

━━━━━━━━━━━━━━━━

SECTION 1: IDENTITY HERO

Full width, max-width 680px centered

Padding top: 80px desktop, 40px mobile

ALL CENTERED:

1. INITIALS AVATAR

- 80px circle

- Deep Slate background (#1C2B3A)

- White initials (first + last, 32px bold)

- Example: "AR" for Alex Riviere

2. FULL NAME

- 48px bold on desktop (36px mobile)

- Deep Slate color

- LARGEST TEXT ON THE PAGE

- Example: "ALEX RIVIERE"

3. PROFESSIONAL TITLE (auto-generated from credentials)

- 18px italic, grey (#8A8A8A)

- Examples:

  * 0 credentials: "Hospitality Professional · Getting Started"

  * 1-2 credentials: "Combi Technician · Operator Certified"

  * 3-4 credentials: "Equipment Specialist · 3 Credentials Earned"

  * 5+ credentials: "Certified Equipment Technician · 5 Credentials"

4. LOCATION (optional, user-added)

- 14px grey

- Format: "Toronto, Canada"

5. CONTACT LINKS (optional, subtle)

- Small LinkedIn and Email icons

- Grey color, clickable

- Only if user adds them

6. VISIBILITY TOGGLE

- Pill selector with 3 states:

  🟢 "Open for Opportunities" (green dot + text)

  🟡 "Employed" (yellow dot + text)

  ⚫ "Private" (grey dot + text)

- Small, subtle, centered

- Changes based on selection

7. ACTION BUTTONS

- "Share My Passport →" (Ember Orange pill)

- "Edit Profile" (secondary pill)

- Side by side on desktop, stacked on mobile

Thin grey divider line (1px) below this section

━━━━━━━━━━━━━━━━

SECTION 2: PROFESSIONAL JOURNEY

Max-width 680px centered

TITLE: "Journey" (28px bold, left-aligned)

SUBTITLE: "Professional experience" (14px grey)

OPTIONAL SECTION (can be empty)

CAROUSEL LAYOUT:

- Desktop: Show up to 3 cards, horizontal scroll if more

- Mobile: Show 1 card, swipeable carousel

- Gap: 24px between cards

Each Journey Card (white, rounded-2xl, shadow, 24px padding):

- Thin Ember Orange left border (4px width)

Card content:

- Company logo (48px circle, grey placeholder if none)

- Job title (16px semibold)

  Example: "Lead Line Cook"

- Company name (14px grey)

  Example: "Four Seasons Hotel Toronto"

- Location (14px grey)

  Example: "Toronto, Canada"

- Date range (12px grey)

  Example: "Jan 2022 – Present"

- Current job badge: "Current" pill (Verified Green, white text, small)

- Endorsement indicator: Small medal icon if endorsed

ADD EXPERIENCE BUTTON:

Below carousel

- Dashed border, grey text

- "+ Add Experience"

- Opens modal on click

EMPTY STATE:

"Add your work experience to build your professional story."

[+ Add Experience] button

━━━━━━━━━━━━━━━━

SECTION 3: CREDENTIALS ⭐ KEY SECTION

Max-width 680px centered

TITLE: "Credentials" (28px bold)

SUBTITLE: "Earned through verified training." (14px grey)

GRID LAYOUT:

- Desktop: 2 columns with gap

- Mobile: 1 column, full width

- Gap: 24px

Each Credential Card (white, rounded-2xl, shadow, 24px padding):

STRUCTURE (based on the image you provided):

TOP ROW:

- Left: Manufacturer/Provider logo

  Examples: Rational, UNOX, Henny Penny, ALMA Academy

  Size: 60px height max, proportional width

  If generic ALMA course: ALMA logo or equipment icon

  

- Right: Level badge (pill shaped)

  Three options:

  * "OPERATOR (Basic)" - Ember Orange background, white text

  * "SPECIALIST (Pro)" - Deep Slate background, white text

  * "ENGINEER (Savvy)" - Verified Green background, white text

  Small caps, 11px, bold

VISUAL SECTION:

- Equipment/course image

  Full width of card, 180px height

  Rounded corners (12px), object-fit: cover

  Examples: Combi oven photo, equipment diagram, controls, gauges

CONTENT:

- Course name (18px semibold, Deep Slate)

  Example: "The 1976 Kitchen Revolution"

- Course number (12px grey)

  Format: "Course #: CBT-101"

- Issue date (12px grey)

  Format: "Date: 15 Oct 2023"

BOTTOM ROW:

- Left: Endorsements

  Medal emoji 🏅 + number

  "Endorsements Link (4)" in grey, clickable

  

- Right: Verification

  "Verify →" in Ember Orange

  Right-aligned

CARD INTERACTION:

Click/tap card to expand:

DESKTOP: Accordion expansion

- Card expands vertically inline

- Shows expanded content

- Other cards push down smoothly

- Click again to collapse

MOBILE: Modal overlay

- Full screen modal

- Close X button top-right

- Swipeable to next credential

EXPANDED CONTENT:

- Full course details

- Skills demonstrated (bullet list with checkmarks)

- Completion date

- Quiz score (if applicable)

- Large QR code (240px, for in-person verification)

- Verification URL

- Share buttons row:

  * "Share on LinkedIn"

  * "Share on Instagram"

  * "Download PNG"

  * "Copy Link"

EMPTY STATE (no credentials):

- Simple grey icon/illustration

- Text: "Your first credential is one course away."

- Button: "Browse Courses →" (Ember Orange pill)

━━━━━━━━━━━━━━━━

SECTION 4: ENDORSEMENTS

Max-width 680px centered

TITLE: "Endorsed By" (28px bold)

SUBTITLE: "Professionals who verified this work firsthand." (14px grey)

OPTIONAL SECTION (can be empty)

LIST LAYOUT (not grid):

Each endorsement row:

- Left: Initials avatar (40px circle, Deep Slate bg, white initials)

- Content (vertical stack):

  * Endorser name (15px semibold)

  * Endorser title/company (13px grey)

  * What they endorsed (13px Ember Orange)

    Example: "Endorsed: Combi Oven Fundamentals"

  * Date (12px grey)

- Thin bottom border between rows (1px, light grey)

EMPTY STATE:

"No endorsements yet. Share your Passport with a colleague or manager to request one."

[Request Endorsement] button (secondary style)

━━━━━━━━━━━━━━━━

SECTION 5: VERIFICATION FOOTER

Max-width 680px centered

Padding: 64px top

ALL CENTERED:

- Text: "This Passport is permanently verifiable." (14px grey)

- Verification URL (16px Ember Orange, monospace font):

  savvyskills.com/passport/alex-riviere

- QR code (120px, centered)

  Generates from passport URL

  High contrast for easy scanning

- Action buttons (side by side):

  * "Copy Link" (ghost style)

  * "Download QR Code" (secondary style)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PASSPORT: MOBILE OPTIMIZATIONS

All sections stack vertically.

CHANGES:

- Identity hero: 36px name (instead of 48px)

- Credentials: 1 column always

- Journey: Horizontal swipe carousel, 1 card visible

- Action buttons: Stack vertically

STICKY HEADER ON SCROLL:

When user scrolls down, show sticky header:

- Worker name (18px semibold)

- "Share" button (small Ember Orange pill)

- Disappears when scrolled to top

- 60px height, Clean Chalk background, subtle shadow

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAGE 6: CREDENTIAL DISPLAY

URL: /credentials/[credential-id]

Shows after completing a course

Background: Clean Chalk

Max-width: 680px, centered

CELEBRATION:

- Large checkmark animation (Verified Green)

- "Congratulations!" (48px bold)

- "You've earned a credential." (18px)

CREDENTIAL PREVIEW:

- Large credential card (same design as Passport)

- Prominent display

SHARE SECTION:

- "Share Your Achievement" (24px bold)

- Row of share buttons (large, pill shaped):

  * Share on LinkedIn (LinkedIn blue)

  * Share on Instagram (Instagram gradient)

  * Download PNG (secondary)

  * Copy Link (secondary)

WHAT THIS PROVES:

- List with green checkmarks:

  * Completed 8 training modules

  * Passed comprehensive quiz (70%+ score)

  * Verified professional credential

  * Recognized by hospitality employers

VERIFICATION:

- "Anyone can verify this at:"

- URL displayed (Ember Orange, clickable)

- QR code (120px)

NEXT STEPS:

- "View My Passport" button (Ember Orange pill, large)

- "Take Another Course" button (secondary)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAGE 7: VERIFICATION PAGE (Public)

URL: /verify/[credential-id]

PUBLIC PAGE (anyone can access)

Background: Clean Chalk

Max-width: 600px, centered

HEADER:

- ALMA logo

- "Credential Verification" (32px bold)

VERIFICATION STATUS:

- Large checkmark (Verified Green)

- "✓ VERIFIED CREDENTIAL" (24px bold, Verified Green)

CREDENTIAL INFO:

White card, 24px padding

Display:

- Worker name (20px semibold)

  Example: "Maria Gonzalez"

- Credential name (18px)

  Example: "Combi Oven Fundamentals"

- Level badge (Operator/Specialist/Engineer pill)

- Issue date (14px grey)

- Credential ID (12px grey, monospace)

TRAINING COMPLETED:

- Section title: "Training Completed"

- List with checkmarks:

  * 8 training modules completed

  * Final quiz passed (85% score)

  * Total training time: 47 minutes

SKILLS DEMONSTRATED:

- Section title: "Skills Demonstrated"

- Bullet list:

  * Understanding of combi oven technology

  * Proficiency in operating controls

  * Knowledge of cleaning and maintenance

  * Ability to troubleshoot common issues

  * Awareness of safety protocols

CREDENTIAL IMAGE:

- Show the credential card visual

FOOTER:

- "This credential is permanently verifiable at this URL"

- QR code (120px)

- CTA: "Want to earn credentials?"

  [Get Started] button (Ember Orange pill)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAGE 8: LOGIN / SIGNUP

URL: /login and /signup

Background: Clean Chalk

Max-width: 480px, centered

MINIMAL DESIGN

LOGO:

- ALMA logo, centered, large

SIGNUP PAGE:

- Title: "Create Your Account" (32px bold, centered)

- Subtitle: "Start learning in less than 30 seconds. All training is free."

SOCIAL LOGIN (preferred):

- "Continue with Google" button (full width, white, Google logo)

- "Continue with LinkedIn" button (full width, white, LinkedIn logo)

DIVIDER:

- "— OR —" (centered, grey)

FORM:

Fields (minimal):

- First Name

- Last Name

- Email

- Password

- Checkbox: "I agree to Terms of Service" (small, required)

Button:

- "Create Account →" (Ember Orange pill, full width)

FOOTER LINK:

- "Already have an account? [Log in]" (centered, small)

LOGIN PAGE:

Same design, but:

- Title: "Welcome Back"

- Fields: Email, Password only

- Button: "Log In →"

- Footer: "Don't have an account? [Sign up]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 3: DATA STRUCTURE

USER MODEL:

{

  id: string (unique)

  username: string (unique, required, lowercase)

  firstName: string

  lastName: string

  email: string (unique)

  password: string (hashed)

  location: string (optional, "City, Country")

  contactLinks: {

    linkedin: string (optional)

    email: string (optional)

  }

  visibilityStatus: enum ('open', 'employed', 'private')

  createdAt: timestamp

  updatedAt: timestamp

}

CREDENTIAL MODEL:

{

  id: string (unique)

  userId: string (foreign key)

  courseId: string (foreign key)

  courseName: string

  courseNumber: string

  level: enum ('operator', 'specialist', 'engineer')

  category: enum ('cooking', 'coffee', 'bar', 'warewashing')

  providerLogo: string (URL to logo)

  courseImage: string (URL to equipment image)

  issueDate: timestamp

  quizScore: number (optional)

  verificationId: string (unique, for public URLs)

  skillsDemonstrated: array of strings

}

WORK EXPERIENCE MODEL:

{

  id: string

  userId: string (foreign key)

  companyName: string

  position: string

  city: string

  country: string

  startDate: date (month + year)

  endDate: date (month + year, null if current)

  isCurrent: boolean

  description: string (optional, max 500 chars)

  companyLogo: string (optional, URL)

  isEndorsed: boolean

  endorsedBy: string (optional, userId of endorser)

}

ENDORSEMENT MODEL:

{

  id: string

  endorserId: string (userId who is giving endorsement)

  endorseeId: string (userId receiving endorsement)

  credentialId: string (optional, if endorsing credential)

  workExperienceId: string (optional, if endorsing work experience)

  endorsementDate: timestamp

  endorserName: string

  endorserTitle: string

  endorserCompany: string

}

COURSE MODEL:

{

  id: string

  slug: string (URL-friendly)

  title: string

  category: enum ('cooking', 'coffee', 'bar', 'warewashing')

  level: enum ('operator', 'specialist', 'engineer')

  duration: number (minutes)

  moduleCount: number

  description: string

  image: string (URL)

  modules: array of module objects

  status: enum ('published', 'coming_soon')

}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 4: KEY FEATURES TO IMPLEMENT

1. USERNAME SYSTEM:

- Username required on signup

- Check availability in real-time (like Instagram)

- Show green checkmark if available, red X if taken

- Can change once per 30 days

- Format: lowercase, alphanumeric, hyphens allowed, 3-30 chars

2. PRIVACY SETTINGS:

- Visibility toggle: Open / Employed / Private

- Rules:

  * Private: Only user, their employer, and credential companies can view

  * Employed: Accessible via direct link, not in search

  * Open: Public, appears in search (future feature)

- Always show verification URLs (separate from Passport)

3. SOCIAL SHARING:

- Generate shareable images for credentials

- One-click share to LinkedIn, Instagram

- Copy link functionality

- Download PNG option

4. QR CODE GENERATION:

- Generate QR codes for:

  * Passport URL

  * Individual credential verification URLs

- High contrast, easy to scan

- 120px default size

5. AUTO-GENERATED TITLES:

Logic:

- 0 credentials: "Hospitality Professional · Getting Started"

- 1-2 credentials: "[Equipment] Specialist · [Level] Certified"

- 3-4 credentials: "Equipment Specialist · [Number] Credentials Earned"

- 5+ credentials: "Certified Equipment Technician · [Number] Credentials"

6. ENDORSEMENT FLOW:

- User clicks "Request Endorsement"

- Enters employer/manager email

- Email sent with endorsement link

- Manager clicks link, confirms

- Endorsement appears on Passport

7. CREDENTIAL CARD EXPANSION:

- Desktop: Accordion (inline expansion)

- Mobile: Modal overlay

- Shows: Full details, QR code, share buttons

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 5: MOCK DATA

For MVP demo, include these sample entries:

SAMPLE USER:

- Username: alex-riviere

- Name: Alex Riviere

- Title: "Certified Combi Technician & Equipment Specialist"

- Location: "Toronto, Canada"

- Visibility: Open

SAMPLE CREDENTIALS (4):

1. The 1976 Kitchen Revolution (Rational, Operator, Oct 2023)

2. Maillard Reaction & Humidity (UNOX, Operator, Nov 2023)

3. Advanced Airflow Dynamics (Rational, Specialist, Jan 2024)

4. Water Quality & Limescale (Henny Penny, Specialist, Feb 2024)

SAMPLE WORK EXPERIENCE (2):

1. Lead Line Cook, Four Seasons Hotel Toronto, Jan 2022 - Present

2. Commis Cook, Canoe Restaurant, Jan 2020 - Dec 2021

SAMPLE ENDORSEMENTS (3):

1. Executive Chef endorsed "Combi Oven Fundamentals"

2. Kitchen Manager endorsed "Work at Four Seasons"

3. Equipment Trainer endorsed "Advanced Airflow Dynamics"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART 6: TECHNICAL REQUIREMENTS

FRAMEWORK:

- React (or Next.js if you prefer)

- Tailwind CSS for styling

- React Router for navigation

COMPONENTS TO BUILD:

- Button (primary, secondary, ghost variants)

- Card (white, shadow, rounded-2xl)

- Badge (pill-shaped, colored backgrounds)

- Modal (for credential expansion, forms)

- Carousel (for Journey cards)

- Avatar (initials circle)

- QR Code Generator

- Share Buttons

STATE MANAGEMENT:

- User authentication state

- Current user data

- Course progress

- Credentials list

- Privacy settings

RESPONSIVE:

- Mobile-first design

- Breakpoints: 640px (mobile), 1024px (desktop)

- All layouts adapt smoothly

ACCESSIBILITY:

- Semantic HTML

- ARIA labels where needed

- Keyboard navigation

- Focus states

- Alt text for images

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FINAL NOTES:

THE ONE RULE:

If adding something makes the page busier — don't add it.

If removing something makes the page clearer — remove it.

This platform is used by people on phones after a 6-hour shift.

Design for that person. Every time.

Focus on:

✓ Clean, minimal design

✓ Mobile-first

✓ Fast loading

✓ Clear hierarchy

✓ Obvious actions

✓ Beautiful credentials

The Passport page is the MOST important.

That's where the magic happens.

That's what gets shared.

That's what employers see.

Make it beautiful. Make it professional. Make it Apple-Store-level minimal.

BUILD THIS.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1812df44-e73e-4bca-bcd6-058b41f319e9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
