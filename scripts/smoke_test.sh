#!/usr/bin/env bash
# Prueba de humo en un emulador Android: instala el APK, pone un PIN al
# teléfono, abre la app, la desbloquea con el PIN y comprueba que:
#   1. la app no se cierra sola,
#   2. la base de datos cifrada se abre (aparece la pantalla de bienvenida),
#   3. las capturas de pantalla salen en negro (FLAG_SECURE).
# Uso: smoke_test.sh <app.apk>
set -euo pipefail

APK="$1"
PKG="pe.palladio.health"
PIN="1234"
OUT="smoke"
mkdir -p "$OUT"

ui_dump() {
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 || true
  adb shell cat /sdcard/ui.xml 2>/dev/null || true
}

wait_for_text() { # texto, segundos
  local text="$1" secs="$2"
  for _ in $(seq 1 "$secs"); do
    if ui_dump | grep -q "$text"; then return 0; fi
    sleep 1
  done
  return 1
}

fail() {
  echo "✗ $1"
  ui_dump > "$OUT/ui.xml"
  adb logcat -d > "$OUT/logcat.txt" || true
  exit 1
}

echo "== Configurando PIN del teléfono"
adb shell locksettings set-pin "$PIN"
adb shell input keyevent KEYCODE_WAKEUP
adb shell wm dismiss-keyguard || true

echo "== Instalando APK"
adb install -r "$APK"
adb logcat -c

echo "== Abriendo la app"
adb shell am start -W -n "$PKG/.MainActivity"

# El diálogo del sistema pide el PIN del teléfono para desbloquear la app.
if wait_for_text "Desbloquear Palladio Health" 40; then
  echo "== Ingresando PIN"
  sleep 2
  adb shell input text "$PIN"
  adb shell input keyevent KEYCODE_ENTER
else
  echo "(no apareció el diálogo de desbloqueo; se revisa la pantalla igualmente)"
fi

echo "== Esperando la pantalla de bienvenida"
wait_for_text "Bienvenido a Palladio Health" 40 || fail "No apareció la pantalla de bienvenida (la base de datos cifrada no abrió o la app falló)"

echo "== Aceptando el aviso"
# Pulsa el botón por su texto usando las coordenadas del volcado de la UI.
BOUNDS=$(ui_dump | tr '>' '\n' | grep 'text="Entendido, empezar"' | grep -o 'bounds="[^"]*"' | head -1 || true)
if [ -n "$BOUNDS" ]; then
  read -r X1 Y1 X2 Y2 <<<"$(echo "$BOUNDS" | grep -o '[0-9]\+' | tr '\n' ' ')"
  adb shell input tap $(((X1 + X2) / 2)) $(((Y1 + Y2) / 2))
  wait_for_text "Cuánto dolor sentiste" 20 || fail "No se abrió la pantalla Hoy después del aviso"
  echo "✓ Pantalla Hoy abierta"
else
  echo "(no se encontró el botón del aviso; se omite ese paso)"
fi

echo "== Comprobando que la app sigue viva"
sleep 3
adb shell pidof "$PKG" >/dev/null || fail "La app se cerró"
if adb logcat -d | grep -q "FATAL EXCEPTION"; then
  fail "Hubo un error fatal en el registro del sistema"
fi

echo "== Comprobando FLAG_SECURE (captura en negro)"
adb exec-out screencap -p > "$OUT/captura.png"
python3 scripts/png_is_black.py "$OUT/captura.png"

echo "✓ Prueba de humo superada"
