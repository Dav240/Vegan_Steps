import { CheckCircle2, XCircle } from "lucide-react";

export default function PasswordRequirementsPanel({ 
    password,
    confirmPassword,
}: {
    password: string;
    confirmPassword: string;
}) {
  const requirements = [
    {
      label: "8 to 25 characters",
      passed: password.length >= 8 && password.length <= 25 && getUtf8ByteLength(password) <= 72,
    },
    {
      label: "At least one uppercase letter",
      passed: /[A-Z]/.test(password),
    },
    {
      label: "At least one number, 0-9",
      passed: /[0-9]/.test(password),
    },
    {
      label: "At least one special character, e.g. ! @ # ?",
      passed: /[^A-Za-z0-9]/.test(password),
    },
    {
      label: "Passwords match",
      passed: password.length > 0 && password === confirmPassword,
    },
  ];

  return (
    <div className="rounded-lg border border-vegr-green/25 bg-vegr-green-soft/45 p-3">
      <p className="text-sm font-bold uppercase tracking-wide text-vegr-berry">
        Password requirements
      </p>
      <ul className="mt-2 space-y-1.5">
        {requirements.map((requirement) => {
          const Icon = requirement.passed ? CheckCircle2 : XCircle;

          return (
            <li
              key={requirement.label}
              className={
                requirement.passed ? "flex items-center gap-2 text-sm font-medium text-vegr-green-dark" : "flex items-center gap-2 text-sm font-medium text-red-700"
              }
            >
              <Icon className="size-4 shrink-0" />
              <span>{requirement.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function getUtf8ByteLength(value: string) {
  return new TextEncoder().encode(value).length;
}
