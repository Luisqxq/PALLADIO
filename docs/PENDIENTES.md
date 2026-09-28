# Pendientes (observaciones del usuario)

Lista de errores y cambios pedidos tras probar la versión 1. Se anotan sin
corregir; al final se planifica, se corrige todo junto y se compila una sola
versión nueva.

| # | Pantalla | Observación | Estado |
|---|----------|-------------|--------|
| 1 | Inicio / desbloqueo | No debería pedir la huella al iniciar la app. | Anotado |
| 2 | Toda la app | No permite tomar captura de pantalla. (Hoy es a propósito por FLAG_SECURE; revisar la decisión con el usuario.) | Anotado |
| 3 | Hoy → "¿Cómo te sentiste?" | Al escribir, el teclado tapa el campo de texto. | Anotado |
| 4 | Guía → Alimentación | El menú debería ser distinto cada semana. | Anotado |
| 5 | Nuevo módulo | Agregar monitoreo del colon irritable (el usuario lo padece). | Anotado |
| 6 | Perfil de salud | Luxofractura de tibia y peroné hace ~8 meses. Considerar todas sus condiciones juntas y dar precauciones acordes (ejercicios, remedios, alimentación, alertas). | Anotado |
| 7 | Toda la app / primer uso | **Varios usuarios, cada uno en su teléfono.** La app debe servir a cualquier persona: al instalarla, cada usuario arma su propio perfil con sus condiciones, y solo ve el seguimiento, la guía y las alertas de *sus* condiciones. Lo de un usuario (p. ej. prostatitis, colon, fractura) no debe aparecer para otro. | Anotado |
| 8 | Nuevo perfil (2.º usuario) | Usuaria con **síndrome de ovario poliquístico** y **dolores de cabeza frecuentes**. El neurólogo no dio un diagnóstico preciso; ella lo relaciona con la parte visual. Le pasan aun sin usar pantallas, pero **empeoran con pantallas, sobre todo la laptop**. En etapa de recopilación de información. | Anotado |
| 9 | Perfil de salud | **Antecedentes familiares** (heredofamiliares): registrar enfermedades de la familia para orientar la prevención. Ejemplos: una tía del usuario tuvo **diabetes**; el padre de la segunda usuaria tuvo un **aneurisma cerebral**. | Anotado |
| 10 | Actualizaciones (técnico) | Asegurar que los datos se conservan al actualizar: probar en CI la instalación de la versión anterior con datos y luego la nueva encima. Adelantar el **respaldo cifrado** (exportar/importar) para no perder datos si se desinstala o se cambia de teléfono. | Anotado |
