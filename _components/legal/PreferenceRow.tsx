import { Switch } from "@/_components/ui/switch";

export default function PreferenceRow({ 
    title,
    description,
    checked,
    disabled,
    onCheckedChange,
} : {
    title: string;
    description: string;
    checked: boolean;
    disabled: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
    return (
    <label className="flex items-center justify-between gap-4 rounded-md border border-brand-green-soft bg-brand-cream p-3">
        <span>
            <span className="block font-bold text-brand-ink">{title}</span>
            <span className="mt-1 block text-sm leading-5 text-zinc-600">
                {description}
            </span>
        </span>
        <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange}/>
    </label>
    );
}