"use client"

import { useState, useEffect } from "react"
// Supabase eliminado: se usará API server-side para listar/actualizar/eliminar
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Edit2, Trash2, Eye } from "lucide-react"

type Content = {
  id: string
  title: string
  description: string
  type: string
  file_url: string | null
  file_path: string | null
  transcription: string | null
  created_at: string
}

export default function ContentList({ userId }: { userId: string }) {
  const [contents, setContents] = useState<Content[]>([])
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()
  // Eliminado supabase client

  const fetchContents = async () => {
    try {
      const resp = await fetch(`/api/content/list?owner=${encodeURIComponent(userId)}`, { cache: 'no-store' })
      if (!resp.ok) throw new Error(await resp.text().catch(()=>resp.statusText))
      const json = await resp.json().catch(()=>({}))
      setContents(json.data || [])
    } catch (e:any) {
      toast({ title: 'Error', description: 'No se pudo cargar el contenido.', variant: 'destructive' })
    }
  }

  useEffect(() => {
    fetchContents()
  }, [userId])

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este contenido?")) return

    const contentToDelete = contents.find((c) => c.id === id)
    
    try {
      const resp = await fetch('/api/content/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      if (!resp.ok) throw new Error(await resp.text().catch(()=>resp.statusText))
      toast({ title: 'Contenido eliminado', description: 'El contenido se ha eliminado correctamente.' })
      setContents(contents.filter(c=>c.id!==id))
    } catch (error) {
      console.error('Error al eliminar:', error)
      toast({ title: 'Error', description: 'No se pudo eliminar el contenido.', variant: 'destructive' })
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingContent) return

    try {
      const resp = await fetch('/api/content/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingContent.id, title: editingContent.title, description: editingContent.description, transcription: editingContent.transcription }) })
      if (!resp.ok) throw new Error(await resp.text().catch(()=>resp.statusText))
      toast({ title: 'Contenido actualizado', description: 'El contenido se ha actualizado correctamente.' })
      setContents(contents.map(c=> c.id===editingContent.id ? editingContent : c))
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error al actualizar:', error)
      toast({ title: 'Error', description: 'No se pudo actualizar el contenido.', variant: 'destructive' })
    }
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
                      <form onSubmit={handleUpdate} className="space-y-4">
                        <Input
                          value={editingContent.title}
                          onChange={(e) =>
                            setEditingContent({
                              ...editingContent,
                              title: e.target.value,
                            })
                          }
                          placeholder="Título"
                        />
                        <Textarea
                          value={editingContent.description}
                          onChange={(e) =>
                            setEditingContent({
                              ...editingContent,
                              description: e.target.value,
                            })
                          }
                          placeholder="Descripción"
                        />
                        {(editingContent.type === "video" ||
                          editingContent.type === "audio") && (
                          <Textarea
                            value={editingContent.transcription || ""}
                            onChange={(e) =>
                              setEditingContent({
                                ...editingContent,
                                transcription: e.target.value,
                              })
                            }
                            placeholder="Transcripción"
                          />
                        )}
                        <Button type="submit">Guardar Cambios</Button>
                      </form>
                    </DialogContent>
                  )}
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(content.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
