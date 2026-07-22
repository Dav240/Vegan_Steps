import { Eye, EyeOff } from "lucide-react";

export default function PasswordVisibilityButton({ 
    pressed,
    label,
    onClick,
} : {
    pressed: boolean;
    label: string;
    onClick: () => void;
}) {
  const Icon = pressed ? EyeOff : Eye;

  return (
    <button type="button" aria-label={label} aria-pressed={pressed} onClick={onClick}
      className="flex size-10 items-center justify-center rounded-md border border-brand-berry-soft bg-white text-brand-berry shadow-sm transition-colors hover:bg-brand-berry-soft hover:text-brand-berry-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-berry"
    >
      <Icon className="size-4" />
    </button>
  );
}