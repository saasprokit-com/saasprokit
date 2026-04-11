import type { MessageCatalog } from "../types";

/**
 * Spanish message catalog
 */
export const es: MessageCatalog = {
  // Common
  "common.greeting": "Hola {name},",
  "common.thanks": "Gracias",
  "common.support":
    "Si tienes alguna pregunta, por favor contacta a nuestro equipo de soporte.",
  "common.footer": "Este correo fue enviado por {appName}.",
  "common.hi": "Hola,",

  // Welcome
  "welcome.preview": "Bienvenido a nuestra plataforma",
  "welcome.title": "¡Bienvenido, {name}!",
  "welcome.message":
    "Gracias por unirte. Estamos emocionados de tenerte con nosotros.",
  "welcome.cta": "Ir al Panel",

  // Password Reset
  "passwordReset.preview": "Restablece tu contraseña",
  "passwordReset.title": "Restablece Tu Contraseña",
  "passwordReset.message":
    "Recibimos una solicitud para restablecer la contraseña de la cuenta asociada con {email}.",
  "passwordReset.cta": "Restablecer Contraseña",
  "passwordReset.expiry": "Este enlace expirará en {hours} hora.",
  "passwordReset.ignore":
    "Si no solicitaste restablecer tu contraseña, puedes ignorar este correo. Tu contraseña no cambiará.",

  // Email Verification
  "emailVerification.preview": "Verifica tu dirección de correo",
  "emailVerification.title": "Verifica Tu Correo",
  "emailVerification.message":
    "¡Gracias por registrarte! Por favor verifica tu dirección de correo {email} para completar tu registro.",
  "emailVerification.cta": "Verificar Correo",
  "emailVerification.expiry": "Este enlace expirará en {hours} horas.",

  // Password Changed
  "passwordChanged.preview": "Tu contraseña ha sido cambiada",
  "passwordChanged.title": "Contraseña Cambiada",
  "passwordChanged.message":
    "La contraseña de tu cuenta ({email}) fue cambiada exitosamente.",
  "passwordChanged.warning":
    "Si no cambiaste tu contraseña, tu cuenta puede estar comprometida. Por favor asegura tu cuenta inmediatamente.",
  "passwordChanged.cta": "Asegurar Mi Cuenta",

  // Account Locked
  "accountLocked.preview": "Tu cuenta ha sido bloqueada temporalmente",
  "accountLocked.title": "Cuenta Bloqueada Temporalmente",
  "accountLocked.message":
    "Hemos bloqueado temporalmente tu cuenta ({email}) debido a múltiples intentos fallidos de inicio de sesión. Esta es una medida de seguridad para proteger tu cuenta.",
  "accountLocked.cta": "Restablecer Contraseña",

  // Subscription
  "subscription.upgraded.preview": "¡Has actualizado a {plan}!",
  "subscription.upgraded.title": "¡Has Actualizado!",
  "subscription.upgraded.message":
    "¡Felicidades! Has actualizado exitosamente de {previousPlan} a {newPlan}. Tus nuevas funciones ya están disponibles.",
  "subscription.downgraded.preview": "Tu plan ha cambiado a {plan}",
  "subscription.downgraded.title": "Tu Plan Ha Cambiado",
  "subscription.downgraded.message":
    "Tu suscripción ha cambiado de {previousPlan} a {newPlan}. Este cambio será efectivo el {effectiveDate}.",
  "subscription.lostFeatures": "Funciones Que Perderás:",

  // Payment
  "payment.receipt.preview": "Recibo de pago por {amount}",
  "payment.receipt.title": "Recibo de Pago",
  "payment.receipt.message":
    "Gracias por tu pago. Aquí está tu recibo para tus registros.",
  "payment.failed.preview": "Acción requerida: Pago fallido",
  "payment.failed.title": "Pago Fallido",
  "payment.failed.message":
    "No pudimos procesar tu pago de {amount} para tu suscripción {plan}.",

  // Labels
  "label.plan": "Plan",
  "label.amount": "Monto",
  "label.date": "Fecha",
  "label.billingPeriod": "Período de Facturación",
  "label.paymentMethod": "Método de Pago",
  "label.previousPlan": "Plan Anterior",
  "label.newPlan": "Nuevo Plan",
  "label.effectiveDate": "Fecha Efectiva",
  "label.ipAddress": "Dirección IP",
  "label.lockedAt": "Bloqueado El",
  "label.reason": "Razón",
  "label.failedAttempts": "Intentos Fallidos",
  "label.autoUnlock": "Desbloqueo Automático",
};
