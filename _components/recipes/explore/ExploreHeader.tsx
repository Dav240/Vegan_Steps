export default function ExploreHeader({ isVisitor }: { isVisitor: boolean }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-bold uppercase text-brand-green-dark">
          Recipe discovery
        </p>
        <h2 className="mt-1 text-4xl font-bold text-brand-ink md:text-5xl">
          {isVisitor ? "Explore vegan recipes" : "Find your next vegan meal"}
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-700">
          Search approved community recipes, or scroll through a few rows of
          recommendations picked from tags, ratings, views, and a little
          randomness.
        </p>
      </div>
    </header>
  );
}