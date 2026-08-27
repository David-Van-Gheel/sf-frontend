"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import Field from "@/components/ui/Field";
import Button, { buttonClasses } from "@/components/ui/Button";
import { CONTACT_FIELD_GROUPS } from "@/lib/contacts/schema";
import {
  EMPTY_FORM_STATE,
  type Contact,
  type ContactInput,
  type FormState,
  type Address,
} from "@/lib/contacts/types";

export type ContactFormAction = (
  state: FormState,
  formData: FormData,
) => Promise<FormState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {pending ? "Saving…" : label}
    </Button>
  );
}

/**
 * Create/edit form. The field list comes from `CONTACT_FIELD_GROUPS`, and the
 * action is a bound server action — so a submit is a plain POST that works
 * before hydration and reports errors through `useActionState`.
 */
export default function ContactForm({
  action,
  contact,
  submitLabel,
  cancelHref,
}: {
  action: ContactFormAction;
  contact?: Contact;
  submitLabel: string;
  cancelHref: string;
}) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    contact?.photo_url ?? null,
  );
  const [hasReplacementFile, setHasReplacementFile] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>(
    contact?.addresses?.slice(1) ?? [],
  );
  const [state, formAction] = useActionState(async (previousState: FormState, formData: FormData) => {
    const nextState = await action(previousState, formData);
    if (nextState.status === "error" && nextState.values?.photo_url) {
      setHasReplacementFile(false);
    }
    return nextState;
  }, EMPTY_FORM_STATE);

  const displayedPhoto =
    hasReplacementFile || state.status !== "error"
      ? photoPreview
      : (state.values?.photo_url ?? photoPreview);

  function valueFor(name: keyof ContactInput): string {
    const value = state.values?.[name] ?? contact?.[name];
    return typeof value === "string" ? value : "";
  }

  return (
    <form action={formAction} noValidate className="space-y-8">
      <input
        type="hidden"
        name="photo_url"
        value={
          hasReplacementFile
            ? ""
            : (state.values?.photo_url ?? contact?.photo_url ?? "")
        }
        readOnly
      />
      <input type="hidden" name="addresses" value={JSON.stringify(addresses)} readOnly />
      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-foreground"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span>{state.message}</span>
        </div>
      ) : null}

      {CONTACT_FIELD_GROUPS.map((group) => (
        <fieldset key={group.title} className="space-y-4">
          <legend className="sr-only">{group.title}</legend>

          <div className="border-b border-hairline pb-2">
            <h2 className="font-display text-sm font-semibold text-foreground">
              {group.title}
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {group.description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <Field
                key={field.name}
                field={field}
                defaultValue={valueFor(field.name)}
                error={state.fieldErrors?.[field.name]}
              />
            ))}


            {group.title === "Address" ? (
              <>
                <label className="text-[13px] font-medium text-foreground">
                  Address type
                  <select
                    name="address_type"
                    defaultValue={contact?.addresses?.[0]?.type ?? "Other"}
                    className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
                  >
                    <option>Home</option>
                    <option>Work</option>
                    <option>Other</option>
                  </select>
                </label>
                {addresses.map((item, index) => (
                  <div
                    key={`${item.id ?? "new"}-${index}`}
                    className="sm:col-span-2 grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2"
                  >
                    <label className="text-[13px] font-medium text-foreground">
                      Address type
                      <select
                        value={item.type}
                        onChange={(event) =>
                          setAddresses((current) =>
                            current.map((address, addressIndex) =>
                              addressIndex === index
                                ? { ...address, type: event.target.value as Address["type"] }
                                : address,
                            ),
                          )
                        }
                        className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
                      >
                        <option>Home</option>
                        <option>Work</option>
                        <option>Other</option>
                      </select>
                    </label>
                    {(["address", "city", "state", "postal_code", "country"] as const).map(
                      (field) => (
                        <label key={field} className="text-[13px] font-medium text-foreground">
                          {field.replace("_", " ")}
                          <input
                            value={item[field] ?? ""}
                            onChange={(event) =>
                              setAddresses((current) =>
                                current.map((address, addressIndex) =>
                                  addressIndex === index
                                    ? { ...address, [field]: event.target.value || null }
                                    : address,
                                ),
                              )
                            }
                            className="mt-1.5 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
                          />
                        </label>
                      ),
                    )}
                    <button
                      type="button"
                      disabled={addresses.length >= 19}
                      onClick={() =>
                        setAddresses((current) =>
                          current.filter((_, addressIndex) => addressIndex !== index),
                        )
                      }
                      className="text-left text-sm text-destructive"
                    >
                      Remove address
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setAddresses((current) => [
                      ...current,
                      {
                        type: "Other",
                        address: null,
                        city: null,
                        state: null,
                        postal_code: null,
                        country: null,
                      },
                    ])
                  }
                  className="text-left text-sm font-medium text-primary"
                >
                  Add address
                </button>
                {state.fieldErrors?.addresses ? (
                  <p role="alert" className="text-[13px] text-destructive">
                    {state.fieldErrors.addresses}
                  </p>
                ) : null}
              </>
            ) : null}

            {group.title === "Identity" ? (
              <div>
                <label
                  htmlFor="contact-photo"
                  className="mb-1.5 block text-[13px] font-medium text-foreground"
                >
                  Contact photo{" "}
                  <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                    optional
                  </span>
                </label>
                <input
                  id="contact-photo"
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      setPhotoPreview(contact?.photo_url ?? null);
                      setHasReplacementFile(false);
                      return;
                    }
                    setHasReplacementFile(true);
                    const reader = new FileReader();
                    reader.addEventListener("load", () => {
                      if (typeof reader.result === "string") {
                        setPhotoPreview(reader.result);
                      }
                    });
                    reader.readAsDataURL(file);
                  }}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
                />
                {displayedPhoto ? (
                  <img
                    src={displayedPhoto}
                    alt="Selected contact"
                    className="mt-3 aspect-square h-20 w-20 rounded-full object-cover"
                  />
                ) : null}
                <p className="mt-1.5 text-[12px] text-muted-foreground">
                  JPEG, PNG, WebP, or GIF up to 1 MB.
                </p>
              </div>
            ) : null}
          </div>
        </fieldset>
      ))}

      <div className="flex items-center gap-2 border-t border-hairline pt-4">
        <SubmitButton label={submitLabel} />
        <Link href={cancelHref} className={buttonClasses("secondary")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
