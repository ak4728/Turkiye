import type { Pin, PinInput } from "./types";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function fetchPins(): Promise<Pin[]> {
  return handle<Pin[]>(await fetch("/api/pins", { cache: "no-store" }));
}

export async function createPin(input: PinInput): Promise<Pin> {
  return handle<Pin>(
    await fetch("/api/pins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function updatePin(
  id: string,
  input: Partial<PinInput>,
): Promise<Pin> {
  return handle<Pin>(
    await fetch(`/api/pins/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function deletePin(id: string): Promise<void> {
  return handle<void>(
    await fetch(`/api/pins/${id}`, { method: "DELETE" }),
  );
}
