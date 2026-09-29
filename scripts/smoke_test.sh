#!/usr/bin/env bash
# Pruebas en un emulador Android con el APK firmado.
#
# 1. ACTUALIZACIÓN (si se pasa el APK publicado anterior): instala la versión
#    anterior, registra un día, instala la nueva encima y comprueba que el
#    registro sigue ahí (la base de datos cifrada se migra sin perder datos).
# 2. USUARIO NUEVO: instalación limpia con otro perfil (dolor de cabeza):
#    sin huella por defecto, solo ve lo de su perfil, el teclado no tapa el
#    campo de notas, capturas permitidas por defecto y bloqueables en Ajustes,
#    búsqueda real en MedlinePlus.
#
# Uso: smoke_test.sh <nuevo.apk> [anterior.apk]
set -euo pipefail

APK="$1"
PREV_APK="${2:-}"
PKG="pe.palladio.health"
PIN="1234"
OUT="smoke"
mkdir -p "$OUT"

ui_dump() {
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 || true
  adb shell cat /sdcard/ui.xml 2>/dev/null || true
}

fail() {
  echo "✗ $1"
  ui_dump > "$OUT/ui.xml"
  echo "  Textos en pantalla:"
  tr '>' '\n' < "$OUT/ui.xml" | grep -o 'text="[^"]\{1,80\}"' | head -40 | sed 's/^/    /' || true
  adb logcat -d > "$OUT/logcat.txt" || true
  exit 1
}

bounds_of() { # texto exacto o parcial ("~texto") -> "x1 y1 x2 y2"
  local pattern
  if [[ "$1" == ~* ]]; then pattern="text=\"[^\"]*${1:1}[^\"]*\""; else pattern="text=\"$1\""; fi
  echo "$2" | tr '>' '\n' | grep "$pattern" | grep -o 'bounds="[^"]*"' | head -1 | grep -o '[0-9]\+' | tr '\n' ' ' || true
}

tap() { # texto (exacto, o "~parcial")
  local b
  b=$(bounds_of "$1" "$(ui_dump)")
  [ -n "$b" ] || return 1
  read -r x1 y1 x2 y2 <<<"$b"
  adb shell input tap $(((x1 + x2) / 2)) $(((y1 + y2) / 2))
}

tap_scrolling() { # texto, intentos
  for _ in $(seq 1 "$2"); do
    if tap "$1"; then return 0; fi
    adb shell input swipe 540 1700 540 600 300
    sleep 1
  done
  return 1
}

wait_for_text() { # texto, segundos
  local text="$1" secs="$2" ui
  for _ in $(seq 1 "$secs"); do
    ui=$(ui_dump)
    if echo "$ui" | grep -q "$text"; then return 0; fi
    if echo "$ui" | grep -q "isn't responding\|no responde"; then
      local who
      who=$(echo "$ui" | grep -o 'text="[^"]*\(isn.t responding\|no responde\)[^"]*"' | head -1)
      echo "(aviso del sistema: $who)"
      if echo "$who" | grep -qi "palladio"; then fail "Palladio Health no responde (ANR)"; fi
      tap "Wait" || tap "Esperar" || true
    fi
    sleep 1
  done
  return 1
}

step() { echo "== $1"; }
ok() { echo "  ✓ $1"; }

open_app() {
  adb shell am force-stop "$PKG" || true
  adb shell am start -W -n "$PKG/.MainActivity" >/dev/null
}

unlock_if_asked() {
  if wait_for_text "Desbloquear Palladio Health" 15; then
    sleep 2
    adb shell input text "$PIN"
    adb shell input keyevent KEYCODE_ENTER
    return 0
  fi
  return 1
}

window_is_secure() {
  adb shell dumpsys window windows > "$OUT/ventanas.txt"
  grep -A15 "Window{.*$PKG/$PKG.MainActivity}" "$OUT/ventanas.txt" | grep -q "SECURE"
}

step "Preparando el emulador"
sleep 30
adb shell settings put global hide_error_dialogs 1 || true
adb shell locksettings set-pin "$PIN"
adb shell input keyevent KEYCODE_WAKEUP
adb shell wm dismiss-keyguard || true

# ---------------------------------------------------------------------------
if [ -n "$PREV_APK" ] && [ -f "$PREV_APK" ]; then
  step "1. Actualización desde la versión publicada ($PREV_APK)"
  adb install -r "$PREV_APK" >/dev/null
  open_app
  unlock_if_asked || true
  wait_for_text "Bienvenido a Palladio Health" 40 || fail "La versión anterior no mostró la bienvenida"
  tap_scrolling "Entendido, empezar" 6 || fail "Versión anterior: no se encontró 'Entendido, empezar'"
  wait_for_text "Cuánto dolor" 20 || fail "Versión anterior: no se abrió Hoy"
  tap "5" || fail "Versión anterior: no se pudo marcar el dolor"
  ok "Dolor 5 marcado"
  sleep 1
  tap_scrolling "Guardar registro" 8 || fail "Versión anterior: no se encontró 'Guardar registro'"
  ok "Pulsado 'Guardar registro'"
  wait_for_text "Guardado" 10 || fail "Versión anterior: no se guardó el registro"
  ok "Registro guardado en la versión anterior"

  adb install -r "$APK" >/dev/null || fail "Android no aceptó la actualización (¿firma distinta?)"
  adb logcat -c
  open_app
  if unlock_if_asked; then fail "La versión nueva pidió huella/PIN, pero por defecto no debe pedirla"; fi
  wait_for_text "Qué quieres cuidar" 40 || fail "Tras actualizar no apareció la elección de perfil"
  ui_dump | grep -q 'checked="true"' || echo "  (aviso: no se detectó la casilla marcada)"
  tap_scrolling "Continuar" 6 || fail "No se encontró 'Continuar' en el perfil"
  wait_for_text "dolor pélvico" 20 || fail "Tras actualizar, Hoy no muestra el módulo de prostatitis"
  tap "Evolución" || fail "No se encontró la pestaña Evolución"
  wait_for_text "Días registrados: 1 de 30" 20 || fail "El registro de la versión anterior NO se conservó"
  ok "El registro de la versión anterior se conservó tras actualizar"
  adb shell pidof "$PKG" >/dev/null || fail "La app se cerró después de actualizar"
  adb logcat -d | grep -q "FATAL EXCEPTION" && fail "Error fatal después de actualizar"
  adb uninstall "$PKG" >/dev/null
else
  step "1. Actualización: no hay versión publicada anterior; se omite"
fi

# ---------------------------------------------------------------------------
step "2. Usuario nuevo con otro perfil (dolor de cabeza)"
adb install -r "$APK" >/dev/null
adb logcat -c
open_app
if unlock_if_asked; then fail "Pidió huella/PIN al abrir, pero por defecto no debe pedirla"; fi
ok "No pidió huella al abrir"
wait_for_text "Bienvenido a Palladio Health" 40 || fail "No apareció la bienvenida (¿la base de datos cifrada no abrió?)"
tap_scrolling "Entendido, empezar" 6 || fail "No se encontró 'Entendido, empezar'"
wait_for_text "Qué quieres cuidar" 20 || fail "No apareció la elección de perfil"
tap_scrolling "~Dolor de cabeza" 4 || fail "No se encontró la condición 'Dolor de cabeza'"
tap_scrolling "Continuar" 6 || fail "No se encontró 'Continuar'"
wait_for_text "Qué tan fuerte fue el dolor de cabeza" 20 || fail "Hoy no muestra el módulo de dolor de cabeza"
if ui_dump | grep -q "dolor pélvico"; then fail "Se muestra prostatitis a quien no la eligió"; fi
ok "Solo se muestra lo de su perfil"

step "Teclado (pendiente #3)"
FOUND=""
for _ in $(seq 1 10); do
  UI=$(ui_dump)
  EDIT=$(echo "$UI" | tr '>' '\n' | grep 'class="android.widget.EditText"' | grep -o 'bounds="[^"]*"' | tail -1 | grep -o '[0-9]\+' | tr '\n' ' ' || true)
  TABS=$(bounds_of "Pastillas" "$UI")
  if [ -n "$EDIT" ] && [ -n "$TABS" ]; then
    read -r x1 y1 x2 y2 <<<"$EDIT"
    read -r _ tab_label_top _ _ <<<"$TABS"
    # Solo si el borde superior del campo está a la vista, por encima de la
    # barra de pestañas (el ícono va ~80 px sobre el texto de la pestaña).
    if [ $((y1 + 40)) -lt $((tab_label_top - 80)) ]; then
      adb shell input tap $(((x1 + x2) / 2)) $((y1 + 30))
      FOUND=1
      break
    fi
  fi
  adb shell input swipe 540 1700 540 600 300
  sleep 1
done
[ -n "$FOUND" ] || fail "No se encontró el campo de notas"
sleep 2
adb shell input text "prueba%sde%steclado"
sleep 2
UI=$(ui_dump)
NOTE=$(bounds_of "~prueba de teclado" "$UI")
[ -n "$NOTE" ] || fail "El texto escrito no está a la vista (¿el teclado lo tapa?)"
read -r _ _ _ NOTE_BOTTOM <<<"$NOTE"
adb shell dumpsys window InputMethod > "$OUT/teclado.txt" || true
KB_TOP=$(python3 - "$OUT/teclado.txt" <<'PY'
import re, sys
text = open(sys.argv[1], errors="ignore").read()
tops = [int(m.group(2)) for m in re.finditer(r"(?:mFrame|frame)=\[(\d+),(\d+)\]\[(\d+),(\d+)\]", text) if int(m.group(2)) > 0]
print(min(tops) if tops else "")
PY
)
if [ -n "$KB_TOP" ]; then
  [ "$NOTE_BOTTOM" -le "$KB_TOP" ] || fail "El campo de notas (termina en y=$NOTE_BOTTOM) queda debajo del teclado (empieza en y=$KB_TOP)"
  ok "El campo de notas queda sobre el teclado (y=$NOTE_BOTTOM < $KB_TOP)"
else
  ok "El texto escrito es visible (no se pudo medir el teclado)"
fi
# Cierra el teclado solo si está abierto (si no, "atrás" saldría de la app).
if adb shell dumpsys input_method | grep -q "mInputShown=true"; then
  adb shell input keyevent KEYCODE_BACK
  sleep 1
fi

step "Capturas de pantalla (pendiente #2)"
if window_is_secure; then fail "Las capturas deberían estar permitidas por defecto"; fi
adb exec-out screencap -p > "$OUT/captura.png" || true
[ -s "$OUT/captura.png" ] || fail "No se pudo tomar la captura aunque están permitidas"
ok "Capturas permitidas por defecto"
tap "Ajustes" || fail "No se encontró la pestaña Ajustes"
sleep 2
tap_scrolling "~Bloquear capturas" 6 || fail "No se encontró el interruptor de capturas"
sleep 2
window_is_secure || fail "Al activar 'Bloquear capturas' la ventana no quedó protegida"
ok "Al activarlo, la ventana queda protegida (FLAG_SECURE)"

step "Búsqueda real en MedlinePlus (informativa)"
MEDLINE="no probado"
if tap "Guía" && sleep 2 && tap_scrolling "~MedlinePlus" 2 && sleep 2 \
  && tap_scrolling "Activar consultas a MedlinePlus" 3 && sleep 2 && tap_scrolling "Dolor de cabeza" 3; then
  if wait_for_text "Ver más" 40; then
    MEDLINE="ok"
    ui_dump | tr '>' '\n' | grep -o 'text="[^"]\{3,90\}"' | sed -n '/Fatiga visual/,$p' | sed -n '2,10p' | sed 's/^/      /'
  else
    MEDLINE="sin resultados"
  fi
fi
echo "Resultado MedlinePlus: $MEDLINE"

step "Estado final"
sleep 3
adb shell pidof "$PKG" >/dev/null || fail "La app se cerró"
adb logcat -d | grep -q "FATAL EXCEPTION" && fail "Hubo un error fatal en el registro del sistema"
adb logcat -d | grep -q "ANR in $PKG" && fail "Palladio Health dejó de responder (ANR)"
echo "✓ Pruebas en emulador superadas"
