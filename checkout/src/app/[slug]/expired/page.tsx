export default function ExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-2xl text-gray-400">!</span>
        </div>
        <h1 className="text-2xl font-bold">Link expirado</h1>
        <p className="text-gray-500">Este link de pagamento não está mais disponível.</p>
      </div>
    </div>
  );
}
