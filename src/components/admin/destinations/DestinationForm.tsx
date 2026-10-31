"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";

type Status = "draft" | "published" | "archived";

type DestinationFormProps = {
  initialData?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category: string | null;
    address: string | null;
    regency: string | null;
    latitude: number | null;
    longitude: number | null;
    image_url: string | null;
    status: Status;
  };
  mode: "create" | "edit";
};

type FormValues = {
  name: string;
  slug: string;
  description: string;
  category: string;
  address: string;
  regency: string;
  latitude: string;
  longitude: string;
  image_url: string;
  status: Status;
};

const emptyValues: FormValues = {
  name: "",
  slug: "",
  description: "",
  category: "",
  address: "",
  regency: "",
  latitude: "",
  longitude: "",
  image_url: "",
  status: "draft",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-zinc-700"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

export default function DestinationForm({
  initialData,
  mode,
}: DestinationFormProps) {
  const router = useRouter();

  const [values, setValues] = useState<FormValues>({
    ...emptyValues,
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    description: initialData?.description ?? "",
    category: initialData?.category ?? "",
    address: initialData?.address ?? "",
    regency: initialData?.regency ?? "",
    latitude: initialData?.latitude?.toString() ?? "",
    longitude: initialData?.longitude?.toString() ?? "",
    image_url: initialData?.image_url ?? "",
    status: initialData?.status ?? "draft",
  });

  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K]
  ) {
    setValues((current) => {
      const next = { ...current, [field]: value };

      if (field === "name" && !slugEdited) {
        next.slug = slugify(value as string);
      }

      return next;
    });
  }

  function validate() {
    const name = values.name.trim();
    const slug = values.slug.trim();
    const latText = values.latitude.trim();
    const lngText = values.longitude.trim();
    const imageUrl = values.image_url.trim();

    if (!name || !slug) {
      return { error: "Destination name and slug are required." };
    }

    if (Boolean(latText) !== Boolean(lngText)) {
      return { error: "Latitude and longitude must be provided together." };
    }

    const latitude = latText ? Number(latText) : null;
    const longitude = lngText ? Number(lngText) : null;

    const invalidLat =
      latitude !== null &&
      (!Number.isFinite(latitude) || latitude < -90 || latitude > 90);
    const invalidLng =
      longitude !== null &&
      (!Number.isFinite(longitude) || longitude < -180 || longitude > 180);

    if (invalidLat || invalidLng) {
      return { error: "Please enter valid latitude and longitude values." };
    }

    if (imageUrl && !/^https?:\/\/.+/i.test(imageUrl)) {
      return { error: "Image URL must start with http:// or https://." };
    }

    return {
      payload: {
        name,
        slug,
        description: values.description.trim() || null,
        category: values.category.trim() || null,
        address: values.address.trim() || null,
        regency: values.regency.trim() || null,
        latitude,
        longitude,
        image_url: imageUrl || null,
        status: values.status,
      },
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const result = validate();
    if ("error" in result) {
      setError(result.error ?? "Invalid form.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const response =
      mode === "create" || !initialData
        ? await supabase.from("destinations").insert(result.payload)
        : await supabase
            .from("destinations")
            .update(result.payload)
            .eq("id", initialData.id);

    setSaving(false);

    if (response.error) {
      setError(
        response.error.code === "23505"
          ? "This slug is already being used. Please choose another one."
          : response.error.message
      );
      return;
    }

    router.push("/admin/destinations");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection
        title="Basic information"
        description="General information about this destination."
      >
        <div className="grid gap-5 p-5 md:grid-cols-2">
          <Field label="Destination name *" htmlFor="name">
            <Input
              id="name"
              required
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="e.g. Pantai Kuta"
            />
          </Field>

          <Field
            label="Slug *"
            htmlFor="slug"
            hint="Used in the destination URL."
          >
            <Input
              id="slug"
              required
              value={values.slug}
              onChange={(event) => {
                setSlugEdited(true);
                updateField("slug", event.target.value);
              }}
              placeholder="pantai-kuta"
            />
          </Field>

          <Field
            label="Description"
            htmlFor="description"
            className="md:col-span-2"
          >
            <Textarea
              id="description"
              value={values.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Describe this destination..."
              rows={4}
            />
          </Field>

          <Field label="Category" htmlFor="category">
            <Input
              id="category"
              value={values.category}
              onChange={(event) => updateField("category", event.target.value)}
              placeholder="e.g. Pantai, Wisata Budaya"
            />
          </Field>

          <Field label="Regency" htmlFor="regency">
            <Input
              id="regency"
              value={values.regency}
              onChange={(event) => updateField("regency", event.target.value)}
              placeholder="e.g. Badung"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Location and media"
        description="Add the destination address, coordinates, and image."
      >
        <div className="grid gap-5 p-5 md:grid-cols-2">
          <Field
            label="Address"
            htmlFor="address"
            className="md:col-span-2"
          >
            <Input
              id="address"
              value={values.address}
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="Full destination address"
            />
          </Field>

          <Field label="Latitude" htmlFor="latitude">
            <Input
              id="latitude"
              type="number"
              step="any"
              min="-90"
              max="90"
              value={values.latitude}
              onChange={(event) => updateField("latitude", event.target.value)}
              placeholder="-8.7184"
            />
          </Field>

          <Field label="Longitude" htmlFor="longitude">
            <Input
              id="longitude"
              type="number"
              step="any"
              min="-180"
              max="180"
              value={values.longitude}
              onChange={(event) =>
                updateField("longitude", event.target.value)
              }
              placeholder="115.1686"
            />
          </Field>

          <Field
            label="Image URL"
            htmlFor="image_url"
            className="md:col-span-2"
          >
            <Input
              id="image_url"
              type="url"
              value={values.image_url}
              onChange={(event) =>
                updateField("image_url", event.target.value)
              }
              placeholder="https://example.com/image.jpg"
            />
            {values.image_url && (
              <img
                src={values.image_url}
                alt="Destination preview"
                className="mt-3 h-40 w-full rounded-lg border border-zinc-200 object-cover"
              />
            )}
          </Field>
        </div>
      </FormSection>

      <FormSection title="Publication">
        <div className="max-w-sm p-5">
          <Field
            label="Publication status"
            htmlFor="status"
            hint="Only published destinations are visible to public visitors."
          >
            <Select
              id="status"
              value={values.status}
              onChange={(event) =>
                updateField("status", event.target.value as Status)
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
        </div>
      </FormSection>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link href="/admin/destinations">
          <Button type="button" variant="outline" className="w-full sm:w-auto">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving
            ? "Saving..."
            : mode === "create"
              ? "Create destination"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}