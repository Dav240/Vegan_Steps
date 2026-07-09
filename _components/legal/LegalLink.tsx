import Link from "next/link";
import { type ReactNode } from "react";

export default function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} target="_blank" className="font-bold text-vegr-berry hover:text-vegr-berry-dark hover:underline">
      {children}
    </Link>
  );
}