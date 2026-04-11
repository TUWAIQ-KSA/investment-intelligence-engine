import { TRPCError } from '@trpc/server'
import { z } from 'zod'

const NotificationPayloadSchema = z.object({
  title: z.string(),
  content: z.string(),
})

type NotificationPayload = z.infer<typeof NotificationPayloadSchema>

function validatePayload(payload: NotificationPayload) {
  return NotificationPayloadSchema.parse(payload)
}

/**
 * Dispatches a project-owner notification.
 * Returns true if the request was accepted, false when it
 * cannot be reached (callers can fall back to email/slack).
 * Does NOT bubble up as TRPC errors so callers can fix the payload.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload)

  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Notification service URL is not configured.',
    });
  }

  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Notification service API key is not configured.',
    });
  }

  try {
    await fetch(ENV.forgeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({ title, content }),
    })
    return true
  } catch {
    return false
  }
}

const ENV = {
  forgeApiUrl: process.env.FORGE_API_URL,
  forgeApiKey: process.env.FORGE_API_KEY,
}
