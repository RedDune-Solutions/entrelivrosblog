import type { Metadata } from "next";
import Navbar from "@/app/layout/NavBar";
import Footer from "@/app/layout/Footer";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como o Entre Livros trata os teus dados pessoais: finalidade, base legal, subprocessadores e os teus direitos ao abrigo do RGPD.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main
        id="main-content"
        className="mx-auto max-w-3xl px-4 py-12 sm:px-6 font-body text-foreground/90"
      >
        <h1 className="font-display text-4xl font-bold text-foreground">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: julho de 2026
        </p>

        <section className="mt-8 space-y-3">
          <h2 className="font-display text-xl font-semibold text-primary">
            Responsável pelo tratamento
          </h2>
          <p>
            O Entre Livros (<span className="font-medium">entrelivrosblog.pt</span>) é um
            blog pessoal de recomendações literárias da Tatiana Felício. Para questões
            sobre os teus dados, contacta{" "}
            <a
              href="mailto:tatilopesfelicio@hotmail.com"
              className="text-primary hover:underline"
            >
              tatilopesfelicio@hotmail.com
            </a>
            .
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-display text-xl font-semibold text-primary">
            Que dados tratamos e porquê
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium">Newsletter:</span> guardamos o teu endereço
              de email e a data em que deste o consentimento, com a única finalidade de
              te avisar quando há uma nova review ou publicação. Base legal:{" "}
              <span className="font-medium">consentimento</span> (art. 6.º/1/a do RGPD),
              que podes retirar a qualquer momento.
            </li>
            <li>
              <span className="font-medium">Comentários:</span> o texto que escreves fica
              associado a um identificador anónimo gerado no teu navegador. Não pedimos
              nome nem email para comentar.
            </li>
            <li>
              <span className="font-medium">Sugestões:</span> são anónimas — guardamos
              apenas o texto que envias.
            </li>
            <li>
              <span className="font-medium">Estatísticas de utilização:</span> usamos o
              Vercel Web Analytics e Speed Insights, que medem visitas de forma agregada
              e <span className="font-medium">sem cookies</span> e sem te identificar
              pessoalmente.
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-display text-xl font-semibold text-primary">
            Conservação
          </h2>
          <p>
            Mantemos o teu email na newsletter enquanto estiveres subscrito. Quando
            cancelas (ligação em todos os emails ou o teu pedido direto), o registo é
            apagado.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-display text-xl font-semibold text-primary">
            Subprocessadores
          </h2>
          <p>
            Para funcionar, o site recorre a fornecedores que podem tratar dados por
            nossa conta:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium">Supabase</span> — base de dados (emails da
              newsletter, comentários, sugestões).
            </li>
            <li>
              <span className="font-medium">Vercel</span> — alojamento do site e
              estatísticas de utilização.
            </li>
            <li>
              <span className="font-medium">Amen / securemail.pro</span> — envio dos
              emails da newsletter (SMTP).
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-display text-xl font-semibold text-primary">
            Os teus direitos
          </h2>
          <p>
            Tens direito a aceder, corrigir, apagar e à portabilidade dos teus dados, e a
            retirar o consentimento a qualquer momento. Para o exercer, escreve para o
            contacto acima. Tens ainda o direito de apresentar reclamação à{" "}
            <a
              href="https://www.cnpd.pt"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              CNPD
            </a>
            .
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
