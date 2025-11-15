"use client"

import { useState } from "react"
import { getFirebaseAuth } from "../../src/infrastructure/firebase/client"
import { useAuth } from "@/components/providers/auth-provider-enhanced"

const CATEGORIES = [
  "Programación",
  "Diseño", 
  "Marketing",
  "Negocios",
  "Idiomas",
  "Ciencias",
  "Matemáticas",
  "Arte",
  "Música",
  "Fotografía",
  "Salud",
  "Desarrollo personal",
  "Educación",
  "Historia",
  "Tecnología",
  "Finanzas",
  "Cocina",
  "Deportes",
  "Otros",
]

const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
]

export default function CourseFormMinimal({ 
  userId = "user-123",
  onCourseCreated 
}: { 
  userId?: string
  onCourseCreated?: () => void 
}) {
  const { user, loading, refreshSession } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [difficultyLevel, setDifficultyLevel] = useState("")
  const [estimatedDuration, setEstimatedDuration] = useState("")
  const [learningObjectivesText, setLearningObjectivesText] = useState("")
  const [message, setMessage] = useState("")
  
  const authFirebase = getFirebaseAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title || !description || !category || !difficultyLevel || !estimatedDuration) {
      setMessage("Por favor completa todos los campos requeridos.")
      return
    }

    setIsLoading(true)
    setMessage("")
    
    try {
      // Evitar enviar mientras la sesión se está cargando
      if (loading) {
        setMessage("⏳ Verificando sesión, intenta de nuevo en un momento...")
        await refreshSession().catch(() => {})
        return
      }

      // Verificar que el usuario esté autenticado
      if (!user) {
        setMessage("❌ Error: Debes iniciar sesión para crear un curso.")
        return
      }

      // Crear curso vía API Firebase
      const learning_objectives = learningObjectivesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

      const resp = await fetch('/api/v3/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          difficulty_level: difficultyLevel,
          estimated_duration: parseInt(estimatedDuration, 10),
          learning_objectives,
        })
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(`Error al insertar curso: ${err?.error || resp.statusText}`)
      }

      setMessage("✅ Curso creado correctamente!")
      
      // Llamar al callback si existe
      if (onCourseCreated) {
        onCourseCreated()
      }
      
      // Clear form
      setTitle("")
      setDescription("")
      setCategory("")
      setDifficultyLevel("")
      setEstimatedDuration("")
  setLearningObjectivesText("")
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage("")
      }, 3000)
      
    } catch (error: any) {
      const msg = error?.message || (typeof error === "string" ? error : JSON.stringify(error))
      console.error("Error al crear curso:", error)
      setMessage(`❌ Error: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold mb-4">Información Básica del Curso</h2>
        
        {!user && !loading && (
          <div className="p-3 rounded mb-4 bg-yellow-100 text-yellow-800">
            Debes iniciar sesión para crear un curso. 
            <a href="/auth/login" className="underline ml-1">Iniciar sesión</a>
          </div>
        )}

        {message && (
          <div className={`p-3 rounded mb-4 ${
            message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
        
        <div className="space-y-4">
          <input
            placeholder="Título del curso"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <textarea
            placeholder="Descripción del curso"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <div className="grid grid-cols-2 gap-4">
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              required
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecciona una categoría</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select 
              value={difficultyLevel} 
              onChange={(e) => setDifficultyLevel(e.target.value)} 
              required
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Nivel de dificultad</option>
              {DIFFICULTY_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración estimada (minutos)
            </label>
            <input
              type="number"
              placeholder="120"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              required
              min="1"
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lo que aprenderás (una por línea)
            </label>
            <textarea
              placeholder={"Ejemplo:\n- Comprender los fundamentos\n- Construir un proyecto real"}
              value={learningObjectivesText}
              onChange={(e) => setLearningObjectivesText(e.target.value)}
              rows={4}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
      </div>

      <button 
        type="submit" 
        disabled={isLoading || loading}
        className={`w-full p-3 rounded-md text-white font-medium ${
          isLoading || loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500'
        } transition-colors`}
      >
        {loading ? 'Verificando sesión...' : isLoading ? 'Creando curso...' : 'Crear curso'}
      </button>
    </form>
  )
}
