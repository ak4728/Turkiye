"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { Pin, PinInput } from "@/lib/types";

interface PinFormProps {
  draft: { lat: number; lng: number } | null;
  editing: Pin | null;
  onSubmit: (input: PinInput) => Promise<void>;
  onCancel: () => void;
}

const emptyState = {
  name: "",
  category: CATEGORIES[0].id as string,
  description: "",
  notes: "",
  address: "",
  imageUrl: "",
  rating: "",
  tags: "",
};

export default function PinForm({
  draft,
  editing,
  onSubmit,
  onCancel,
}: PinFormProps) {
  const [form, setForm] = useState(emptyState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        category: editing.category,
        description: editing.description ?? "",
        notes: editing.notes ?? "",
        address: editing.address ?? "",
        imageUrl: editing.imageUrl ?? "",
        rating: editing.rating ? String(editing.rating) : "",
        tags: editing.tags.join(", "),
      });
    } else {
      setForm(emptyState);
    }
    setError(null);
  }, [editing, draft]);

  const lat = editing?.latitude ?? draft?.lat;
  const lng = editing?.longitude ?? draft?.lng;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lat == null || lng == null) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim() || null,
        notes: form.notes.trim() || null,
        address: form.address.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        latitude: lat,
        longitude: lng,
        rating: form.rating ? Number(form.rating) : null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">
        {editing ? "Edit pin" : "New pin"}
      </h2>

      {lat != null && lng != null ? (
        <p className="text-xs text-gray-500">
          📍 {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Name
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Çiya Sofrası"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-normal focus:border-gray-900 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Category
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-normal focus:border-gray-900 focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Address
        <input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Optional"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-normal focus:border-gray-900 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Photo URL
        <input
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          placeholder="https://…  (optional)"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-normal focus:border-gray-900 focus:outline-none"
        />
        {form.imageUrl.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.imageUrl.trim()}
            alt="Preview"
            className="mt-1 h-24 w-full rounded-md object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            onLoad={(e) => {
              e.currentTarget.style.display = "block";
            }}
          />
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Description
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          placeholder="What makes this place special?"
          className="resize-y rounded-md border border-gray-300 px-3 py-2 text-sm font-normal focus:border-gray-900 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Notes
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          placeholder="Private notes, tips, opening hours…"
          className="resize-y rounded-md border border-gray-300 px-3 py-2 text-sm font-normal focus:border-gray-900 focus:outline-none"
        />
      </label>

      <div className="flex gap-3">
        <label className="flex w-24 flex-col gap-1 text-sm font-medium">
          Rating
          <select
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-normal focus:border-gray-900 focus:outline-none"
          >
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
          Tags
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="comma, separated"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-normal focus:border-gray-900 focus:outline-none"
          />
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : editing ? "Save changes" : "Add pin"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
