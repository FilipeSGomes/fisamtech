import { getTranslations } from "next-intl/server";

export async function PendingNotice() {
  const t = await getTranslations("legal");
  const items = t.raw("pendingItems") as string[];
  return (
    <aside className="pending-note">
      <h2>{t("pendingTitle")}</h2>
      <p>{t("pendingLead")}</p>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}
