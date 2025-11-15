export interface ProfileProps {
  id: string
  email: string
  fullName?: string | null
  username?: string | null
  avatarUrl?: string | null
  learningLevel?: string | null
  preferredLanguage?: string | null
  createdAt: string
  updatedAt: string
}

export class Profile {
  private props: ProfileProps
  constructor(props: ProfileProps) {
    if (!props.email) throw new Error('PROFILE_INVALID_EMAIL')
    this.props = props
  }
  get id() { return this.props.id }
  get email() { return this.props.email }
  get fullName() { return this.props.fullName }
  get username() { return this.props.username }
  get avatarUrl() { return this.props.avatarUrl }
  get learningLevel() { return this.props.learningLevel }
  get preferredLanguage() { return this.props.preferredLanguage }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }
}
