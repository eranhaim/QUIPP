# WhatsApp course lead bot

The dedicated QUIPP course-lead flow is off unless the QUIPP-specific GreenAPI
variables are complete and `GREEN_API_LEAD_BOT_ENABLED=true`.

Required for live WhatsApp:

```text
GREEN_API_ENABLED=true
GREEN_API_LEAD_BOT_ENABLED=true
GREEN_API_ID_INSTANCE=...
GREEN_API_TOKEN_INSTANCE=...
GREEN_API_WEBHOOK_TOKEN=...
```

Configure GreenAPI to POST inbound notifications to:

```text
https://YOUR_QUIPP_HOST/api/webhooks/green-api/YOUR_GREEN_API_ID_INSTANCE
```

Use `Authorization: Bearer YOUR_GREEN_API_WEBHOOK_TOKEN` on that webhook.
Do not use credentials or message copy from another QUIPP-adjacent project.

## Flow

1. A lead is greeted and asked what they want to learn.
2. They can request course options at any point.
3. The bot captures learning goal, experience, name, and a valid email.
4. `HUMAN`, `AGENT`, `נציג`, and similar requests immediately create a human
   escalation record without pretending a person is available live.
5. An administrator works the lead at `/admin/whatsapp-leads` and can mark it
   closed.

The lead flow is deterministic and uses only published public course metadata.
It does not require an LLM, so missing `ANTHROPIC_API_KEY` does not affect it.
When lead mode is false, the configured GreenAPI instance continues to run the
existing account-linked QUIPPY flow.

## Media storage

Course metadata and text content are managed at `/admin/courses`. Video
uploads require `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, and
`AWS_SECRET_ACCESS_KEY`. Without all four, upload and playback are explicitly
unavailable; no production media behavior is simulated.
