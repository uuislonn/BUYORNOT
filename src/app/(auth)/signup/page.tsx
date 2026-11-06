import { LoginForm } from "../login/login-form";
import { authConfig, kakaoConfigured } from "../../../lib/auth/config";
export default async function Page() {
  return (
    <LoginForm
      mode="signup"
      configured={!!authConfig()}
      kakaoEnabled={kakaoConfigured()}
    />
  );
}
