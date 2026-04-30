const TIMEOUT_MS = 10000;
const MAX_RETRIES = 1;

export async function sendMessage(message) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch("/api/send-telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_API_SECRET ?? "",
        },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (data.success) {
        return { success: true };
      }
      return { success: false, error: data.error ?? "Send failed" };
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === "AbortError") {
        lastError = "Request timed out";
      } else {
        lastError = "Network error";
      }

      // Only retry on network errors, not on AbortError
      if (attempt < MAX_RETRIES && err.name !== "AbortError") {
        continue;
      }
    }
  }

  return { success: false, error: lastError };
}
