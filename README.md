# PALLADIO
CREATING THE 0 CORRUPTED ENTERPRISE

## Palladio Health

App para Android que funciona como diario de salud y guía para vivir mejor con
la prostatitis crónica y cuidar el colon, mezclando la medicina tradicional
con la moderna y diciendo con honestidad qué evidencia tiene cada cosa.

**No reemplaza al médico.** Es una guía y un registro personal.

### Qué hace (versión 1)

| Pestaña | Para qué |
|---------|----------|
| 📝 Hoy | Dolor 0–10, dónde duele, síntomas al orinar, detonantes, lo que te alivió, señales de alarma y notas. Marca tus pastillas como tomadas u omitidas. |
| 💊 Pastillas | Tus medicamentos, horarios, recordatorios y cumplimiento de la semana. |
| 📋 Control | Cuestionario NIH-CPSI semanal (el que usan los urólogos), con tu puntaje y cambio. |
| 📈 Evolución | Gráfico de 30 días, zonas de dolor, **patrones** (qué se asocia con más o menos dolor al día siguiente) y evolución del NIH-CPSI. |
| 🌿 Guía | Remedios tradicionales y modernos con nivel de evidencia, alimentación económica en Perú con menú semanal, hábitos, señales de alarma con los números SAMU 106 e Infosalud 113, y búsqueda en **MedlinePlus** (opcional, se guarda para leer sin internet). |
| ⚙️ Ajustes | Tiempo de bloqueo, privacidad y borrado total. |

### Seguridad

Resumen (detalle en [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md)):

- Sin servidor ni cuentas. La única conexión a internet es la búsqueda en MedlinePlus, **apagada por defecto**, y solo envía el tema buscado.
- Base de datos cifrada (SQLCipher, AES-256) con la llave en el Android Keystore.
- Bloqueo con huella o PIN, capturas de pantalla bloqueadas.
- Respaldo automático de Android desactivado.
- Cada compilación verifica automáticamente los permisos del APK final.

### Instalar en tu Android

Guía paso a paso, desde el teléfono: [`docs/INSTALAR.md`](docs/INSTALAR.md).

En resumen: configurar la llave de firma como secretos del repositorio →
**Actions → Android → Run workflow** con "publicar" → descargar el APK desde
**Releases** e instalarlo.

### Desarrollo

```bash
npm ci
npm test            # pruebas de la lógica (NIH-CPSI, patrones, alertas)
npm run typecheck
npx expo prebuild --platform android   # genera android/ (no se versiona)
```

La app usa SQLCipher, por eso **no funciona en Expo Go**: se prueba con el APK
que genera GitHub Actions.
