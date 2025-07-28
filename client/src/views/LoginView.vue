<template>
  <!-- Login Card -->
  <div class="card w-full max-w-md bg-base-200/80 backdrop-blur-lg shadow-2xl border border-base-300">
    <div class="card-body">
      <!-- Logo and Title -->
      <div class="text-center mb-3 mt-3">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          <Logo class="w-7 h-7  inline"
            :class="[settingsStore.currentTheme === 'dark' ? 'fill-white' : 'fill-primary']" />
          Horizon
        </h1>
      </div>

      <!-- Login Form -->

      <form @submit.prevent="handleLogin" class="space-y-6 p-10 border-t border-base-300 pt-4 mt-4">
        <!-- Email Field -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Correo electrónico</span>
          </label>
          <div class="relative">
            <input v-model="email" type="email" placeholder="admin@horizon.com"
              class="input input-bordered w-full pl-12" :class="{ 'input-error': errors.email }" required />
            <svg class="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-base-content/50" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <label v-if="errors.email" class="label">
            <span class="label-text-alt text-error">{{ errors.email }}</span>
          </label>
        </div>

        <!-- Password Field -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Contraseña</span>
          </label>
          <div class="relative">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••"
              class="input input-bordered w-full pl-12 pr-12" :class="{ 'input-error': errors.password }" required />
            <svg class="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-base-content/50" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <button type="button" @click="showPassword = !showPassword"
              class="absolute right-4 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content">
              <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
          <label v-if="errors.password" class="label">
            <span class="label-text-alt text-error">{{ errors.password }}</span>
          </label>
        </div>

        <!-- Remember Me -->
        <div class="form-control">
          <label class="cursor-pointer label justify-start space-x-3">
            <input v-model="rememberMe" type="checkbox" class="checkbox checkbox-primary" />
            <span class="label-text">Recordar mi sesión</span>
          </label>
        </div>

        <!-- Error Message -->
        <div v-if="loginError" class="alert alert-error">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>{{ loginError }}</span>
        </div>

        <!-- Login Button -->
        <button type="submit" class="btn btn-primary w-full" :disabled="authStore.isLoading">
          <span v-if="authStore.isLoading" class="loading loading-spinner"></span>
          <span v-if="!authStore.isLoading">
            Iniciar Sesión
          </span>
          <span v-else>Iniciando sesión...</span>
        </button>

        <!-- Google Login Button -->
        <div v-if="VITE_GOOGLE_LOGIN" class="border-t border-base-300 pt-4">
          <button type="button" class="btn btn-outline w-full mt-2 flex items-center justify-center gap-2"
            @click="loginWithGoogle">
            <span class="mdi mdi-google"></span>
            Iniciar sesión con Google
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Logo from '@/components/icons/logo.vue'
import { useSettingsStore } from '@/stores'

const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const loginError = ref('')

const errors = reactive({
  email: '',
  password: ''
})

const VITE_SERVER_URL = import.meta.env.VITE_SERVER_URL
const VITE_GOOGLE_LOGIN = import.meta.env.VITE_GOOGLE_LOGIN.toLowerCase() === 'true'


const validateForm = () => {
  errors.email = ''
  errors.password = ''

  if (!email.value) {
    errors.email = 'El correo electrónico es requerido'
    return false
  }

  if (!email.value.includes('@')) {
    errors.email = 'Ingresa un correo electrónico válido'
    return false
  }

  if (!password.value) {
    errors.password = 'La contraseña es requerida'
    return false
  }

  if (password.value.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres'
    return false
  }

  return true
}

const handleLogin = async () => {
  loginError.value = ''

  if (!validateForm()) {
    return
  }

  try {
    const success = await authStore.login(email.value, password.value)

    if (success) {
      router.push('/')
    } else {
      loginError.value = 'Credenciales incorrectas. Verifica tu correo y contraseña.'
    }
  } catch (error) {
    loginError.value = 'Error al iniciar sesión. Inténtalo de nuevo.'
    console.error('Login error:', error)
  }
}

const loginWithGoogle = () => {
  window.location.href = `${VITE_SERVER_URL}/auth/google`
}
</script>
