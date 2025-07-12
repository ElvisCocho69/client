  <script setup>
  import { useGenerateImageVariant } from '@/@core/composable/useGenerateImageVariant'
  import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
  import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
  import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
  import authV2LoginIllustrationDark from '@images/pages/login.png'
  import authV2LoginIllustrationLight from '@images/pages/login.png'
  import authV2LoginMaskDark from '@images/pages/auth-v2-login-mask-dark.png'
  import authV2LoginMaskLight from '@images/pages/auth-v2-login-mask-light.png'
  import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
  import { themeConfig } from '@themeConfig'
  import { $api } from '@/utils/api'
  import { ref } from 'vue'

  const form = ref({
    username: '',
    password: '',
  })

  const route = useRoute()
  const router = useRouter()
  const error_exists = ref(null)

  definePage({ meta: { layout: 'blank' } })

  const login = async () => {
    try {
      error_exists.value = null;
      const resp = await $api('/auth/authenticate', {
        method: 'POST',
        body: {
          username: form.value.username,
          password: form.value.password,
        },
        onResponseError({ response }) {
          console.log(response._data.message);
          error_exists.value = response._data.message;
        }
      })

      console.log(resp);

      localStorage.clear();

      localStorage.setItem('token', resp.jwt);

      const userProfileResp = await $api('auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${resp.jwt}`,
        }
      })

      console.log(userProfileResp);

      localStorage.setItem('user', JSON.stringify(userProfileResp));

      await nextTick(() => {
        if (userProfileResp.role.name === 'Cliente') {
          router.replace('/feedback/list')
        } else {
          router.replace(route.query.to ? String(route.query.to) : '/')
        }
      })

    } catch (error) {
      console.log(error);
    }
  }

  const isPasswordVisible = ref(false)
  const authV2LoginMask = useGenerateImageVariant(authV2LoginMaskLight, authV2LoginMaskDark)
  const authV2LoginIllustration = useGenerateImageVariant(authV2LoginIllustrationLight, authV2LoginIllustrationDark, authV2LoginIllustrationBorderedLight, authV2LoginIllustrationBorderedDark, true)
  </script>

  <template>
    <div class="auth-wrapper d-flex align-center justify-center pa-4">
      <VCard class="auth-card pa-1 pa-sm-7" max-width="448">
        <VCardItem class="justify-center pb-6">
          <VCardTitle>
            <RouterLink to="/">
              <div class="app-logo">
                <VNodeRenderer :nodes="themeConfig.app.logo" />
                <h1 class="app-logo-title">
                  {{ themeConfig.app.title }}
                </h1>
              </div>
            </RouterLink>
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <h4 class="text-h4 mb-1">
            Bienvenido a <span class="text-capitalize">{{ themeConfig.app.title }}! 👋</span>
          </h4>
          <p class="mb-0">
            Inicia sesión y comienza la aventura.
          </p>
        </VCardText>

        <VCardText>
          <VForm @submit.prevent="login">
            <VRow>
              <!-- username -->
              <VCol cols="12">
                <VTextField
                  v-model="form.username"
                  autofocus
                  label="Usuario"
                  type="text"
                  placeholder="Admin"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <VTextField
                  v-model="form.password"
                  label="Contraseña"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
                
                <VAlert type="error" class="my-2" v-if="error_exists" closable>
                  <strong>{{ error_exists }}</strong>
                </VAlert>

                <!-- login button -->
                <VBtn block type="submit" style="margin-top: 5px;">
                  Iniciar Sesión
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>

      <VImg
        :src="authV1ThemeLoginMask"
        class="d-none d-md-block auth-footer-mask flip-in-rtl"
      />
    </div>
  </template>


  <style lang="scss">
  @use "@core/scss/template/pages/page-auth.scss";
  </style>
