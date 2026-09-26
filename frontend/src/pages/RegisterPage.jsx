import React from "react";
import { RegisterForm } from "../components/auth/RegisterForm";

export const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 font-sans">
      <RegisterForm />
    </div>
  );
};
