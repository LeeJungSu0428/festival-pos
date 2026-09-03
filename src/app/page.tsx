import { redirect } from "next/navigation";
import { getRoleFromCookies } from "@/lib/session";

export default async function HomePage() {
  const role = await getRoleFromCookies();
  if (role === "super") redirect("/super-admin");
  if (role === "admin") redirect("/pos");
  redirect("/login");
}
