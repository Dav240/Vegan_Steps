import { Switch } from "@/_components/ui/switch";

export default function PreferenceToggle({ 
    label, 
    description, 
    checked, 
    onCheckedChange 
    } : {
    label: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex gap-3 rounded-md border border-vegr-green-soft bg-vegr-cream p-3">
      <Switch checked={checked} onCheckedChange={onCheckedChange}/>
      <span>
          <span className="block text-sm font-bold">{label}</span>
          <span className="mt-1 block text-xs leading-5 text-zinc-600">
            {description}
          </span>
      </span>
    </label>
  );
}