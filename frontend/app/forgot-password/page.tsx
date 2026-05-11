import type { Metadata } from "next";
import { ForgotPasswordPage } from "@/components/auth/ForgotPasswordPage";

export const metadata: Metadata = {
  title: "Forgot password - Cayeshni",
  description: "Request a password reset link for your Cayeshni account.",
};

export default function ForgotPasswordRoute() {
  return <ForgotPasswordPage />;
}
