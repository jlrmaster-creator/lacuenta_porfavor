const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
  'auth/weak-password': 'La contraseña es demasiado débil (mínimo 6 caracteres).',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  'auth/network-request-failed': 'Sin conexión. Comprueba tu red e inténtalo de nuevo.',
  'permission-denied': 'No tienes permiso para realizar esta acción.',
  unauthenticated: 'Debes iniciar sesión para continuar.',
  unavailable: 'Servicio no disponible. Inténtalo de nuevo más tarde.',
  'failed-precondition': 'La operación no es válida en el estado actual.',
};

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as Error & { code?: string }).code;
    if (code && MESSAGES[code]) return MESSAGES[code];
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    if (MESSAGES[code]) return MESSAGES[code];
  }
  return 'Se ha producido un error inesperado. Inténtalo de nuevo.';
}
