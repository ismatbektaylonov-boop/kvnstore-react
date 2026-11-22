// Form feedback only; the API remains authoritative for validation.
export function validPassword(value: string) {
  return value.length >= 8 && new TextEncoder().encode(value).length <= 72;
}
export function validImage(file: File): string {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "Choose a JPEG, PNG, or WebP image.";
  if (file.size > 5 * 1024 * 1024) return "Images must be 5 MiB or smaller.";
  return "";
}
