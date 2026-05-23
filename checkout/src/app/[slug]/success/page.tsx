export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-zinc-100 rounded-full flex items-center justify-center">
          <span className="text-2xl text-black">✓</span>
        </div>
        <h1 className="text-2xl font-bold">Pagamento confirmado!</h1>
        <p className="text-gray-500">Seu pagamento foi processado com sucesso.</p>
      </div>
    </div>
  );
}
