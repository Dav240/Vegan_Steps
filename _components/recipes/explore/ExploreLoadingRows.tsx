export default function ExploreLoadingRows() {
  return (
    <div className="mt-10 space-y-16">
      {Array.from({ length: 4 }, (_, rowIndex) => (
        <div key={rowIndex}>
          <div className="h-8 w-56 animate-pulse rounded bg-brand-berry-soft" />
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="min-h-80 animate-pulse overflow-hidden rounded-lg border border-brand-berry-soft bg-white"
              >
                <div className="aspect-[4/3] bg-brand-green-soft" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-3/4 rounded bg-brand-berry-soft" />
                  <div className="h-4 w-1/2 rounded bg-brand-green-soft" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}