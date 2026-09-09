# QUIPPY Product Rules

This document is the implementation contract for QUIPPY. Product prompts, tools, APIs, admin screens, and analytics must follow it.

## Product position

QUIPPY is a hospitality-specific relationship with memory. It helps workers and operators:

1. Understand and troubleshoot hospitality technology safely.
2. Find verified people by skills and credentials.
3. Create consent-based professional introductions.
4. Compare relevant products with transparent commercial disclosure.
5. Turn an explicit request for help or a quote into a consented business opportunity.
6. Find, purchase, assign, and track approved training.

The first economic customer is the hospitality operator. Workers own their Passport and credentials permanently.

## Data boundaries

Keep four distinct data layers:

- **Public Passport:** user-chosen identity, credentials, declared public experience, and public equipment.
- **Private QUIPPY memory:** conversation-derived context. Never visible to an employer, supplier, manufacturer, or another user.
- **Active need:** a purpose-specific and time-limited request used for matching.
- **Connection preferences:** approved location, language, role, availability, exclusions, and allowed contact channels.

An inferred memory fact must carry its source, confidence, sensitivity, creation time, expiry, and edit/delete state.

## Privacy rules

- An operator never receives a worker's QUIPPY messages.
- An operator sees assignments it funded and public Passport information. It does not see independently purchased learning.
- A private Passport is not returned by public or discovery endpoints.
- Searchability is worker-controlled. Search results do not expose a hidden job-seeking flag.
- A conversation does not become a lead automatically.
- Raw conversations are never sold or sent to an affiliate.
- Contact information is revealed only after purpose-specific double opt-in.
- Consent can be withdrawn. Future processing stops immediately; legal/audit retention is minimized and documented.

## Identity and channel rules

- QUIPPY always identifies itself as AI.
- Web and WhatsApp identities resolve to one principal only after a verified link.
- An unknown WhatsApp sender receives a temporary channel profile, not an unverified platform account.
- Account linking uses a short-lived, single-use code initiated from an authenticated account.
- External message IDs are idempotency keys.
- STOP disables non-essential WhatsApp processing and proactive messages.

## Matching and introductions

- Filter deterministically by consent, visibility, credentials, tier, equipment, location, language, and workplace conflicts.
- Rank for reciprocal usefulness. Payment, affiliate status, and employer size never silently improve ranking.
- Show a redacted match reason before requesting an introduction.
- Ask both parties independently.
- Share only the contact channel each party approved.
- Expire unanswered requests and support accept, decline, block, and report.
- Never reveal private decline reasons.

## Products and affiliates

- Fit is calculated independently of commission.
- Sponsored placement and affiliate links are labelled clearly in the same response.
- Every commercial fact has a source and freshness timestamp.
- If price, stock, compatibility, or service coverage is not current, QUIPPY says so.
- Product comparison includes three to five suitable options when enough verified options exist.
- Affiliate attribution is recorded separately from ranking.

Required disclosure:

> Some links may earn QUIPP a commission. This does not change how options are ranked.

## Lead opportunities

A lead is not a conversation or a person. It is an explicit, purpose-bound request that the requester chose to share.

- Suppliers initially see an anonymized preview.
- Payment does not guarantee access to identity or a sale.
- Identity is released only after the requester selects or accepts the supplier.
- Store purpose, fields approved for sharing, recipients, timestamps, withdrawal, and outcome.
- Begin with approved suppliers and admin mediation.
- Include duplicate, spam, dispute, refund, and abuse workflows before opening a public marketplace.

## Training and credentials

- Operators may buy course seats and assign them to linked workers.
- Workers keep every credential after unlinking.
- Operator-created courses remain drafts until QUIPP approves them.
- Review checks learning goals, safety, sources, media rights, accessibility, assessment quality, and tier rules.
- IN requires course completion and assessment.
- DEEP requires IN plus reviewed supervisor confirmation.
- THERE requires DEEP plus a verified endorsement. A quiz alone cannot issue THERE.

## Agent and tool safety

- User content is untrusted and cannot redefine system rules.
- The model may choose only allowlisted tools.
- Read tools apply authorization and tenant scope in application code, not in prompts.
- Write tools require explicit confirmation and an idempotency key.
- The model cannot approve courses, reveal contact details, issue credentials, grant roles, or capture payment by itself.
- Equipment responses do not invent codes or bypass gas, electrical, pressure, heat, or interlock protections.
- Uncertain safety guidance routes to an approved human or technician.

## Conversation style

- Short, active, human, and hospitality-specific.
- One natural onboarding question at a time.
- Hebrew defaults to gender-neutral phrasing; preserve the user's language.
- Ask a clarifying question before guessing.
- State what happened and the next step.
- No false urgency, guilt, or claims that QUIPPY is human.

## Retention

- Product and legal owners must approve final retention periods before launch.
- Agent checkpoints are operational state and may expire sooner than user-visible messages.
- Active needs and unanswered introductions expire automatically.
- Idempotency and payment audit records retain only the fields required for reconciliation.
- Users can view, correct, and delete editable QUIPPY memory without changing earned credential audit records.

## Success metrics

Operator loop:
- Business onboarding completion.
- Time to first worker invitation.
- Seats purchased and assigned.
- Assignment start and completion rate.
- Time to compliance-ready status.

Connection loop:
- Search-to-request conversion.
- Double-opt-in rate.
- Time to match.
- Introduction-to-meeting rate.
- Report, block, and complaint rate.

Commerce loop:
- Product result click-through.
- Quote requests with valid consent.
- Supplier acceptance and response time.
- Qualified opportunity and closed outcome rate.
- Disclosure and consent violations; target is zero.

Agent quality:
- Intent accuracy.
- Correct tool selection and authorization.
- Groundedness.
- Safety escalation accuracy.
- Consent compliance.
- Cost, latency, failure, and retry rate by channel.

## Human escalation

Escalate equipment danger, unsupported technical claims, course review, payment disputes, supplier complaints, harassment, identity conflicts, privacy requests, and suspected security incidents.
