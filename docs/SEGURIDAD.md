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
| `INTERNET` | Solo para consultar MedlinePlus. Desactivable en Ajustes ("modo sin conexión"). |

**Bloqueados:** cámara, micrófono, ubicación, contactos, calendario, SMS,
llamadas, almacenamiento externo, dibujar sobre otras apps, lista de apps
instaladas, y cualquier otro no listado arriba.

## 4. Bloqueo de la app

- `expo-local-authentication`: huella o, si no hay, el PIN/patrón del teléfono.
- Se pide al abrir y al volver después de 1 minuto en segundo plano (configurable).
- Mientras está bloqueada no se muestra ningún dato.

## 5. Pantalla

- `expo-screen-capture` activa `FLAG_SECURE`: no se pueden hacer capturas ni
  grabar pantalla, y la vista en "apps recientes" aparece en blanco.
- Excepción: si tú decides compartir el reporte PDF con tu médico, se genera
  el archivo en ese momento.

## 6. Red

- Único destino permitido: servicios oficiales de MedlinePlus
  (`medlineplus.gov`, `wsearch.nlm.nih.gov`, `connect.medlineplus.gov`).
  Cualquier otro dominio se rechaza en el código.
- `usesCleartextTraffic: false`: prohibido HTTP sin cifrar.
- Lo único que se envía es el **término de búsqueda** (p. ej. "prostatitis").
  Nunca datos personales, registros ni identificadores del teléfono.
- Sin publicidad, sin analítica, sin rastreadores, sin reportes de errores a terceros.

## 7. Respaldo (exportar / importar)

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

En cada etapa, antes de entregar el APK:

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
