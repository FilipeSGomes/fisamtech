import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { CONTACT } from "@/lib/config";

export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <h3>{CONTACT.company}</h3>
          <p>CNPJ {CONTACT.cnpj}</p>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </div>
        <div>
          <h3>{t("company")}</h3>
          <Link href="/cases">Cases</Link>
          <Link href="/qualify">Technical Discovery</Link>
          <Link href={locale === "pt-br" ? "/parceiros" : "/partners"}>
            {t("partners")}
          </Link>
        </div>
        <div>
          <h3>{t("legal")}</h3>
          <Link href="/privacy">{t("privacy")}</Link>
          <Link href="/terms">{t("terms")}</Link>
          <Link href="/cookies">{t("cookies")}</Link>
        </div>
        <div>
          <h3>{t("contact")}</h3>
          <p>
            © {year} FISAM TECH. {t("rights")}
          </p>
          <p className="muted" style={{ marginTop: 12, fontSize: "0.8rem" }}>
            {t("note")}
          </p>
        </div>
      </div>
    </footer>
  );
}
