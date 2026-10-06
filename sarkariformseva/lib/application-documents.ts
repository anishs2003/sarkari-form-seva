export type ApplicationDocumentRequirement = {
  id: string;
  label: string;
  required: boolean;
  accept: string;
};

const defaultRequirements: ApplicationDocumentRequirement[] = [
  { id: "identity", label: "Aadhaar / ID", required: true, accept: "image/jpeg,image/png,image/webp,application/pdf" },
  { id: "photo", label: "Recent photo", required: true, accept: "image/jpeg,image/png,image/webp" },
  { id: "signature", label: "Signature", required: true, accept: "image/jpeg,image/png,image/webp,application/pdf" },
  { id: "tenth", label: "10th marksheet", required: false, accept: "image/jpeg,image/png,image/webp,application/pdf" },
  { id: "twelfth", label: "12th marksheet", required: false, accept: "image/jpeg,image/png,image/webp,application/pdf" },
  { id: "other", label: "Other document", required: false, accept: "image/jpeg,image/png,image/webp,application/pdf" },
];

export function getApplicationDocumentRequirements(value?: string): ApplicationDocumentRequirement[] {
  const names = (value ?? "").split(/[\r\n,;]+/).map((name) => name.trim()).filter(Boolean);
  if (!names.length) return defaultRequirements;

  return names.map((label, index) => ({
    id: `required-${index}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "document"}`,
    label,
    required: true,
    accept: "image/jpeg,image/png,image/webp,application/pdf",
  }));
}
