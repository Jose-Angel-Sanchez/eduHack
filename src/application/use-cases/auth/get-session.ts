import { AuthRepository } from '../../../domain/repositories/auth-repository'
import { UserSession } from '../../../domain/entities/user-session'

export class GetSessionUseCase {
  constructor(private auth: AuthRepository) {}
  async execute(): Promise<UserSession | null> {
    return this.auth.getSession()
  }
}
