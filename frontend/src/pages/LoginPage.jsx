import React from "react";
import { LoginForm } from "../components/auth/LoginForm";

export const LoginPage = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 font-sans">
      <LoginForm />
    </div>
  );
};
