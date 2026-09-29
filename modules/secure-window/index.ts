import { requireOptionalNativeModule } from 'expo';

type SecureWindowModule = { setSecure(secure: boolean): Promise<void> };

// En Android bloquea o permite las capturas de pantalla de la app.
const native = requireOptionalNativeModule<SecureWindowModule>('SecureWindow');

export async function setScreenCaptureBlocked(blocked: boolean): Promise<void> {
  await native?.setSecure(blocked);
}
