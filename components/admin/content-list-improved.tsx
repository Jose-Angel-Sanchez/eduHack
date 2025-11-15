"use client"

import { useState, useEffect } from "react"
// Migrated from Supabase: now relies solely on server API endpoints backed by Firebase/Firestore
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Edit2, Trash2, Eye, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"

type Content = {
  id: string
  title: string
  description: string
  type: string
  file_url: string | null
  file_path: string | null
  transcription: string | null
  created_at: string
  created_by: string
}

export default function ContentList({ userId }: { userId: string }) {
  const [contents, setContents] = useState<Content[]>([])
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()
  // Supabase removido: operaciones delegadas a endpoints /api/content/*

  const fetchContents = async () => {
    setIsLoading(true)
    try {
      console.log("Fetching contents for userId:", userId) // Debug log

      // Prefer server API to avoid RLS hiccups and ensure consistent filtering
      const resp = await fetch(`/api/content/list`, { cache: "no-store" })
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "")
        throw new Error(txt || `HTTP ${resp.status}`)
      }
      const json = await resp.json()
      setContents(json.data || [])
    } catch (error) {
      console.error("Error al cargar contenido:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el contenido. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchContents()
  }, [userId])

  // Recargar contenido cuando se cierra el diálogo
  useEffect(() => {
    if (!isDialogOpen) {
      fetchContents()
    }
  }, [isDialogOpen])

  // Escuchar eventos globales para refrescar la lista cuando otro componente crea/edita/borra
  useEffect(() => {
    const onChanged = () => fetchContents()
    window.addEventListener("content:changed", onChanged)
    return () => window.removeEventListener("content:changed", onChanged)
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este contenido?")) return

    setIsDeleting(id)
    try {
      const contentToDelete = contents.find((c) => c.id === id)
      if (!contentToDelete) return

      // Delete via API (validates ownership server-side)
      const resp = await fetch("/api/content/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "")
        throw new Error(txt || `HTTP ${resp.status}`)
      }

  // Notificar a otras vistas que el contenido cambió
  try { window.dispatchEvent(new CustomEvent("content:changed", { detail: { type: "deleted", id } })) } catch {}

      toast({
        title: "Contenido eliminado",
        description: "El contenido se ha eliminado correctamente.",
      })

      // Actualizar la lista
      await fetchContents()
    } catch (error) {
      console.error("Error al eliminar:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el contenido. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingContent) return

    setIsUpdating(true)
    try {
      // Update via API
      const resp = await fetch("/api/content/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingContent.id,
          title: editingContent.title,
          description: editingContent.description,
          transcription: editingContent.transcription,
        }),
      })
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "")
        throw new Error(txt || `HTTP ${resp.status}`)
      }

      toast({
        title: "Contenido actualizado",
        description: "El contenido se ha actualizado correctamente.",
      })

      setIsDialogOpen(false)
  // Notificar para refrescar otras vistas
  try { window.dispatchEvent(new CustomEvent("content:changed", { detail: { type: "updated", id: editingContent.id } })) } catch {}
      await fetchContents() // Recargar lista
    } catch (error) {
      console.error("Error al actualizar:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el contenido. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading && contents.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contents.map((content) => (
            <TableRow key={content.id}>
              <TableCell>{content.title}</TableCell>
              <TableCell>{content.type}</TableCell>
              <TableCell>
                {new Date(content.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right space-x-2">
                {content.file_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(content.file_url!, "_blank")}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingContent(content)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  {editingContent && (
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Contenido</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdate} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Título</Label>
                          <Input
                            id="title"
                            value={editingContent.title}
                            onChange={(e) =>
                              setEditingContent({ ...editingContent, title: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Descripción</Label>
                          <Textarea
                            id="description"
                            value={editingContent.description}
                            onChange={(e) =>
                              setEditingContent({ ...editingContent, description: e.target.value })
                            }
                            rows={4}
                          />
                        </div>
                        {editingContent.transcription && (
                          <div className="space-y-2">
                            <Label htmlFor="transcription">Transcripción</Label>
                            <Textarea
                              id="transcription"
                              value={editingContent.transcription}
                              onChange={(e) =>
                                setEditingContent({ ...editingContent, transcription: e.target.value })
                              }
                              rows={6}
                            />
                          </div>
                        )}
                        <DialogFooter>
                          <Button
                            type="submit"
                            disabled={isUpdating}
                          >
                            {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Guardar Cambios
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  )}
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(content.id)}
                  disabled={isDeleting === content.id}
                >
                  {isDeleting === content.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {contents.length === 0 && !isLoading && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                No hay contenido disponible
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
