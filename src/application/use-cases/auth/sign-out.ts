import { AuthRepository } from '../../../domain/repositories/auth-repository'

export class SignOutUseCase {
  constructor(private auth: AuthRepository) {}
  async execute() {
    await this.auth.signOut()
  }
}
