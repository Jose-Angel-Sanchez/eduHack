import { getCurrentUser } from "@/lib/firebase/server";
import { redirect } from "next/navigation";

// Firebase replacement for legacy Supabase super-user check.
export async function checkSuperUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  const email = (user as any).email || "";
  if (!email.includes("@alumno.buap.mx")) {
    redirect("/dashboard");
  }
  return user;
}
