 import { TRPCError } from "@trpc/server";

// Environment variables interface
interface Environment {
  forgeApiUrl?: string;
  forgeApiKey?: string;
  ownerOpenId?: string;
}

// Simple ENV object - in production, this would be loaded from environment
const ENV: Environment = {
  forgeApiUrl: process.env.FORGE_API_URL,
  forgeApiKey: process.env.FORGE_API_KEY,
  ownerOpenId: process.env.OWNER_OPEN_ID,
};

interface NotificationPayload {
  title: string;
  content: string;
}

function validatePayload(payload: NotificationPayload): NotificationPayload {
  if (!payload.title || typeof payload.title !== "string") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required and must be a string.",
    });
  }
  if (!payload.content || typeof payload.content !== "string") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required and must be a string.",
    });
  }
  return {
    title: payload.title.trim(),
    content: payload.content.trim(),
  };
}

/**
 * Dispatches a project-owner notification through the Manus Notification Service.
 * Returns `true` if the request was accepted, `false` when the upstream service
 * cannot be reached (callers can fall back to email/slack). Validation errors
 * bubble up as TRPC errors so callers can fix the payload.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  if (!ENV.forgeApiUrl) {
    // If notification service is not configured, log and return false
    console.warn("[Notification] Forge API URL not configured, skipping notification");
    return false;
  }

  if (!ENV.forgeApiKey) {
    // If API key is not configured, log and return false
    console.warn("[Notification] Forge API Key not configured, skipping notification");
    return false;
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(`${ENV.forgeApiUrl}/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        title,
        content,
        type: "investment_analysis",
        priority: "normal",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("[Notification] Failed to send notification:", response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[Notification] Request timed out after 30 seconds");
      return false;
    }
    console.error("[Notification] Error sending notification:", error);
    return false;
  }
}