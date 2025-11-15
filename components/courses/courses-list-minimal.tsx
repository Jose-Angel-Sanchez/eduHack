"use client"

import { useMemo, useState, useEffect } from "react"
import { getFirebaseAuth } from "../../src/infrastructure/firebase/client"
import { useAuth } from "@/components/providers/auth-provider-enhanced"
import { isMasterAdminEmail } from "@/lib/utils/isMasterAdmin"

type Course = {
  id: string
  title: string
  description?: string
  category: string
  difficulty_level: string
  estimated_duration: number
  is_active: boolean
  created_at: string
  created_by: string | null
  learning_objectives?: string[]
}

export default function CoursesListMinimal({ userId }: { userId: string }) {
  const { user } = useAuth()
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [hasOrphans, setHasOrphans] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{
    title: string
    description: string
    category: string
    difficulty_level: string
    estimated_duration: number
    learning_objectives_text: string
  } | null>(null)
  const [aiGenerating, setAiGenerating] = useState<boolean>(false)
  const authFirebase = getFirebaseAuth()
  const isMaster = useMemo(() => isMasterAdminEmail(user?.email), [user?.email])
  const [ownerFilter, setOwnerFilter] = useState<"mine" | "all">("mine")
  const [search, setSearch] = useState("")

  const fetchCourses = async () => {
    try {
      if (!user) throw new Error("Usuario no autenticado")
      const resp = await fetch('/api/courses/mine')
      if (!resp.ok) throw new Error('No se pudieron cargar los cursos')
      const json = await resp.json()
      const list = (json?.courses || []) as Course[]
      setAllCourses(list)
      // default view: mine
      const mine = list.filter(c => c.created_by === user.id)
      setCourses(mine)
      setHasOrphans(isMaster && list.some((c: any) => c.created_by === null))
    } catch (error) {
      console.error("Error fetching courses:", error)
      setMessage("Error al cargar los cursos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchCourses()
    }
  }, [user, isMaster]) // Dependencia del usuario del contexto

  // Apply filters and search when inputs change
  useEffect(() => {
    if (!user) return
    const base = ownerFilter === 'all' && isMaster ? allCourses : allCourses.filter(c => c.created_by === user.id)
    const term = search.trim().toLowerCase()
    const filtered = term
      ? base.filter((c) =>
          (c.title || '').toLowerCase().includes(term) ||
          (c.category || '').toLowerCase().includes(term) ||
          (c.difficulty_level || '').toLowerCase().includes(term) ||
          (c.created_by || '').toLowerCase().includes(term)
        )
      : base
    setCourses(filtered)
  }, [ownerFilter, search, allCourses, isMaster, user])

  const claimOrphans = async () => {
    try {
      const resp = await fetch('/api/courses/orphans/claim', { method: 'POST' })
      if (!resp.ok) throw new Error('No se pudieron reclamar los cursos huérfanos')
      await fetchCourses()
      setMessage('✅ Cursos reclamados correctamente')
      setTimeout(() => setMessage(''), 3000)
    } catch (e) {
      console.error(e)
      setMessage('❌ Error al reclamar cursos huérfanos')
    }
  }

  const startEdit = (course: Course) => {
    setEditingId(course.id)
    setEditValues({
      title: course.title,
  description: course.description || "",
      category: course.category,
      difficulty_level: course.difficulty_level,
      estimated_duration: course.estimated_duration,
  learning_objectives_text: Array.isArray(course.learning_objectives) ? course.learning_objectives.join("\n") : "",
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues(null)
  }

  const saveEdit = async (id: string) => {
    if (!editValues) return
    try {
      const learning_objectives = editValues.learning_objectives_text
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

      const resp = await fetch(`/api/courses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editValues.title,
          description: editValues.description,
          category: editValues.category,
          difficulty_level: editValues.difficulty_level,
          estimated_duration: Number.parseInt(String(editValues.estimated_duration), 10),
          learning_objectives,
        })
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err?.error || resp.statusText)
      }

      setCourses(prev => prev.map(c => (
        c.id === id
          ? {
              ...c,
              title: editValues.title,
              description: editValues.description,
              category: editValues.category,
              difficulty_level: editValues.difficulty_level,
              estimated_duration: editValues.estimated_duration,
              learning_objectives,
            } as Course
          : c
      )))
      setMessage("✅ Curso actualizado correctamente")
      setTimeout(() => setMessage(""), 3000)
      cancelEdit()
    } catch (error) {
      console.error("Error al actualizar:", error)
      setMessage("❌ Error al actualizar el curso")
    }
  }

  const generateObjectivesAI = async () => {
    if (!editValues) return
    if (!editValues.title || editValues.title.trim().length < 3) {
      setMessage("❌ Agrega un título del curso para generar objetivos con IA")
      setTimeout(() => setMessage(""), 3000)
      return
    }
    try {
      setAiGenerating(true)
      const prompt = `Genera entre 5 y 8 objetivos de aprendizaje claros, concisos y accionables para un curso titulado "${editValues.title}".${editValues.description ? `\nDescripción del curso: ${editValues.description}` : ''}\nResponde solo con una lista en español, una línea por objetivo, sin numeración y sin texto adicional.`
      const resp = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err?.error || 'No se pudo generar contenido con IA')
      }
      const json = await resp.json()
      const raw: string = json?.response || ''
      const cleaned = raw
        .replace(/^\s*Objetivos?:?/i, '')
        .replace(/^[\s\-•\*]+/gm, '')
        .trim()
      setEditValues(v => ({ ...(v as any), learning_objectives_text: cleaned }))
      setMessage('✅ Objetivos generados; revisa y guarda los cambios')
      setTimeout(() => setMessage(''), 3000)
    } catch (e: any) {
      console.error(e)
      setMessage(`❌ Error al generar con IA: ${e?.message || e}`)
      setTimeout(() => setMessage(''), 4000)
    } finally {
      setAiGenerating(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el curso "${title}"? Esta acción no se puede deshacer.`)) return

    try {
      const resp = await fetch(`/api/courses/${id}`, { method: 'DELETE' })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err?.error || resp.statusText)
      }

      setCourses(courses.filter((c) => c.id !== id))
      setMessage("✅ Curso eliminado correctamente")
      
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error al eliminar:", error)
      setMessage("❌ Error al eliminar el curso")
    }
  }

  const getDifficultyLabel = (level: string) => {
    const labels: { [key: string]: string } = {
      beginner: "Principiante",
      intermediate: "Intermedio", 
      advanced: "Avanzado",
    }
    return labels[level] || level
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (loading) {
    return (
      <div className="p-4 border rounded">
        <p>Cargando cursos...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-semibold">{isMaster ? 'Cursos (Administrador)' : 'Mis Cursos'}</h3>
        <div className="flex gap-2 items-center">
          {isMaster && (
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value as any)}
              className="p-2 border rounded"
              aria-label="Filtro de propietario"
            >
              <option value="mine">Mis cursos</option>
              <option value="all">Todos</option>
            </select>
          )}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isMaster ? "Buscar por título, categoría o creador" : "Buscar por título o categoría"}
            className="p-2 border rounded w-56"
            aria-label="Buscar cursos"
          />
        </div>
      </div>
      
      {message && (
        <div className={`p-3 rounded mb-4 ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

  {hasOrphans && isMaster && (
        <div className="p-3 rounded mb-4 bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-between">
          <span>Hay cursos existentes sin propietario. Puedes reclamarlos para administrarlos.</span>
          <button onClick={claimOrphans} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Reclamar</button>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-gray-500 mb-2">Aún no has creado ningún curso</p>
          <p className="text-sm text-gray-400">Crea tu primer curso usando el formulario de arriba</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {editingId === course.id ? (
                    <div className="space-y-3">
                      <input
                        className="w-full p-2 border rounded"
                        value={editValues?.title || ''}
                        onChange={(e) => setEditValues(v => ({ ...(v as any), title: e.target.value }))}
                        placeholder="Título"
                      />
                      <textarea
                        className="w-full p-2 border rounded"
                        value={editValues?.description || ''}
                        onChange={(e) => setEditValues(v => ({ ...(v as any), description: e.target.value }))}
                        rows={3}
                        placeholder="Descripción"
                      />
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Lo que aprenderás (una por línea)</label>
                        <textarea
                          className="w-full p-2 border rounded"
                          value={editValues?.learning_objectives_text || ''}
                          onChange={(e) => setEditValues(v => ({ ...(v as any), learning_objectives_text: e.target.value }))}
                          rows={3}
                          placeholder={"- Comprender fundamentos\n- Construir un proyecto real"}
                        />
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={generateObjectivesAI}
                            disabled={aiGenerating}
                            className="px-3 py-1 text-sm bg-primary text-white rounded hover:opacity-90 disabled:opacity-50"
                          >
                            {aiGenerating ? 'Generando…' : 'Autocompletar con IA'}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          className="p-2 border rounded"
                          value={editValues?.category || ''}
                          onChange={(e) => setEditValues(v => ({ ...(v as any), category: e.target.value }))}
                          placeholder="Categoría"
                        />
                        <select
                          className="p-2 border rounded"
                          value={editValues?.difficulty_level || ''}
                          onChange={(e) => setEditValues(v => ({ ...(v as any), difficulty_level: e.target.value }))}
                        >
                          <option value="beginner">Principiante</option>
                          <option value="intermediate">Intermedio</option>
                          <option value="advanced">Avanzado</option>
                        </select>
                        <input
                          type="number"
                          className="p-2 border rounded"
                          value={editValues?.estimated_duration || 0}
                          onChange={(e) => setEditValues(v => ({ ...(v as any), estimated_duration: Number(e.target.value) }))}
                          placeholder="Duración (min)"
                        />
                      </div>
                    </div>
                  ) : (
                    <h4 className="font-medium text-lg text-gray-900">{course.title}</h4>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {course.category}
                    </span>
                    <span>{getDifficultyLabel(course.difficulty_level)}</span>
                    <span>{formatDuration(course.estimated_duration)}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      course.is_active ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {course.is_active ? "Activo" : "Borrador"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Creado: {new Date(course.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex gap-2 ml-4">
                  {editingId === course.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(course.id)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        💾 Guardar
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 text-sm bg-blue-400 text-white rounded hover:bg-blue-300 transition-colors"
                      >
                        ❌ Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(course)}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        ✏️ Editar
                      </button>
                      {/* Contenido action removed to keep inline management */}
                      <button
                    onClick={() => handleDelete(course.id, course.title)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    🗑️ Eliminar
                  </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
