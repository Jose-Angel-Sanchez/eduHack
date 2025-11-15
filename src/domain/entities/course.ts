export interface CourseProps {
  id: string
  title: string
  description?: string | null
  category: string
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  estimatedDuration?: number | null
  prerequisites?: string[] | null
  learningObjectives?: string[] | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string | null
}

export class Course {
  private props: CourseProps
  constructor(props: CourseProps) {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('COURSE_INVALID_TITLE')
    }
    this.props = props
  }
  get id() { return this.props.id }
  get title() { return this.props.title }
  get description() { return this.props.description }
  get category() { return this.props.category }
  get difficultyLevel() { return this.props.difficultyLevel }
  get estimatedDuration() { return this.props.estimatedDuration }
  get prerequisites() { return this.props.prerequisites }
  get learningObjectives() { return this.props.learningObjectives }
  get isActive() { return this.props.isActive }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }
  get createdBy() { return this.props.createdBy }
}
