import type { CSSProperties } from "react";
import { avatarHue, initials } from "@/lib/contacts/format";
import type { Contact } from "@/lib/contacts/types";

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
} as const;

/** Initials bubble, tinted with a hue derived from the contact's email. */
export default function ContactAvatar({
  contact,
  size = "md",
}: {
  contact: Pick<Contact, "first_name" | "last_name" | "email" | "photo_url">;
  size?: keyof typeof SIZES;
}) {
  const style = {
    "--avatar-hue": avatarHue(contact.email),
  } as CSSProperties;

  return (
    <span
      role={contact.photo_url ? "img" : undefined}
      aria-hidden={contact.photo_url ? undefined : true}
      aria-label={contact.photo_url ? `${contact.first_name} ${contact.last_name}` : undefined}
      style={style}
      className={`contact-avatar inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-cover bg-center font-display font-semibold ${SIZES[size]}`}
    >
      {contact.photo_url ? (
        <img
          src={contact.photo_url}
          alt=""
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        initials(contact)
      )}
    </span>
  );
}
