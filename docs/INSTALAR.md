# Cómo instalar Palladio Health en tu Android

Todo se puede hacer desde el teléfono, con el navegador (Chrome) entrando a
github.com con tu cuenta. Usa la versión de escritorio si algún menú no aparece
(menú ⋮ de Chrome > "Sitio de escritorio").

## Paso 1: guarda tu llave de firma (una sola vez)

Recibiste dos archivos: `palladio-llave.jks` y `palladio-secretos.txt`.

- Guárdalos en un lugar privado y seguro: tu Google Drive personal, o mejor
  un gestor de contraseñas.
- **Nunca** los subas al repositorio ni se los mandes a nadie.
- Si los pierdes, podrás seguir usando la app, pero no podrás instalar
  actualizaciones sin desinstalarla (y perder los datos).

## Paso 2: crea los 3 secretos en GitHub (una sola vez)

1. Entra a tu repositorio **PALLADIO** en github.com.
2. **Settings** → **Secrets and variables** → **Actions**.
3. Pulsa **New repository secret** y crea estos tres, copiando cada valor
   desde `palladio-secretos.txt`:
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEYSTORE_BASE64` (es una línea muy larga: cópiala completa)

Los secretos quedan cifrados en GitHub: nadie puede verlos, ni siquiera tú
después de guardarlos, aunque el repositorio sea público.

## Paso 3: genera el APK

1. En el repositorio, entra a **Actions** → **Android** (a la izquierda).
2. Pulsa **Run workflow**.
3. En "Branch" elige la rama de la app (hoy es
   `claude/prostatitis-monitoring-app-ds249x`, o `main` cuando la unas).
4. Marca **Publicar un Release con el APK firmado** y pulsa **Run workflow**.
5. Espera unos 10 minutos a que aparezca el ✓ verde.

## Paso 4: instala

1. En el repositorio, entra a **Releases** (en la página principal, a la
   derecha, o en `github.com/Luisqxq/PALLADIO/releases`).
2. Descarga `palladio-health-1.0.0.apk` del Release más reciente.
3. Ábrelo. Android te pedirá permitir "instalar apps desconocidas" para
   Chrome: actívalo, instala y **vuelve a desactivarlo** (Ajustes → Apps →
   Chrome → Instalar apps desconocidas).
4. Si Google Play Protect dice que la app no es conocida, es normal en apps
   personales: elige "Instalar de todas formas". Deja Play Protect activado.

## Paso 5: primer uso

1. Abre Palladio Health y desbloquéala con tu huella o PIN.
2. Lee el aviso inicial y pulsa "Entendido, empezar".
3. Ve a **💊 Pastillas** y agrega tus medicamentos con sus horarios. La primera
   vez te pedirá permiso para notificaciones: acéptalo para tener recordatorios.
4. Registra tu día en **📝 Hoy** y haz tu primer control en **📋 Control**.

Para que los recordatorios suenen a la hora exacta en Android 14 o más nuevo:
Ajustes del teléfono → Apps → Palladio Health → **Alarmas y recordatorios** →
permitir.

## Actualizaciones

Cuando haya una versión nueva, repite los pasos 3 y 4. Android solo acepta la
actualización si está firmada con **tu** llave, así que nadie puede
reemplazar tu app por otra.

## Comprobación avanzada (opcional)

Cada Release incluye un archivo `.sha256` con la huella del APK. Desde una
computadora puedes comprobarla con `sha256sum palladio-health-1.0.0.apk`
(Linux/Mac) o `certutil -hashfile palladio-health-1.0.0.apk SHA256` (Windows).
