# PALLADIO
CREATING THE 0 CORRUPTED ENTERPRISE

## Palladio Health

App para Android que funciona como diario de salud y guía para vivir mejor con
la prostatitis crónica y cuidar el colon, mezclando la medicina tradicional
con la moderna y diciendo con honestidad qué evidencia tiene cada cosa.

**No reemplaza al médico.** Es una guía y un registro personal.

### Qué hace (versión 2)

Cada persona elige sus condiciones al empezar y **solo ve lo suyo**. Módulos
disponibles: prostatitis crónica, colon irritable, recuperación de fractura de
pierna, síndrome de ovario poliquístico y dolor de cabeza.

| Pestaña | Para qué |
|---------|----------|
| 📝 Hoy | Registro diario de cada condición del perfil, detonantes, alivios, señales de alarma y notas. Marca tus pastillas como tomadas u omitidas. |
| 💊 Pastillas | Medicamentos, horarios, recordatorios y cumplimiento de la semana. |
| 📋 Control | Cuestionarios semanales validados: NIH-CPSI (prostatitis) e IBS-SSS (colon). |
| 📈 Evolución | Gráfico de 30 días por condición, zonas, **patrones** (qué se asocia con más o menos síntomas), ciclo menstrual, horas de pantalla y cuestionarios. |
| 🌿 Guía | Remedios con nivel de evidencia, menú económico que cambia cada semana, hábitos, **precauciones cruzadas** entre condiciones, prevención según antecedentes familiares, MedlinePlus y señales de alarma (SAMU 106). |
| ⚙️ Ajustes | Mi perfil, antecedentes familiares, huella opcional, bloqueo de capturas, MedlinePlus, **respaldo cifrado** y borrado total. |

### Seguridad

Resumen (detalle en [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md)):

- Sin servidor ni cuentas. La única conexión a internet es la búsqueda en MedlinePlus, **apagada por defecto**, y solo envía el tema buscado.
- Base de datos cifrada (SQLCipher, AES-256) con la llave en el Android Keystore.
- Huella o PIN y bloqueo de capturas opcionales (en Ajustes).
- Respaldo cifrado con tu contraseña (AES-256-GCM + scrypt).
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
npm test            # pruebas de la lógica (cuestionarios, patrones, ciclo, antecedentes, respaldo, MedlinePlus)
npm run typecheck
npx expo prebuild --platform android   # genera android/ (no se versiona)
```

La app usa SQLCipher, por eso **no funciona en Expo Go**: se prueba con el APK
que genera GitHub Actions.
