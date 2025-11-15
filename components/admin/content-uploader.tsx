"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Supabase eliminado: subida y registro de contenido vía endpoints /api/content/*
import { useToast } from "../ui/use-toast"
import { Loader2, Upload } from "lucide-react"

type ContentType = "video" | "audio" | "image" | "blog"

interface Props {
  userId: string
  defaultCourseIds?: string[]
  lockToCourses?: boolean
  initialCourses?: { id: string; title: string }[]
}

export default function ContentUploader({ userId, defaultCourseIds = [], lockToCourses = false, initialCourses }: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [contentType, setContentType] = useState<ContentType>("blog")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [transcription, setTranscription] = useState("")
  const [duration, setDuration] = useState<string>("")
  const [courses, setCourses] = useState<{ id: string; title: string }[]>(initialCourses || [])
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(defaultCourseIds)
  const { toast } = useToast()
  // Supabase client removido

  // Extrae un mensaje útil desde diferentes formas de error
  const getErrorMessage = (err: unknown): string => {
    if (!err) return "Error desconocido"
    if (typeof err === "string") return err
    if (err instanceof Error) return err.message
    try {
      const anyErr = err as any
      if (anyErr?.message) return String(anyErr.message)
      if (anyErr?.error_description) return String(anyErr.error_description)
      if (anyErr?.statusText) return String(anyErr.statusText)
      if (anyErr?.error) return String(anyErr.error)
      return JSON.stringify(anyErr)
    } catch {
      return String(err)
    }
  }

  // Load courses created by this user if not provided by server
  useEffect(() => {
    if (initialCourses && initialCourses.length > 0) return
    const loadCourses = async () => {
      try {
        const resp = await fetch('/api/v3/courses', { cache: 'no-store' })
        if (!resp.ok) return
        const json = await resp.json().catch(()=>({}))
        const list = (json?.courses || []) as any[]
        const mine = list.filter(c=> c.createdBy === userId || c.created_by === userId)
        setCourses(mine.map(c => ({ id: c.id, title: c.title })))
      } catch {}
    }
    loadCourses()
  }, [userId, initialCourses?.length])

  // Keep courses in sync when server-provided list changes
  useEffect(() => {
    if (initialCourses && initialCourses.length > 0) {
      setCourses(initialCourses)
    }
  }, [initialCourses?.map(c => c.id).join(',')])

  // Keep selectedCourseIds in sync if defaultCourseIds prop changes
  useEffect(() => {
    if (defaultCourseIds && defaultCourseIds.length > 0) {
      setSelectedCourseIds(defaultCourseIds)
    }
  }, [defaultCourseIds?.join(',')])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFile(file)
    
    // Si es audio o video, iniciar transcripción automática
    if ((contentType === "audio" || contentType === "video") && file) {
      try {
        const formData = new FormData()
        formData.append("file", file)
        
        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        })
        if (!response.ok) {
          const text = await response.text().catch(() => "")
          throw new Error(text || `Transcripción no disponible (HTTP ${response.status})`)
        }
        const data = await response.json().catch(() => ({} as any))
        if (data?.transcription) {
          setTranscription(data.transcription)
        }
      } catch (error) {
        console.error("Error en la transcripción:", error)
        toast({
          title: "Error en la transcripción",
          description: getErrorMessage(error),
          variant: "destructive",
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || (!file && contentType !== "blog")) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos necesarios.",
        variant: "destructive",
      })
      return
    }

    // Validate duration (optional) and course selection (required)
    const minutes = duration.trim() ? parseInt(duration.trim(), 10) : null
    if (duration.trim() && (Number.isNaN(minutes as number) || (minutes as number) < 0)) {
      toast({ title: "Duración inválida", description: "Ingresa minutos válidos.", variant: "destructive" })
      return
    }
    if (selectedCourseIds.length === 0) {
      toast({ title: "Selecciona curso(s)", description: "Elige al menos un curso para asociar el contenido.", variant: "destructive" })
      return
    }

    setIsUploading(true)
    try {
  let phase: "upload" | "insert" | "none" = "none"
  // For private buckets we won't persist a temporary signed URL in DB
  let fileUrl: string | null = null
      let filePathSaved = ""

      if (file) {
        phase = "upload"
        // Use server API to bypass Storage RLS safely
        const form = new FormData()
        form.append("file", file)
        form.append("type", contentType)
        const upResp = await fetch("/api/content/upload", { method: "POST", body: form })
        if (!upResp.ok) {
          const txt = await upResp.text().catch(() => "")
          throw new Error(`Error al subir al Storage: ${txt || upResp.statusText}`)
        }
  const up = await upResp.json().catch(() => ({} as any))
  filePathSaved = up.file_path || ""
  // signed_url is returned for immediate preview use if needed, but we don't persist it
      }

      phase = "insert"
      const apiResp = await fetch('/api/content/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          type: contentType,
          file_url: fileUrl,
          file_path: filePathSaved || null,
          transcription: transcription || null,
          duration: minutes,
          course_ids: selectedCourseIds,
        })
      })
      if (!apiResp.ok) {
        const errText = await apiResp.text().catch(() => "")
        throw new Error(`Error al registrar en la BD: ${errText || apiResp.statusText}`)
      }

      toast({
        title: "Contenido subido",
        description: "El contenido se ha subido correctamente.",
      })

      // Notificar a otras vistas que el contenido cambió
      try {
        window.dispatchEvent(new CustomEvent("content:changed", { detail: { type: "created" } }))
      } catch {}

  // Limpiar formulario
      setTitle("")
      setDescription("")
      setFile(null)
      setTranscription("")
  setDuration("")
  setSelectedCourseIds(lockToCourses && defaultCourseIds.length > 0 ? defaultCourseIds : [])
      
    } catch (error) {
      const message = getErrorMessage(error)
      console.error("Error al subir contenido:", error)
      toast({
        title: "Error al subir contenido",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Select
          value={contentType}
          onValueChange={(value: ContentType) => setContentType(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tipo de contenido" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blog">Blog</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="image">Imagen</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <Input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder="Duración (minutos) — opcional"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        {contentType !== "blog" && !lockToCourses && (
          <Input
            type="file"
            onChange={handleFileChange}
            accept={
              contentType === "video"
                ? "video/*"
                : contentType === "audio"
                ? "audio/*"
                : "image/*"
            }
            required
          />
        )}
        {contentType !== "blog" && lockToCourses && (
          <Input
            type="file"
            onChange={handleFileChange}
            accept={contentType === "video" ? "video/*" : contentType === "audio" ? "audio/*" : "image/*"}
            required
          />
        )}

        {(contentType === "video" || contentType === "audio") && transcription && (
          <Textarea
            placeholder="Transcripción"
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            className="h-32"
          />
        )}

        {/* Course multi-select dropdown (always available) */}
        {!lockToCourses ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Asignar a curso(s)</label>
            <select
              multiple
              value={selectedCourseIds}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions).map((o) => o.value)
                setSelectedCourseIds(options)
              }}
              className="w-full p-2 border rounded h-40"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            {courses.length === 0 && (
              <div className="text-xs text-gray-500 mt-1">No tienes cursos creados todavía.</div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            Asociando a {selectedCourseIds.length} curso(s) seleccionado(s).
          </div>
        )}
      </div>

      <Button disabled={isUploading} type="submit" className="w-full">
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Subir Contenido
          </>
        )}
      </Button>
    </form>
  )
}
