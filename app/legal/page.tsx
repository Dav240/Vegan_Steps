import Link from "next/link";

import { legalPolicies } from "@/lib/legal";

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-vegr-cream px-5 py-10 text-vegr-ink md:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-bold text-vegr-berry transition-colors hover:text-vegr-berry-dark hover:underline"
        >
          Back to VegR
        </Link>

        <header className="mt-8 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-vegr-berry">
            FAQ
          </p>
          <h1 className="mt-3 text-4xl font-bold text-vegr-ink md:text-5xl">
            Help, safety, and privacy.
          </h1>
          <p className="mt-4 text-lg leading-8 text-zinc-700">
            Quick answers about how VegR works, what data is used, and the rules
            that keep recipes safer for everyone.
          </p>
        </header>

        <nav className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {legalPolicies.map((policy) => (
            <a
              key={policy.slug}
              href={`#${policy.slug}`}
              className="rounded-lg border border-vegr-berry-soft bg-vegr-paper p-4 shadow-sm transition-colors hover:bg-vegr-green-soft hover:text-vegr-green-dark"
            >
              <h2 className="text-lg font-bold">{policy.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-700">
                {policy.summary}
              </p>
            </a>
          ))}
        </nav>

        <div className="mt-10 space-y-8">
          {legalPolicies.map((policy) => (
            <section
              key={policy.slug}
              id={policy.slug}
              className="scroll-mt-8 rounded-lg border border-vegr-berry-soft bg-white p-6 shadow-sm md:p-8"
            >
              <p className="text-sm font-bold uppercase tracking-wide text-vegr-berry">
                {policy.slug.replaceAll("-", " ")}
              </p>
              <h2 className="mt-2 text-3xl font-bold text-vegr-ink">
                {policy.title}
              </h2>
              <p className="mt-3 max-w-3xl leading-7 text-zinc-700">
                {policy.summary}
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {policy.sections.map((section) => (
                  <article
                    key={section.heading}
                    className="rounded-md border border-vegr-green-soft bg-vegr-cream p-4"
                  >
                    <h3 className="font-bold text-vegr-green-dark">
                      {section.heading}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-700">
                      {section.body}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
