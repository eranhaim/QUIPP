# QUIPP end-user interaction catalogue

This is the release contract for the user journeys QUIPP must support. It is deliberately concrete: each interaction has a visible entry point, a user goal, an example prompt or action, a system outcome, a safe fallback, an escalation path, and a measurable success signal.

## 1. Build a worker Passport

**Entry point:** Start on the public homepage, then create an account and complete onboarding.

**User goal:** Create a permanent, shareable professional identity without losing ownership to an employer.

**Example action:** Select **Start**, create an account, choose worker, declare “UNOX combi oven” and “Square POS,” then publish `@marie-cooks`.

**Response and action:** QUIPP validates the account, asks one onboarding question at a time, records declared technology, and creates the Passport. The worker can review privacy and change searchability before sharing it.

**Fallback:** Preserve completed steps if the session expires. Explain the field that needs correction and provide a retry action; never discard a partially completed profile.

**Escalation:** Account recovery, duplicate identity, or privacy concern routes to the support/privacy workflow. An employer cannot alter this Passport.

**Success signal:** Onboarding completes, a public Passport URL is available, and the worker views or copies it.

## 2. Find and complete relevant training

**Entry point:** Passport home, **Earn**, Academy, or an operator assignment.

**User goal:** Find an accessible course that matches the equipment they actually use.

**Example action:** Filter by `THERMAL`, select a combi-oven course, and start assigned training.

**Response and action:** Show the course tier, duration, technology tag, access source, and price or free status before enrollment. On completion, issue only the earned IN credential and show the next DEEP step.

**Fallback:** If no course matches, explain that no published option is available and ask for equipment or skill context. If access is missing, name the access source that is required instead of implying enrollment.

**Escalation:** Broken embeds, inaccessible learning media, disputed completion, or assessment problems route to course support and retain the learner’s progress evidence.

**Success signal:** Enrollment begins, course progress advances, and a passed assessment produces a visible IN patch.

## 3. Submit DEEP proof

**Entry point:** An eligible IN credential’s detail view or the post-completion prompt.

**User goal:** Turn real workplace application into a reviewed DEEP credential.

**Example action:** Provide a supervisor’s name, role, and written confirmation that the worker used the equipment safely in service.

**Response and action:** Validate all required text, create one pending submission, show its review status, and notify the worker when a reviewer approves or rejects it with a reason.

**Fallback:** Keep the draft client-side until it submits. If the worker is not eligible, state that an IN credential is required and link to it.

**Escalation:** Fraud reports, identity disputes, or unsafe claims route to the QUIPP review team. The AI cannot approve a DEEP credential.

**Success signal:** A pending submission is visible; approval adds a permanent DEEP patch, while rejection names the next corrective step.

## 4. Link to a workplace

**Entry point:** Workplace screen.

**User goal:** Receive operator-funded training while keeping independent learning and private QUIPPY conversations private.

**Example action:** Search for “Harbour Kitchen, Toronto,” select the correct operator, and send a link request.

**Response and action:** Create a pending request. After operator approval, show active workplace status and eligible operator assignments. On unlink, immediately remove operator visibility and retain earned credentials.

**Fallback:** If no operator is found, allow the worker to retry with city or exact business name; never create an unverified link.

**Escalation:** Incorrect employer, coercion, or privacy conflict routes to support. The worker can unlink without operator approval.

**Success signal:** The request is confirmed and operator-assigned courses appear without exposing independent course history.

## 5. Assign and monitor operator training

**Entry point:** Operator overview, library, or roster.

**User goal:** Get a team compliant with the right training and see where help is needed.

**Example action:** Select a published course, choose three linked staff members, confirm the assignment, then send a reminder after seven inactive days.

**Response and action:** Validate seat availability, assignment scope, and linked-worker status before creating assignments. The dashboard shows not started, in progress, completed, low-credit, and inactive signals.

**Fallback:** If the operator has no seats or no linked workers, explain the blocker and link to the next setup action. Do not partially assign a course.

**Escalation:** Billing, seat-count, certificate, or data-visibility disputes route to operator support. Operators cannot revoke permanent credentials.

**Success signal:** An assignment is created, the worker starts it, completion rate improves, and the compliance export includes only permitted records.

## 6. Verify a credential or public Passport

**Entry point:** Public Passport link, QR code, or verification link.

**User goal:** Confirm that an applicant’s professional credentials are current and public by the worker’s choice.

**Example action:** Open `/p/marie-cooks` from a QR card and inspect a THERE patch.

**Response and action:** Render only public Passport fields, proficiency score, public credentials, and verification status. Private Passports and hidden job-seeking status never appear.

**Fallback:** For an unknown username or credential, return a clear not-found result without suggesting similar private accounts.

**Escalation:** Impersonation, incorrect public credential, or privacy complaint routes to the trust and safety workflow.

**Success signal:** A verifier opens a valid public Passport or credential and can distinguish verified information from unavailable information.

## 7. Troubleshoot equipment with QUIPPY

**Entry point:** Authenticated QUIPPY chat.

**User goal:** Get a safe first diagnostic step for hospitality equipment.

**Example prompt:** “Our UNOX combi shows E1. What should I check first?”

**Response and action:** QUIPPY identifies itself as AI, asks for manufacturer, exact model, and exact displayed code when needed, gives no more than three safe checks, and preserves the conversation privately.

**Fallback:** If QUIPPY is unavailable, show an explicit offline state. If it lacks verified information, say so and request the missing model/code rather than guessing.

**Escalation:** Gas odor, smoke, exposed wiring, abnormal pressure, bypassed interlocks, or uncertainty requires stopping use and contacting an approved technician or emergency service. QUIPPY must not suggest a bypass.

**Success signal:** The user supplies an exact model/code, receives a safety-appropriate next action, or is escalated before an unsafe action is taken.

## 8. Compare products transparently

**Entry point:** Products page or QUIPPY chat.

**User goal:** Compare suitable equipment without undisclosed commercial bias.

**Example prompt:** “Compare compact espresso machines for 150 drinks a day in Toronto under CAD 5,000.”

**Response and action:** Show three to five verified catalog options when available, rank by fit rather than commission, identify missing price/stock/compatibility facts, and display the affiliate disclosure on affiliate-linked results.

**Fallback:** If the catalog has no verified match, ask one useful requirements question. Never invent pricing, stock, service coverage, or compatibility.

**Escalation:** Product accuracy challenge, supplier complaint, or commercial disclosure concern routes to marketplace support.

**Success signal:** The user opens a product detail or starts a consented quote request while disclosure remains visible.

## 9. Request a consent-based introduction

**Entry point:** Discover, a public Passport, Connections, or QUIPPY.

**User goal:** Meet a relevant hospitality professional without exposing either person’s contact data prematurely.

**Example prompt:** “Please introduce me to @chef-ron to discuss a bakery opening.”

**Response and action:** Show a redacted, purpose-specific preview and require the exact confirmation command. Create the request only after confirmation; reveal the selected contact method only when both parties accept.

**Fallback:** If the Passport is unavailable or private, say that no request was created. If purpose is missing, ask for it before showing a preview.

**Escalation:** Harassment, misrepresentation, report, block, decline, and identity conflicts enter the introductions moderation path. Private decline reasons are never shown.

**Success signal:** A purpose-bound request is sent, accepted or declined without leaking contact data, and an accepted introduction advances to a meeting.

## 10. Create a supplier quote opportunity

**Entry point:** Products, My Leads, or QUIPPY.

**User goal:** Ask approved suppliers for a quote while controlling exactly which details they receive.

**Example prompt:** `QUOTE | combi ovens | Toronto | 12000 | Need two electric units for a 120-seat restaurant`

**Response and action:** Present the exact fields to be shared and require a matching `CONFIRM QUOTE` command. Approved suppliers first receive an anonymized preview; identity is released only after the requester selects or accepts a proposal.

**Fallback:** Reject incomplete or malformed quote commands with the required format. A private conversation never becomes a lead automatically.

**Escalation:** Duplicate, spam, dispute, refund, consent withdrawal, or supplier abuse routes to marketplace operations. Processing stops after consent is withdrawn.

**Success signal:** The requester confirms an explicit preview, a valid opportunity is created, a supplier responds, and the requester can record a selected or closed outcome.

## Release acceptance

Before enabling any entry point, test the primary path, the fallback, and the escalation route. Record these signals by interaction: entry-to-completion conversion, time to completion, validation failure rate, safety or consent escalation rate, and resolved outcome rate. Do not treat a chat message, a product click, or an employer relationship as consent for any other workflow.
