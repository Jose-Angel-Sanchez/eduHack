"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { getFirebaseAuth, getFirestoreDb } from "../../src/infrastructure/firebase/client"
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast-simple"
import { Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronRight } from "lucide-react"
import SectionContentManager from "./section-content-manager"

type Section = {
  id: string
  title: string
  description: string
  order_index: number
  course_id: string
}

export default function CourseSectionsManager({ courseId }: { courseId: string }) {
  const [sections, setSections] = useState<Section[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [newSection, setNewSection] = useState({ title: "", description: "" })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const auth = getFirebaseAuth()
  const db = getFirestoreDb()

  // Cargar secciones del curso
  const fetchSections = async () => {
    try {
      const q = query(collection(db, "course_sections"), where("course_id", "==", courseId))
      const snap = await getDocs(q)
      const list = snap.docs.map(d => d.data() as Section)
      list.sort((a,b)=> (a.order_index||0)-(b.order_index||0))
      setSections(list)
    } catch (error) {
      console.error("Error fetching sections:", error)
      toast({ title: "Error", description: "No se pudieron cargar las secciones del curso.", variant: "destructive" })
    }
  }

  useEffect(() => {
    if (courseId) {
      fetchSections()
    }
  }, [courseId])

  // Crear nueva sección
  const handleCreateSection = async () => {
    if (!newSection.title.trim()) {
      toast({
        title: "Error",
        description: "El título de la sección es requerido.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const nextOrder = sections.length + 1

      const ref = await addDoc(collection(db, "course_sections"), {
        title: newSection.title,
        description: newSection.description,
        course_id: courseId,
        order_index: nextOrder,
        createdAt: Date.now()
      })
      setSections([...sections, { id: ref.id, title: newSection.title, description: newSection.description, course_id: courseId, order_index: nextOrder }])
      setNewSection({ title: "", description: "" })
      setIsCreating(false)
      
      toast({
        title: "Sección creada",
        description: "La sección se ha agregado correctamente al curso.",
      })
    } catch (error: any) {
      // Log completo del error para debugging
      console.error("Error creating section - Full error object:", {
        error: error,
        message: error?.message,
        details: error?.details,
        code: error?.code,
        hint: error?.hint,
        statusCode: error?.statusCode,
        status: error?.status,
        statusText: error?.statusText,
        errorDescription: error?.error_description,
        stack: error?.stack
      })
      
      // Serializar el error completo como string si es un objeto
      console.error("Error creating section - Stringified:", JSON.stringify(error, null, 2))
      
      // Mejor manejo del error
      let errorMessage = "No se pudo crear la sección."
      if (error?.message) {
        errorMessage += ` Detalle: ${error.message}`
      }
      if (error?.details) {
        errorMessage += ` (${error.details})`
      }
      if (error?.code) {
        errorMessage += ` [Código: ${error.code}]`
      }
      if (error?.hint) {
        errorMessage += ` Sugerencia: ${error.hint}`
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Actualizar sección
  const handleUpdateSection = async (sectionId: string, updatedData: Partial<Section>) => {
    setLoading(true)
    try {
      await updateDoc(doc(db, "course_sections", sectionId), { ...updatedData })
      setSections(sections.map(section => section.id === sectionId ? { ...section, ...updatedData } : section))
      setEditingSection(null)
      
      toast({
        title: "Sección actualizada",
        description: "Los cambios se han guardado correctamente.",
      })
    } catch (error) {
      console.error("Error updating section:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la sección.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para toggle expandir/contraer sección
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  // Eliminar sección
  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta sección? Esta acción no se puede deshacer.")) {
      return
    }

    setLoading(true)
    try {
      await deleteDoc(doc(db, "course_sections", sectionId))
      setSections(sections.filter(section => section.id !== sectionId))
      
      toast({
        title: "Sección eliminada",
        description: "La sección se ha eliminado correctamente.",
      })
    } catch (error) {
      console.error("Error deleting section:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la sección.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Secciones del Curso</h3>
        <Button 
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Sección
        </Button>
      </div>

      {/* Formulario para crear nueva sección */}
      {isCreating && (
        <Card className="p-4">
          <div className="space-y-4">
            <Input
              placeholder="Título de la sección"
              value={newSection.title}
              onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
            />
            <Textarea
              placeholder="Descripción de la sección (opcional)"
              value={newSection.description}
              onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={handleCreateSection} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreating(false)
                  setNewSection({ title: "", description: "" })
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de secciones */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <Card key={section.id} className="overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {editingSection === section.id ? (
                    <EditSectionForm
                      section={section}
                      onSave={(updatedData) => handleUpdateSection(section.id, updatedData)}
                      onCancel={() => setEditingSection(null)}
                      loading={loading}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection(section.id)}
                        className="p-1 h-auto"
                      >
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                      <div>
                        <h4 className="font-medium text-lg">
                          {index + 1}. {section.title}
                        </h4>
                        {section.description && (
                          <p className="text-gray-600 mt-1">{section.description}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {editingSection !== section.id && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSection(section.id)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSection(section.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Contenido de la sección (expandible) */}
            {expandedSections.has(section.id) && editingSection !== section.id && (
              <div className="border-t bg-gray-50 p-4">
                <SectionContentManager 
                  sectionId={section.id} 
                  sectionTitle={section.title}
                />
              </div>
            )}
          </Card>
        ))}
      </div>

      {sections.length === 0 && !isCreating && (
        <div className="text-center py-8 text-gray-500">
          <p>No hay secciones en este curso.</p>
          <p className="text-sm">Agrega la primera sección para empezar a estructurar tu curso.</p>
        </div>
      )}
    </div>
  )
}

// Componente para editar sección
function EditSectionForm({ 
  section, 
  onSave, 
  onCancel, 
  loading 
}: { 
  section: Section
  onSave: (data: Partial<Section>) => void
  onCancel: () => void
  loading: boolean
}) {
  const [title, setTitle] = useState(section.title)
  const [description, setDescription] = useState(section.description)

  const handleSave = () => {
    if (!title.trim()) return
    onSave({ title, description })
  }

  return (
    <div className="space-y-4">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título de la sección"
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción de la sección"
      />
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={loading || !title.trim()}>
          <Save className="w-4 h-4 mr-2" />
          Guardar
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
      </div>
    </div>
  )
}
