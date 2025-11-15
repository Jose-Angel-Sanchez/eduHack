import { getSupabase } from './client'
import { Course } from '../../domain/entities/course'
import { CourseRepository } from '../../domain/repositories/course-repository'

function mapRow(row: any): Course {
  return new Course({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    difficultyLevel: row.difficulty_level,
    estimatedDuration: row.estimated_duration,
    prerequisites: row.prerequisites,
    learningObjectives: row.learning_objectives,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  })
}

export class SupabaseCourseRepository implements CourseRepository {
  async findActive(limit = 50): Promise<Course[]> {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data || []).map(mapRow)
  }

  async create(input: {
    title: string
    description?: string | null
    category: string
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
    estimatedDuration?: number | null
    createdBy?: string | null
  }): Promise<Course> {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: input.title,
        description: input.description,
        category: input.category,
        difficulty_level: input.difficultyLevel,
        estimated_duration: input.estimatedDuration,
        is_active: true,
        created_by: input.createdBy || null,
      })
      .select('*')
      .single()
    if (error) throw error
    return mapRow(data)
  }
}
