import { setRequestLocale, getTranslations } from "next-intl/server";
import { verifyBookingToken, getCalendarUrl } from "@/lib/booking/token";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("book");

  const payload = token ? verifyBookingToken(token) : null;
  if (!payload) {
    return (
      <section className="section">
        <div className="shell">
          <h1>{t("title")}</h1>
          <p className="lead">{t("invalid")}</p>
        </div>
      </section>
    );
  }

  const calendarUrl = getCalendarUrl();

  return (
    <section className="section">
      <div className="shell">
        <h1>{t("title")}</h1>
        <p className="lead">{t("lead")}</p>
        <p style={{ marginTop: 24 }}>
          <a
            className="btn btn-primary"
            href={calendarUrl}
            target="_blank"
            rel="noreferrer"
          >
            {t("open")}
          </a>
        </p>
        <iframe
          title="Google Appointment Scheduling"
          src={calendarUrl}
          style={{
            width: "100%",
            minHeight: 720,
            marginTop: 28,
            border: "1px solid #e0e0e0",
            borderRadius: 16,
          }}
        />
      </div>
    </section>
  );
}
