import { Course } from '../../domain/entities/course'
import { CourseRepository } from '../../domain/repositories/course-repository'

export class ListActiveCoursesUseCase {
  constructor(private repo: CourseRepository) {}
  async execute(limit?: number): Promise<Course[]> {
    return this.repo.findActive(limit)
  }
}
