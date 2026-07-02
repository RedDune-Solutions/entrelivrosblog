import heroImage from "../../../public/hero-books.jpg";
import logo from "../../../public/logo-horizontal.svg";
import Image from "next/image";

// Server component: content ships visible in the static HTML (no
// opacity:0-until-hydration). The fade is pure CSS (see globals.css).
const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt="Estante com livros — Entre Livros, blog de recomendações literárias"
          className="h-full w-full object-cover"
          priority
          placeholder="blur"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-foreground/60" />
      </div>
      <div className="relative flex min-h-[420px] items-center justify-center px-6 py-20">
        <div className="animate-fade-up max-w-2xl text-center">
          {/* The page's single <h1> lives in page.tsx (sr-only). This logo is
              decorative branding, so it's not a heading. */}
          <Image
            src={logo}
            alt="Entre Livros"
            className="mx-auto brightness-0 invert drop-shadow-2xl"
            width={300}
            height={300}
          />
          <p className="mt-4 font-body text-lg text-primary-foreground/80 text-justify">
            Recomendações e opiniões de livros para apaixonados por leitura. <br />Descobre novas histórias e autores através das minhas leituras.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
