import { AuthRepository } from '../../../domain/repositories/auth-repository'

export interface SignUpInput {
  email: string
  password: string
  fullName?: string
  username?: string
}

export class SignUpUseCase {
  constructor(private auth: AuthRepository) {}
  async execute(input: SignUpInput) {
    if (!input.email || !input.password) throw new Error('CREDENTIALS_REQUIRED')
    return this.auth.signUp(input)
  }
}
