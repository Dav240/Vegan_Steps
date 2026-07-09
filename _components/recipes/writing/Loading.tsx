export default function RecipeWriterLoading() {
  return (
    <div className="mx-auto grid w-full max-w-[1500px] animate-pulse gap-10 px-6 py-10 md:px-12 lg:grid-cols-2 lg:px-16">
      <div>
        <div className="h-14 w-2/3 rounded bg-vegr-berry-soft" />
        <div className="mt-6 aspect-[16/10] rounded-lg bg-vegr-green-soft" />
      </div>
      <div className="space-y-5 pt-16">
        <div className="h-9 w-1/3 rounded bg-vegr-berry-soft" />
        <div className="h-28 w-full rounded bg-white" />
        <div className="h-64 w-full rounded bg-vegr-green-soft" />
      </div>
    </div>
  );
}