export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  avatar?: string
  phone?: string
  address?: Address
  createdAt: Date
}

export interface Address {
  street: string
  city: string
  postalCode: string
  country: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phone?: string
  acceptTerms: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  clearError: () => void
}

// Mock kullanıcı verileri
export const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'kadir@example.ch',
    firstName: 'Kadir',
    lastName: 'Kizilboga',
    fullName: 'Kadir Kizilboga',
    phone: '+41 79 123 45 67',
    address: {
      street: 'Musterstrasse 123',
      city: 'Zürich',
      postalCode: '8001',
      country: 'Schweiz'
    },
    createdAt: new Date('2023-01-15')
  }
] 