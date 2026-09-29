# Pendientes (observaciones del usuario)

Lista de errores y cambios pedidos tras probar la versión 1. Se anotan sin
corregir; al final se planifica, se corrige todo junto y se compila una sola
versión nueva.

| # | Pantalla | Observación | Estado |
|---|----------|-------------|--------|
| 1 | Inicio / desbloqueo | No debería pedir la huella al iniciar la app. | Hecho (v2.0): Ajustes → "Pedir huella o PIN", por defecto *Nunca*. |
| 2 | Toda la app | No permite tomar captura de pantalla. (Hoy es a propósito por FLAG_SECURE; revisar la decisión con el usuario.) | Hecho (v2.0): interruptor en Ajustes, capturas permitidas por defecto. |
| 3 | Hoy → "¿Cómo te sentiste?" | Al escribir, el teclado tapa el campo de texto. | Hecho (v2.0): la pantalla se desplaza para dejar el campo sobre el teclado. Probado en emulador. |
| 4 | Guía → Alimentación | El menú debería ser distinto cada semana. | Hecho (v2.0): 4 menús que rotan cada lunes, con consejos por condición. |
| 5 | Nuevo módulo | Agregar monitoreo del colon irritable (el usuario lo padece). | Hecho (v2.0): módulo de colon irritable (Bristol, hinchazón, IBS-SSS semanal). |
| 6 | Perfil de salud | Luxofractura de tibia y peroné hace ~8 meses. Considerar todas sus condiciones juntas y dar precauciones acordes (ejercicios, remedios, alimentación, alertas). | Hecho (v2.0): módulo de fractura (placas y tornillos) y precauciones cruzadas con próstata y colon. |
| 7 | Toda la app / primer uso | **Varios usuarios, cada uno en su teléfono.** La app debe servir a cualquier persona: al instalarla, cada usuario arma su propio perfil con sus condiciones, y solo ve el seguimiento, la guía y las alertas de *sus* condiciones. Lo de un usuario (p. ej. prostatitis, colon, fractura) no debe aparecer para otro. | Hecho (v2.0): perfil al primer uso; cada usuario ve solo lo suyo. |
| 8 | Nuevo perfil (2.º usuario) | Usuaria con **síndrome de ovario poliquístico** y **dolores de cabeza frecuentes**. El neurólogo no dio un diagnóstico preciso; ella lo relaciona con la parte visual. Le pasan aun sin usar pantallas, pero **empeoran con pantallas, sobre todo la laptop**. En etapa de recopilación de información. | Hecho (v2.0): módulos de SOP (ciclo) y dolor de cabeza (pantallas, vista, analgésicos). Se ajustarán con más información. |
| 9 | Perfil de salud | **Antecedentes familiares** (heredofamiliares): registrar enfermedades de la familia para orientar la prevención. Ejemplos: una tía del usuario tuvo **diabetes**; el padre de la segunda usuaria tuvo un **aneurisma cerebral**. | Hecho (v2.0): Ajustes → Antecedentes familiares; Guía → Prevención. |
| 10 | Actualizaciones (técnico) | Asegurar que los datos se conservan al actualizar: probar en CI la instalación de la versión anterior con datos y luego la nueva encima. Adelantar el **respaldo cifrado** (exportar/importar) para no perder datos si se desinstala o se cambia de teléfono. | Hecho (v2.0): prueba de actualización en CI y respaldo cifrado. |

## Estado al cierre del 29/09

- La versión 2.0 está programada y compila (tipos, 30 pruebas automáticas, auditoría sin vulnerabilidades, APK firmado con permisos verificados).
- **Aún no publicada.** La prueba en el emulador sigue fallando por un problema *de la propia prueba*: a veces el toque automático cae sobre la barra de pestañas (pestaña "Evolución") en lugar del botón o del campo, cuando el elemento está pegado al borde inferior. Pasó con "Guardar registro" (versión anterior) y con el campo de notas.
- Lo que la prueba **sí confirmó**: al actualizar de la 1.0 a la 2.0 el registro se conserva; la 2.0 no pide huella por defecto; cada perfil ve solo lo suyo.
- Próximo paso: hacer que la prueba toque cualquier elemento solo si está por encima de la barra de pestañas (medida real), y publicar.
