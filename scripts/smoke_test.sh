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

tap_text() { # pulsa el centro del elemento con ese texto exacto
  local bounds x1 y1 x2 y2
  bounds=$(echo "$2" | tr '>' '\n' | grep "text=\"$1\"" | grep -o 'bounds="[^"]*"' | head -1 || true)
  [ -n "$bounds" ] || return 1
  read -r x1 y1 x2 y2 <<<"$(echo "$bounds" | grep -o '[0-9]\+' | tr '\n' ' ')"
  adb shell input tap $(((x1 + x2) / 2)) $(((y1 + y2) / 2))
}

wait_for_text() { # texto, segundos
  local text="$1" secs="$2" ui
  for _ in $(seq 1 "$secs"); do
    ui=$(ui_dump)
    if echo "$ui" | grep -q "$text"; then return 0; fi
    # El emulador es lento y a veces otra app del sistema muestra
    # "no responde": se cierra el aviso con "Esperar" y se sigue.
    if echo "$ui" | grep -q "isn't responding\|no responde"; then
      echo "(aviso de 'no responde' de otra app del emulador: se pulsa Esperar)"
      tap_text "Wait" "$ui" || tap_text "Esperar" "$ui" || true
    fi
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

echo "== Dejando que el emulador se estabilice"
sleep 30

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
# El botón está al final de la pantalla: se desplaza hacia abajo primero.
adb shell input swipe 540 1800 540 500 300
sleep 1
if tap_text "Entendido, empezar" "$(ui_dump)"; then
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

echo "== Comprobando FLAG_SECURE"
# 1) La ventana de la app debe tener la marca SECURE.
adb shell dumpsys window windows > "$OUT/ventanas.txt"
if grep -A15 "Window{.*$PKG/$PKG.MainActivity}" "$OUT/ventanas.txt" | grep -q "SECURE"; then
  echo "✓ La ventana de la app tiene FLAG_SECURE"
else
  fail "La ventana de la app no tiene FLAG_SECURE"
fi
# 2) Una captura debe salir vacía (Android la rechaza) o en negro.
adb exec-out screencap -p > "$OUT/captura.png" || true
if [ ! -s "$OUT/captura.png" ] || ! head -c 8 "$OUT/captura.png" | grep -q "PNG"; then
  echo "✓ Android rechazó la captura de pantalla"
else
  python3 scripts/png_is_black.py "$OUT/captura.png"
fi

echo "✓ Prueba de humo superada"
