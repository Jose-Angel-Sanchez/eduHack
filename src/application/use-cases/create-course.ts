import { Course } from '../../domain/entities/course'
import { CourseRepository } from '../../domain/repositories/course-repository'

export interface CreateCourseInput {
  title: string
  description?: string | null
  category: string
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  estimatedDuration?: number | null
  createdBy?: string | null
}

export class CreateCourseUseCase {
  constructor(private repo: CourseRepository) {}
  async execute(input: CreateCourseInput): Promise<Course> {
    if (!input.title) throw new Error('TITLE_REQUIRED')
    if (!input.category) throw new Error('CATEGORY_REQUIRED')
    if (!['beginner','intermediate','advanced'].includes(input.difficultyLevel)) throw new Error('INVALID_DIFFICULTY')
    return this.repo.create(input)
  }
}
