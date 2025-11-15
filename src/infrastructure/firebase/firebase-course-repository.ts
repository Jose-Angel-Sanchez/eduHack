import { CourseRepository } from '../../domain/repositories/course-repository'
import { Course } from '../../domain/entities/course'
import { getFirestoreDb } from './client'
import { collection, addDoc, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore'

function mapDoc(docSnap: any): Course {
  const d = docSnap.data()
  return new Course({
    id: docSnap.id,
    title: d.title,
    description: d.description,
    category: d.category,
    difficultyLevel: d.difficultyLevel,
    estimatedDuration: d.estimatedDuration,
    prerequisites: d.prerequisites,
    learningObjectives: d.learningObjectives,
    isActive: d.isActive !== false,
    createdAt: d.createdAt || new Date().toISOString(),
    updatedAt: d.updatedAt || new Date().toISOString(),
    createdBy: d.createdBy || null,
  })
}

export class FirebaseCourseRepository implements CourseRepository {
  async findActive(max: number = 50): Promise<Course[]> {
    const db = getFirestoreDb()
    const col = collection(db, 'courses')
    const q = query(col, where('isActive', '==', true), orderBy('createdAt', 'desc'), limit(max))
    const snaps = await getDocs(q)
    return snaps.docs.map(mapDoc)
  }
  async findById(id: string): Promise<Course | null> {
    const db = getFirestoreDb()
    const snap = await getDoc(doc(db, 'courses', id))
    return snap.exists() ? mapDoc(snap) : null
  }
  async create(input: {
    title: string
    description?: string | null
    category: string
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
    estimatedDuration?: number | null
    createdBy?: string | null
  }): Promise<Course> {
    const db = getFirestoreDb()
    const col = collection(db, 'courses')
    const now = new Date().toISOString()
    const docRef = await addDoc(col, {
      title: input.title,
      description: input.description || null,
      category: input.category,
      difficultyLevel: input.difficultyLevel,
      estimatedDuration: input.estimatedDuration || null,
      prerequisites: [],
      learningObjectives: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy || null,
    })
    const fakeSnap: any = { id: docRef.id, data: () => ({
      title: input.title,
      description: input.description || null,
      category: input.category,
      difficultyLevel: input.difficultyLevel,
      estimatedDuration: input.estimatedDuration || null,
      prerequisites: [],
      learningObjectives: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy || null,
    }) }
    return mapDoc(fakeSnap)
  }
}
