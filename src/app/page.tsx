import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const session = cookieStore.get("ams_session");
  
  // If user is authenticated (has session cookie), redirect to dashboard
  if (session?.value) {
    redirect("/dashboard");
  }
  
  // If no session, redirect to login
  // (middleware will also catch this, but being explicit)
  redirect("/login");
}