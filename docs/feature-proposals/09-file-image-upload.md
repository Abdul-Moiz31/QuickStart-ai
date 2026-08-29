# 09 — File & Image Upload in Chat

**Type:** Widget / Core Product  
**Priority:** Low  
**Effort:** Medium  

---

## Problem

Visitors often need to share context to get help — an error screenshot, an invoice number, a photo of a broken product. The current widget is text-only. Without file upload, visitors resort to describing problems in words that the bot cannot accurately understand, leading to more escalations and lower resolution rates.

## User Story

> As a visitor on a software support site, I want to paste or upload a screenshot of the error I'm seeing — so the bot can read it and give me a specific solution instead of generic troubleshooting steps.

## Proposed Design

### Supported input types

| Type | Format | Use case |
|------|--------|----------|
| Image | PNG, JPG, WEBP, GIF (static) | Screenshots, product photos, UI errors |
| PDF | ≤ 5 MB | Invoices, manuals, contracts |
| Plain text / CSV | ≤ 100 KB | Logs, data exports |

### Widget UX

- Paperclip icon in the message composer (next to send button)
- Drag-and-drop onto the widget window
- Paste image from clipboard (`paste` event on the input)
- Preview thumbnail shown in the chat before send
- File size limit enforced client-side with friendly error

### API changes

`POST /api/v1/chat/message` gains an optional `attachment` field:
```ts
// multipart/form-data
{
  message: string,
  sessionId?: string,
  attachment?: File   // optional
}
```

Server flow:
1. Validate file type and size
2. Store temporarily in S3/R2 (or local disk in dev) — presigned URL valid 1 hour
3. For images: pass as an image block in the LLM message (Claude `image` content, GPT-4V `image_url`)
4. For PDFs/text: extract text (using `pdf-parse` or similar), prepend to the user message context before RAG
5. File URL and type stored in the ChatSession message metadata

### LLM image support

The existing `packages/rag/src/llm.ts` `ChatClient` interface needs an `imageContent` variant on `LLMMessage`:

```ts
type LLMMessage =
  | { role: "user" | "assistant"; content: string }
  | { role: "user"; content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> }
```

This follows the OpenAI multi-modal message format, which Anthropic and Google also support (with slight adaptation in the provider adapter).

Image-capable models only: GPT-4o, Claude 3+, Gemini 1.5+. If the project uses a text-only model, return a user-friendly error: *"Image upload requires a vision-capable model. Update your model in project settings."*

### Storage

- Development: local `uploads/` directory served statically
- Production: S3-compatible (R2 preferred — cheaper, no egress). Pre-signed upload URL pattern: client uploads directly to R2, API receives the object key.
- Files are deleted after 24 hours (BullMQ cleanup job)

### Privacy

- Files stored with a random UUID filename (no PII in path)
- Not indexed in the knowledge base — per-session only
- MIME type and magic bytes both validated server-side

## Affected Packages

| Package | Change |
|---------|--------|
| `packages/widget-core` | File picker, drag-drop, paste handler, thumbnail preview |
| `packages/widget-react` | `allowAttachments` prop |
| `packages/widget-vanilla` | `data-allow-attachments` attribute |
| `apps/api` | Multipart body parsing, S3/R2 upload, image message construction |
| `packages/rag` | Multi-modal `LLMMessage` type, image content in chat calls |

## Acceptance Criteria

- [ ] Visitor can attach a PNG/JPG by clicking the paperclip or dragging onto the widget
- [ ] Pasting an image from clipboard attaches it
- [ ] Image is passed to the LLM as a vision input; bot answers about the image content
- [ ] PDF text is extracted and prepended to the user message context
- [ ] Unsupported file types show a friendly error ("Only images and PDFs are supported")
- [ ] Files over the size limit are rejected client-side before upload
- [ ] Files are deleted from storage after 24 hours
- [ ] Text-only model projects show a clear error when image is attached

## Open Questions

- Should uploaded files be visible to the business owner in the conversation view?
- Should we allow the business to toggle `allowAttachments` off entirely per project?
- What happens if the image contains sensitive personal data (faces, IDs)? Should we add an opt-in content moderation step?
