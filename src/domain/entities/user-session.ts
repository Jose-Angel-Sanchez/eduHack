export interface UserSessionProps {
  userId: string
  email: string
  isAdmin: boolean
  accessToken?: string | null
  expiresAt?: string | null
}

export class UserSession {
  private props: UserSessionProps
  constructor(props: UserSessionProps) {
    if (!props.userId) throw new Error('SESSION_INVALID_USER')
    this.props = props
  }
  get userId() { return this.props.userId }
  get email() { return this.props.email }
  get isAdmin() { return this.props.isAdmin }
  get accessToken() { return this.props.accessToken }
  get expiresAt() { return this.props.expiresAt }
}
