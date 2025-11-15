import { AuthRepository } from '../../../domain/repositories/auth-repository'
import { UserSession } from '../../../domain/entities/user-session'

export class SignInUseCase {
  constructor(private auth: AuthRepository) {}
  async execute(email: string, password: string): Promise<UserSession> {
    if (!email || !password) throw new Error('CREDENTIALS_REQUIRED')
    return this.auth.signIn(email, password)
  }
}
