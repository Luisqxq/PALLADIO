# Palladio Health — Diseño de seguridad

Plataforma: **Android**, app nativa con React Native + Expo.
Principio rector: **la app no debe agregar ningún riesgo al teléfono**. Si una
función no se puede hacer de forma segura, no se hace.

---

## 1. ¿De qué nos protegemos? (modelo de amenazas)

| # | Amenaza | Cómo la bloqueamos |
|---|---------|--------------------|
| A1 | Alguien ataca un servidor y roba los datos | **No hay servidor ni cuentas.** Los datos nunca salen del teléfono. |
| A2 | La app se usa como puerta para entrar al resto del teléfono | Permisos mínimos (sección 3). Android aísla cada app; sin permisos no puede tocar otras apps ni archivos. |
| A3 | Otra persona toma tu teléfono desbloqueado | Bloqueo con huella / PIN al abrir y al volver de segundo plano. |
| A4 | Alguien copia los archivos de la app (cable, respaldo, teléfono robado) | Base de datos **cifrada**; respaldo automático de Android **desactivado**. |
| A5 | Capturas de pantalla o vista previa en "apps recientes" | Pantalla protegida: se bloquean capturas y la vista previa sale en blanco. |
| A6 | Interceptar la conexión a internet (wifi público) | Solo HTTPS, tráfico sin cifrar prohibido, lista cerrada de dominios. |
| A7 | Contenido de internet con código malicioso | La información de MedlinePlus se muestra como **texto plano**, nunca como página web ejecutable. Sin WebView. |
| A8 | Una librería de terceros comprometida | Pocas dependencias, versiones fijadas, revisión de vulnerabilidades en cada versión. |
| A9 | Alguien envía una "actualización" falsa de la app | **Sin actualizaciones remotas (OTA).** Solo se instala un APK firmado con tu llave y verificado con su huella SHA-256. |
| A10 | Un archivo de respaldo manipulado que se importa | El respaldo va cifrado y autenticado; si fue alterado, se rechaza. |
| A11 | Otra app intenta abrir o enviar datos a Palladio | Sin enlaces profundos ni componentes expuestos a otras apps. |

---

## 2. Datos

- **Dónde:** solo en el almacenamiento privado de la app, dentro del teléfono.
- **Cifrado de la base de datos:** SQLite con **SQLCipher** (AES-256), vía
  `expo-sqlite` con `useSQLCipher: true`.
- **Llave de cifrado:** se genera al azar (256 bits) en el primer uso y se
  guarda en el **Android Keystore** mediante `expo-secure-store`. Nunca se
  escribe en el código ni en archivos.
- **Consultas:** siempre parametrizadas (nada de armar SQL con texto del usuario).
- **Registros (logs):** en la versión final no se imprime ningún dato de salud.
- **Borrado total:** opción en Ajustes que elimina la base de datos y la llave.

## 3. Permisos de Android

Se declaran explícitamente y se **bloquean** los que alguna librería intente
agregar por su cuenta (`android.blockedPermissions` en `app.json`).

**Permitidos (y para qué):**

| Permiso | Motivo |
|---------|--------|
| `POST_NOTIFICATIONS` | Recordatorios de pastillas. Se pide solo al crear el primer recordatorio. |
| `SCHEDULE_EXACT_ALARM` / `RECEIVE_BOOT_COMPLETED` | Que el recordatorio suene a la hora exacta y se restaure tras reiniciar el teléfono. |
| `USE_BIOMETRIC` | Desbloquear la app con huella. |
| `USE_FINGERPRINT` / `VIBRATE` | Huella en Android antiguos; vibración del recordatorio. |
| `INTERNET` | Desde la versión 1.1, **solo** para buscar en MedlinePlus, y solo si el usuario lo activa (viene apagado). Reglas en la sección 6. La versión 1.0 no tenía este permiso. |

**Bloqueados:** estado de red, cámara, micrófono, ubicación, contactos, calendario, SMS,
llamadas, almacenamiento externo, dibujar sobre otras apps, lista de apps
instaladas, y cualquier otro no listado arriba.

**Nota sobre Firebase:** la librería de notificaciones de Expo incluye el
cliente de Firebase Cloud Messaging (para notificaciones push). Palladio no lo
usa: no hay archivo de configuración de Firebase, así que no se inicializa
(verificado en el emulador: "Default FirebaseApp failed to initialize"), y sin
inicializar no abre ninguna conexión. Los recordatorios son alarmas
locales del teléfono. Su receptor expuesto está protegido por un permiso que
solo tiene Google Play Services.

## 4. Bloqueo de la app

- `expo-local-authentication`: huella o, si no hay, el PIN/patrón del teléfono.
- Se pide al abrir y al volver después de 1 minuto en segundo plano (configurable).
- Mientras está bloqueada no se muestra ningún dato.

## 5. Pantalla

- `plugins/withSecureWindow.js` activa `FLAG_SECURE` en la ventana principal
  desde que se crea (antes de mostrar cualquier dato), sin librerías ni permisos: no se pueden hacer capturas ni
  grabar pantalla, y la vista en "apps recientes" aparece en blanco.
- Excepción: si tú decides compartir el reporte PDF con tu médico, se genera
  el archivo en ese momento.

## 6. Red (desde la versión 1.1)

- **Apagado por defecto.** Se activa en Guía → MedlinePlus o en Ajustes, con
  un aviso que explica qué se envía. Apagado, el código se niega a conectarse.
- Única conexión: `src/net/medlineplus.ts` → servicio oficial
  `https://wsearch.nlm.nih.gov/ws/query` (temas de salud en español). Si la
  respuesta llega desde otro dominio (redirección), se rechaza.
- Lo único que se envía es el **término de búsqueda** (máx. 80 caracteres,
  codificado). Nunca registros, datos personales ni identificadores. Sin
  cookies (`credentials: 'omit'`). Como cualquier sitio web, MedlinePlus ve la
  dirección IP y el término buscado; la app lo advierte antes de activar.
- La respuesta se convierte a **texto plano** (`src/logic/medlineplus.ts`):
  sin WebView, sin HTML ejecutable; se descartan resultados cuyo enlace no sea
  `https://medlineplus.gov` o un subdominio. Límite de tamaño y de tiempo.
- Los enlaces "Leer completo" solo abren `medlineplus.gov` en el navegador del
  teléfono, y solo cuando el usuario lo toca.
- Los resultados se guardan en la base **cifrada** para leerlos sin internet;
  se pueden borrar en Ajustes.
- `usesCleartextTraffic: false`: prohibido HTTP sin cifrar.
- Sin publicidad, sin analítica, sin rastreadores, sin reportes de errores a terceros.
- Pruebas: `tests/medlineplus.test.ts` (dominios permitidos, URL, conversión a
  texto, descarte de scripts y de enlaces ajenos).

## 7. Respaldo (exportar / importar) — versión 3

- `android.allowBackup: false`: Android no copia los datos a la nube por su cuenta.
- El respaldo manual es un archivo cifrado con una **contraseña que eliges tú**:
  derivación de llave con **scrypt** y cifrado **AES-256-GCM** (librerías
  auditadas `@noble/hashes` y `@noble/ciphers`).
- Al importar se verifica la integridad; si el archivo fue alterado o la
  contraseña es incorrecta, se rechaza sin tocar tus datos actuales.
- Importante: si olvidas esa contraseña, **nadie** puede recuperar el respaldo.
  Es a propósito.

## 8. Superficie expuesta a otras apps

- Sin `scheme` ni enlaces profundos en la versión 1.
- Solo la actividad principal está exportada (la necesaria para el ícono).
- Sin WebView, sin carga de código remoto, sin `eval`.
- `expo-updates` **desactivado**: la app solo cambia cuando instalas un APK nuevo.

## 9. Cadena de suministro (librerías)

- Solo librerías oficiales de Expo más `@noble/*` y una de gráficas; cada nueva
  dependencia se justifica.
- `package-lock.json` versionado y versiones fijas.
- `npm audit` sin vulnerabilidades altas o críticas antes de cada versión.

## 10. Instalación segura en tu Android

1. El APK de producción se firma con **tu propia llave** (keystore). Guárdala
   en un lugar seguro: sin ella no se pueden publicar actualizaciones y nadie
   más puede hacerse pasar por la app.
2. Cada versión se publica en *Releases* de tu repositorio con su **SHA-256**.
3. Para instalar: descarga el APK, compara el SHA-256, activa "instalar apps
   desconocidas" **solo para esa instalación** y luego desactívalo.
4. Deja **Google Play Protect activado**. Puede avisar que "la app no es
   conocida": es normal en apps personales; confía solo si el SHA-256 coincide.
5. Nunca instales un APK de Palladio que te envíe otra persona.

## 11. Proceso de revisión

Automático en cada compilación (`.github/workflows/android.yml`):

- `npm audit` (falla con vulnerabilidades altas o críticas), tipos y pruebas.
- `scripts/verify_apk.py` lee el `AndroidManifest.xml` final **dentro del
  APK** y falla si hay un permiso fuera de la lista,
  `allowBackup` activo, tráfico sin cifrar, APK depurable o un componente
  expuesto a otras apps sin protección.
- Las acciones de GitHub están fijadas por hash de commit.

Manual, en cada etapa, antes de entregar el APK:

- [ ] Revisar el `AndroidManifest.xml` final: permisos, `allowBackup`, componentes exportados.
- [ ] `npm audit` limpio (sin altas/críticas).
- [ ] Confirmar que la base de datos en el teléfono no se puede leer sin la llave.
- [ ] Confirmar que no hay tráfico a dominios fuera de la lista.
- [ ] Probar bloqueo, captura de pantalla bloqueada y vista en apps recientes.
- [ ] Revisión de seguridad del código de la etapa.

## 12. Riesgos que quedan (siendo honestos)

- Un teléfono **rooteado** o con malware con privilegios de sistema puede leer
  la memoria de cualquier app. Mantén Android actualizado y no instales apps
  de fuentes dudosas.
- Si alguien conoce tu PIN del teléfono, puede desbloquear la app.
- Perder la llave de firma o la contraseña del respaldo no tiene solución, por diseño.
