import Image from "next/image";

const BANNER_URL = "https://res.cloudinary.com/diqefvh29/image/upload/banner_plbcgv";

export default function ExploreBanner() {
  return (
    <section className="relative h-44 overflow-hidden border-b border-brand-gold">
      <Image src={BANNER_URL} alt="Vegan food banner" fill priority className="object-cover"/>
      <div className="absolute inset-0 bg-brand-berry-dark/50" />
      <div className="relative z-10 flex h-full items-center px-5 md:px-8 xl:px-10">
        <h1 className="font-indie-flower text-6xl font-bold text-white md:text-7xl">
          Explore
        </h1>
      </div>
    </section>
  );
}