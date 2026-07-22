import { Switch } from "@/_components/ui/switch";

export default function OptionalConsentSwitch({ 
    label, 
    checked, 
    onCheckedChange 
} : {
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm leading-5 text-zinc-700">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange}/>
    </label>
  );
}
