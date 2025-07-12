function parseJwt(token) {
  try {
   // Aquí separamos la segunda parte (el payload) que contiene los datos como la fecha de expiración
    const base64Url = token.split('.')[1]; // Obtenemos el payload que está en formato base64Url
    
    // El formato base64Url usa '-' y '_' en lugar de '+' y '/' respectivamente
    // Necesitamos reemplazarlos para que sea decodificable en base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decodificamos la cadena base64
    // atob() convierte la cadena base64 a texto legible
    // Luego usamos decodeURIComponent para manejar correctamente los caracteres especiales
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); // Convertimos a formato URI
    }).join(''));
    
    // Finalmente convertimos el payload decodificado a un objeto JSON y lo retornamos
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function isTokenExpired(token) {
  const decodedToken = parseJwt(token);
  if (!decodedToken || !decodedToken.exp) {
    return true; // Token inválido o sin fecha de expiración
  }
  const currentTime = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
  return decodedToken.exp < currentTime; // Retorna true si el token ha expirado
}

export const setupGuards = router => {
  router.beforeEach(to => {
    // Si la ruta tiene la meta 'public', no hay restricciones de acceso.
    if (to.meta.public) return;

    const isLoggedIn = !!(localStorage.getItem('user') && localStorage.getItem('token'));
    const token = localStorage.getItem('token');

    if (isLoggedIn && token && isTokenExpired(token)) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return {
        name: 'login',
        query: {
          to: to.fullPath !== '/' ? to.path : undefined,
          message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.'
        }
      };
    }

    // Si el usuario ya está logueado y está intentando acceder a la página de login, lo redirigimos al dashboard
    if (to.name === 'login' && isLoggedIn) {
      return { name: 'dashboard' }; // Redirige a dashboard si ya está logueado
    }

    // Si el usuario no está logueado y está intentando acceder a una ruta privada, redirigimos a login
    if (!isLoggedIn && to.matched.length) {
      // No redirigir si ya estamos en la página de login (evitar redirección infinita)
      if (to.name === 'login') {
        return;
      }

      return {
        name: 'login',
        query: {
          ...to.query,
          to: to.fullPath !== '/' ? to.path : undefined, // Almacenamos la ruta de destino en la query
        },
      };
    }

    // Verificación de redirección para rutas que solo deben ser accedidas por no autenticados
    if (to.meta.unauthenticatedOnly && isLoggedIn) {
      return { name: 'dashboard' }; // Redirige al dashboard si ya está autenticado
    }
  });
};
