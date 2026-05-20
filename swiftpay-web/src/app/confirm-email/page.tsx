import { confirmEmail } from "@/app/actions/auth";
import { ConfirmEmailContent } from "./confirm-email-content";

interface ConfirmEmailPageProps {
  searchParams: Promise<{
    email?: string;
    token?: string;
  }>;
}

export default async function ConfirmEmailPage({
  searchParams,
}: ConfirmEmailPageProps) {
  const { email, token } = await searchParams;

  if (!email || !token) {
    return (
      <ConfirmEmailContent
        status="error"
        message="Link de confirmação inválido. Verifique se o link está correto."
      />
    );
  }

  const response = await confirmEmail({ email, token });

  if (response.error) {
    return (
      <ConfirmEmailContent
        status="error"
        message={response.error.message || "Erro ao confirmar email."}
      />
    );
  }

  return (
    <ConfirmEmailContent
      status="success"
      message="Seu email foi confirmado com sucesso! Agora você pode fazer login na plataforma."
    />
  );
}

