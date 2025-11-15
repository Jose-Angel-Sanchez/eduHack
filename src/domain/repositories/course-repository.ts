import { Course } from '../entities/course'

export interface CourseRepository {
  findActive(limit?: number): Promise<Course[]>
  create(input: {
    title: string
    description?: string | null
    category: string
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
    estimatedDuration?: number | null
    createdBy?: string | null
  }): Promise<Course>
}
