import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/_components/ui/dialog";
import { Button } from "@/_components/ui/button";

export default function ConfirmDialog({ 
    open, 
    onOpenChange, 
    title, 
    description, 
    confirmLabel, 
    destructive = false, 
    isPending, 
    onConfirm 
} : {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel: string;
    destructive?: boolean;
    isPending: boolean;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="border-brand-berry-soft bg-brand-cream sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="font-indie-flower text-3xl font-bold text-brand-ink">
                    {title}
                </DialogTitle>
                <DialogDescription className="leading-6 text-zinc-700">
                    {description}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                    Cancel
                </Button>
                <Button type="button" variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={isPending}
                    className={destructive ? undefined : "bg-brand-green text-white hover:bg-brand-green-dark"}
                >
                    {confirmLabel}
                </Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}