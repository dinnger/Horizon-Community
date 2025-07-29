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
            <span class="label-text font-medium">Correo:</span>
          </label>
          <label class="input validator">
            <span class="mdi mdi-email-outline"></span>
            <input v-model="email" type="email" placeholder="mail@site.com" required />
          </label>
          <div class="validator-hint hidden">
            Correo inválido
          </div>
        </div>

        <!-- Password Field -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Contraseña</span>
          </label>
          <label class="input validator">
            <span class="mdi mdi-key-outline"></span>
            <input v-model="password" type="password" required placeholder="Password" minlength="6"
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}"
              title=" Contraseña debe contener al menos 6 caracteres, incluyendo números, letras minúsculas y mayúsculas." />
          </label>
          <p class="validator-hint hidden">
            Contraseña debe contener al menos 6 caracteres, incluyendo números, letras minúsculas y mayúsculas.
          </p>
        </div>

        <!-- Remember Me -->
        <div class="form-control">
          <label class="cursor-pointer label justify-start space-x-3">
            <input v-model="rememberMe" type="checkbox" class="checkbox checkbox-primary" />
            <span class="label-text">Recordar mi sesión</span>
          </label>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Logo from '@/components/icons/logo.vue'
import { useSettingsStore } from '@/stores'
import { toast } from 'vue-sonner'

const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)

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

  if (!validateForm()) {
    return
  }

  try {
    const success = await authStore.login(email.value, password.value, rememberMe.value)

    if (success) {
      router.push('/')
    } else {

      toast.error('Credenciales incorrectas. Verifica tu correo y contraseña.')
    }
  } catch (error) {
    toast.error('Error al iniciar sesión. Inténtalo de nuevo.')
    console.error('Login error:', error)
  }
}

const loginWithGoogle = () => {
  window.location.href = '/api/auth/google'
}

onMounted(async () => {
  try {
    const success = await authStore.rememberMe()
    if (success?.existToken) {
      router.push('/')
    } else if (success?.success && success?.existToken) {
      toast.error('Credenciales incorrectas. Verifica tu correo y contraseña.')
    }
  } catch (error) {
    console.error('Login error:', error)
  }
})
</script>
