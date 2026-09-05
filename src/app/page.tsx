import { redirect } from "next/navigation";
import { getRoleFromCookies } from "@/lib/session";

export default async function HomePage() {
  const role = await getRoleFromCookies();
  if (role === "admin" || role === "super") redirect("/hub");
  redirect("/login");
}
