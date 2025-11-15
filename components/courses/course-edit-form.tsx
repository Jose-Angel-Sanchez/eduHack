"use client"

import { useEffect, useState } from "react"
import { getFirestoreDb } from "../../src/infrastructure/firebase/client"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
]

export default function CourseEditForm({ userId, courseId }: { userId: string; courseId: string }) {
  const db = getFirestoreDb()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    difficulty_level: "",
    estimated_duration: 0,
  })
  const [learningObjectivesText, setLearningObjectivesText] = useState<string>("")
  const [durationInput, setDurationInput] = useState<string>("0")

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "courses", courseId))
        if (!snap.exists()) {
          toast({ variant: "destructive", description: "No se pudo cargar el curso." })
        } else {
          const data = snap.data() as any
          const est = typeof data.estimated_duration === "number" && !Number.isNaN(data.estimated_duration) ? data.estimated_duration : 0
          setForm({
            title: data.title || "",
            description: data.description || "",
            category: data.category || "",
            difficulty_level: data.difficulty_level || "",
            estimated_duration: est,
          })
          setDurationInput(String(est))
          const lo: string[] = Array.isArray(data.learning_objectives) ? data.learning_objectives : []
          setLearningObjectivesText(lo.join("\n"))
        }
      } catch(e) {
        toast({ variant: "destructive", description: "No se pudo cargar el curso." })
      }
      setLoading(false)
    }
    load()
  }, [courseId, userId])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    // Validar y convertir la duración
    const minutes = parseInt(durationInput.trim() || "0", 10)
    if (Number.isNaN(minutes) || minutes < 0) {
      toast({ variant: "destructive", description: "Duración inválida." })
      setSaving(false)
      return
    }

    const learning_objectives = learningObjectivesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    try {
      await updateDoc(doc(db, "courses", courseId), {
        title: form.title,
        description: form.description,
        category: form.category,
        difficulty_level: form.difficulty_level,
        estimated_duration: minutes,
        learning_objectives
      })
      toast({ description: "Curso actualizado." })
    } catch(e) {
      toast({ variant: "destructive", description: "No se pudo guardar el curso." })
    }
    setSaving(false)
  }

  if (loading) return <div className="p-4 text-gray-500">Cargando...</div>

  return (
    <form onSubmit={save} className="space-y-4">
      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título" />
      <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción" />
      <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Categoría" />
      <Select value={form.difficulty_level} onValueChange={(v) => setForm({ ...form, difficulty_level: v })}>
        <SelectTrigger>
          <SelectValue placeholder="Nivel" />
        </SelectTrigger>
        <SelectContent>
          {DIFFICULTY_LEVELS.map((l) => (
            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={durationInput}
        onChange={(e) => setDurationInput(e.target.value)}
        placeholder="Duración (min)"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Lo que aprenderás (una por línea)</label>
        <Textarea
          value={learningObjectivesText}
          onChange={(e) => setLearningObjectivesText(e.target.value)}
          placeholder={"Ejemplo:\n- Comprender los fundamentos\n- Construir un proyecto real"}
          rows={4}
        />
      </div>
      <Button disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}</Button>
    </form>
  )
}
