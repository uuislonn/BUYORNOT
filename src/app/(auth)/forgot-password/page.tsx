import { LoginForm } from "../login/login-form";
import { authConfig } from "../../../lib/auth/config";
export default async function Page() {
  return <LoginForm mode="reset" configured={!!authConfig()} />;
}
