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
    action 
} : {
    id: string;
    label: string;
    type: "text" | "email" | "password";
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    action?: ReactNode;
}) {
    return (
    <div className="space-y-1.5">
        <Label htmlFor={id} className="text-zinc-700">
        {label}
        </Label>
        <div className={action ? "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2" : undefined}>
        <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}
            className="border-vegr-berry-soft bg-white text-vegr-ink placeholder:text-zinc-400 focus-visible:border-vegr-green focus-visible:ring-vegr-green-soft"
        />
        {action}
        </div>
    </div>
    );
}