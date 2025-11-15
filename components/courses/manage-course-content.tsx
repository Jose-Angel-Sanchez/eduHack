"use client"

import { useEffect, useState } from "react"
import { getFirebaseAuth, getFirestoreDb } from "../../src/infrastructure/firebase/client"
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy, updateDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Trash2 } from "lucide-react"

interface Section {
  id: string
  title: string
  description: string | null
  order_index: number
}

interface SectionItem {
  id: string
  title: string
  content_type: "video" | "audio" | "text" | "quiz" | "exercise"
  content: string
  order_index: number
}

export default function ManageCourseContent({ userId, courseId }: { userId: string; courseId: string }) {
  const auth = getFirebaseAuth()
  const db = getFirestoreDb()
  const { toast } = useToast()
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [newSectionTitle, setNewSectionTitle] = useState("")

  const load = async () => {
    try {
      const q = query(collection(db, "course_sections"), where("course_id", "==", courseId))
      const snap = await getDocs(q)
      const list = snap.docs.map(d => d.data() as any)
      list.sort((a,b) => (a.order_index||0)-(b.order_index||0))
      setSections(list as Section[])
    } catch(e) {
      toast({ variant: "destructive", description: "No se pudieron cargar las secciones." })
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [courseId])

  const addSection = async () => {
    if (!newSectionTitle.trim()) return
    const nextIndex = (sections[sections.length - 1]?.order_index ?? 0) + 1
    try {
      const ref = await addDoc(collection(db, "course_sections"), {
        course_id: courseId,
        title: newSectionTitle.trim(),
        description: null,
        order_index: nextIndex,
        createdAt: Date.now()
      })
      setSections([...sections, { id: ref.id, title: newSectionTitle.trim(), description: null, order_index: nextIndex } as Section])
      setNewSectionTitle("")
      toast({ description: "Sección creada." })
    } catch(e) {
      toast({ variant: "destructive", description: "No se pudo crear la sección." })
    }
  }

  const deleteSection = async (id: string) => {
    try {
      await deleteDoc(doc(db, "course_sections", id))
      setSections(sections.filter((s) => s.id !== id))
      toast({ description: "Sección eliminada." })
    } catch(e) {
      toast({ variant: "destructive", description: "No se pudo eliminar la sección." })
    }
  }

  if (loading) return <div className="p-4 text-gray-500">Cargando...</div>

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} placeholder="Nueva sección" />
        <Button onClick={addSection}><Plus className="h-4 w-4 mr-1" />Agregar</Button>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <SectionEditor key={section.id} section={section} onDelete={() => deleteSection(section.id)} />
        ))}
      </div>
    </div>
  )
}

function SectionEditor({ section, onDelete }: { section: Section; onDelete: () => void }) {
  const auth = getFirebaseAuth()
  const db = getFirestoreDb()
  const { toast } = useToast()
  const [items, setItems] = useState<SectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState(section.title)

  const load = async () => {
    try {
      const q = query(collection(db, "section_content"), where("section_id", "==", section.id))
      const snap = await getDocs(q)
      const list = snap.docs.map(d => ({ ...(d.data() as any) }))
      list.sort((a,b)=> (a.order_index||0)-(b.order_index||0))
      setItems(list as SectionItem[])
    } catch(e) {
      toast({ variant: "destructive", description: "No se pudo cargar el contenido." })
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [section.id])

  const saveTitle = async () => {
    try {
      await updateDoc(doc(db, "course_sections", section.id), { title })
      toast({ description: "Sección actualizada." })
    } catch(e) { toast({ variant: "destructive", description: "No se pudo guardar la sección." }) }
  }

  const addItem = async () => {
    const nextIndex = (items[items.length - 1]?.order_index ?? 0) + 1
    try {
      const ref = await addDoc(collection(db, "section_content"), {
        section_id: section.id,
        title: "Nuevo contenido",
        content_type: "text",
        content: "",
        order_index: nextIndex,
        createdAt: Date.now()
      })
      setItems([...items, { id: ref.id, section_id: section.id, title: "Nuevo contenido", content_type: "text", content: "", order_index: nextIndex }])
    } catch(e){ toast({ variant: "destructive", description: "No se pudo crear el contenido." }) }
  }

  const deleteItem = async (id: string) => {
    try { await deleteDoc(doc(db, "section_content", id)); setItems(items.filter(i=>i.id!==id)) }
    catch(e){ toast({ variant: "destructive", description: "No se pudo eliminar el contenido." }) }
  }

  if (loading) return <div className="p-2 border rounded">Cargando sección...</div>

  return (
    <div className="p-4 border rounded space-y-3">
      <div className="flex items-center gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button onClick={saveTitle}>Guardar</Button>
        <Button variant="destructive" onClick={onDelete}><Trash2 className="h-4 w-4 mr-1" />AAA</Button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} onDelete={() => deleteItem(item.id)} />
        ))}
      </div>

      <Button onClick={addItem}><Plus className="h-4 w-4 mr-1" />Agregar contenido</Button>
    </div>
  )
}

function ItemRow({ item, onDelete }: { item: SectionItem; onDelete: () => void }) {
  const auth = getFirebaseAuth()
  const db = getFirestoreDb()
  const { toast } = useToast()
  const [title, setTitle] = useState(item.title)
  const [content, setContent] = useState(item.content)

  const save = async () => {
    try { await updateDoc(doc(db, "section_content", item.id), { title, content }); toast({ description: "Guardado." }) }
    catch(e){ toast({ variant: "destructive", description: "No se pudo guardar el contenido." }) }
  }

  return (
    <div className="p-2 border rounded">
      <div className="grid grid-cols-2 gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} />
      </div>
      <div className="flex gap-2 mt-2">
        <Button onClick={save}>Guardar</Button>
        <Button variant="destructive" onClick={onDelete}><Trash2 className="h-4 w-4 mr-1" />AAAA</Button>
      </div>
    </div>
  )
}
