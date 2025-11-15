import LoginForm from "@/components/auth/login-form-firebase";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <LoginForm />
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center bg-primary text-white p-12">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold mb-6">¡Bienvenido de vuelta!</h1>
          <p className="text-xl mb-8 opacity-90">
            Continúa tu viaje de aprendizaje personalizado con IA
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Rutas de aprendizaje adaptativas</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Certificados digitales</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Accesibilidad completa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
