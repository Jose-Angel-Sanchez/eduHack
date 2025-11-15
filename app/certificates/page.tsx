import { getCurrentUser } from "@/lib/firebase/server"
import { getFirestoreDb } from "@/src/infrastructure/firebase/client"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { redirect } from "next/navigation"
import { CertificateGenerator } from "@/components/certificates/certificate-generator"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award } from "lucide-react"

export default async function CertificatesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  let certificates: any[] = []
  try {
    const db = getFirestoreDb()
    const col = collection(db, 'certificates')
    const q = query(col, where('userId', '==', user.uid), orderBy('completionDate', 'desc'))
    const snaps = await getDocs(q)
    certificates = snaps.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Error fetching certificates', e)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mis Certificados</h1>
        <p className="text-muted-foreground">
          Aquí puedes ver y descargar todos tus certificados de finalización de cursos.
        </p>
      </div>

      {certificates.length > 0 ? (
        <div className="space-y-6">
          {certificates.map((certificate: any) => (
            <CertificateGenerator
              key={certificate.id}
              certificate={{
                id: certificate.id,
                user_name: user.displayName || user.email || 'Usuario',
                course_title: certificate.courseTitle || 'Curso',
                completion_date: certificate.completionDate || certificate.createdAt || new Date().toISOString(),
                certificate_id: certificate.certificateId || certificate.id,
                course_duration: certificate.courseDuration || 'No especificado',
                skills_learned: certificate.skillsLearned || [],
              }}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardHeader>
            <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <CardTitle>No tienes certificados aún</CardTitle>
            <CardDescription>Completa tus primeros cursos para obtener certificados digitales</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
