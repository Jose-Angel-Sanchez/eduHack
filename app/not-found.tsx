export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Página no encontrada</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          La página que buscas no existe o fue movida. Verifica la URL o regresa al inicio.
        </p>
        <a
          href="/"
          className="inline-block bg-primary text-white px-5 py-3 rounded-md font-medium hover:bg-primary-hover transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}