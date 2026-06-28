"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Início", path: "/" },
  { label: "Publicações", path: "/posts" },
  { label: "Sobre Mim", path: "/aboutMe" },
];

const Navbar = () => {
  const pathname = usePathname();

  // As páginas são estáticas/ISR. No render do servidor o usePathname vem a null,
  // por isso TODOS os links saíam inativos no HTML — e o React, na hidratação,
  // não corrige diferenças de className. Resultado: o realce nunca aparecia em
  // produção. Calculamos o ativo só depois de montar no cliente, a partir do URL
  // real, garantindo que reflete sempre a página atual.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl 2xl:max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6 z-90">

        {/* Logo */}
          <Link href="/" className="">
            <Image src="/logo.svg" className="object-cover" alt="Entre Livros" width={125} height={200} />
          </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              mounted &&
              !!pathname &&
              (link.path === "/"
                ? pathname === "/"
                : pathname === link.path || pathname.startsWith(`${link.path}/`));

            return (
              <Link
                key={link.path}
                href={link.path}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-4 py-1.5 font-body text-sm font-medium transition-colors
                  ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                `}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
