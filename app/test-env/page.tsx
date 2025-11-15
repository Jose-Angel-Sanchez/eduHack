export default function TestEnvPage() {
  // Estas variables deben estar disponibles en el servidor
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">
          Test de Variables de Entorno
        </h1>

        <div className="space-y-3">
          <div className="border-b pb-2">
            <p className="text-sm text-gray-500">FIREBASE_PROJECT_ID</p>
            <p className="font-mono text-sm">
              {projectId ? `✅ ${projectId}` : "❌ No definida"}
            </p>
          </div>

          <div className="border-b pb-2">
            <p className="text-sm text-gray-500">FIREBASE_CLIENT_EMAIL</p>
            <p className="font-mono text-sm">
              {clientEmail ? `✅ ${clientEmail}` : "❌ No definida"}
            </p>
          </div>

          <div className="border-b pb-2">
            <p className="text-sm text-gray-500">FIREBASE_PRIVATE_KEY</p>
            <p className="font-mono text-sm">
              {hasPrivateKey ? "✅ Definida" : "❌ No definida"}
            </p>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded">
            <p className="text-sm">
              {projectId && clientEmail && hasPrivateKey ? (
                <span className="text-green-600 font-medium">
                  ✅ Todas las variables están configuradas correctamente
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  ❌ Faltan variables de entorno. Asegúrate de que .env.local
                  existe y reinicia el servidor.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
