import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";

export default function NumberField({ 
    id, 
    label, 
    value, 
    min, 
    suffix, 
    onChange 
} : {
    id: string;
    label: string;
    value: number | null;
    min: number;
    suffix: string;
    onChange: (value: number | null) => void;
}) {
    return (
        <div className="flex h-10 items-center gap-2 rounded-full border border-vegr-berry-soft bg-white px-4 text-sm font-bold shadow-sm">
        <Label htmlFor={id}>{label}:</Label>
        <Input
            id={id}
            type="number"
            min={min}
            step={1}
            value={value ?? ""}
            onChange={(event) => onChange(numberOrNull(event.target.value))}
            className="h-7 w-16 rounded-none border-0 px-1 text-center shadow-none focus-visible:ring-0"
        />
        <span>{suffix}</span>
        </div>
    );
}

function numberOrNull(value: string) {
  return value === "" ? null : Number(value);
}