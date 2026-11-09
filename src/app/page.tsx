import { redirect } from "next/navigation";

/** Middleware usually redirects `/` → locale; this is a fallback. */
export default function RootPage() {
  redirect("/en");
}
