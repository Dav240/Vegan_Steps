import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";

import { type ReactNode } from "react";

export default function AuthField({ 
    id, 
    label, 
    type, 
    value, 
    placeholder, 
    onChange, 
    action,
    autoComplete,
    inputMode,
    spellCheck,
} : {
    id: string;
    label: string;
    type: "text" | "email" | "password";
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    action?: ReactNode;
    autoComplete?: string;
    inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
    spellCheck?: boolean;
}) {
    return (
    <div className="space-y-1.5">
        <Label htmlFor={id} className="text-zinc-700">
            {label}
        </Label>
        <div className={action ? "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2" : undefined}>
            <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}
                autoComplete={autoComplete}
                inputMode={inputMode}
                spellCheck={spellCheck}
                className="border-brand-berry-soft bg-white text-brand-ink placeholder:text-zinc-400 focus-visible:border-brand-green focus-visible:ring-brand-green-soft"
            />
            {action}
        </div>
    </div>
    );
}
