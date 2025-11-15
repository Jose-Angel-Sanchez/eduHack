import { getFirestoreDb } from "@/src/infrastructure/firebase/client"
import { getCurrentUser } from "@/lib/firebase/server"
import { doc, getDoc } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, User } from "lucide-react"
import { notFound } from "next/navigation"

export default async function BlogDetailPage({ params }: { params: { id: string } }) {
  // Optional auth if needed later
  await getCurrentUser()
  let post: any = null
  try {
    const db = getFirestoreDb()
    const snap = await getDoc(doc(db, 'content', params.id))
    if (snap.exists()) post = { id: snap.id, ...snap.data() }
  } catch (e) {
    console.error('Error loading blog post', e)
  }
  if (!post || (post.type && post.type !== 'blog')) notFound()
  const words = (post.description || '').split(/\s+/).length
  const minutes = Math.max(1, Math.round(words / 200))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <img
          src={post.fileUrl || post.file_url || "/placeholder.jpg"}
          alt={post.title}
          className="w-full h-64 object-cover rounded-lg mb-6"
        />

        <div className="flex items-center gap-2 mb-4">
          <Badge>Blog</Badge>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><User className="w-4 h-4" /> Anónimo</span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(post.createdAt || post.created_at || Date.now()).toLocaleDateString("es-ES")}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {minutes} min</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        <p className="text-lg text-muted-foreground mb-8 whitespace-pre-wrap">{post.description}</p>

        {post.transcription && (
          <Card>
            <CardHeader>
              <CardTitle>Transcripción</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{post.transcription}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
