import { LoginForm } from "../login/login-form";
import { authConfig } from "../../../lib/auth/config";
import { currentUser } from "../../../lib/auth/server";
import { redirect } from "next/navigation";
export default async function Page() {
  if (authConfig() && !(await currentUser())) redirect("/forgot-password");
  return <LoginForm mode="update" configured={!!authConfig()} />;
}
