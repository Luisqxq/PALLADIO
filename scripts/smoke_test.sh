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
      local who
      who=$(echo "$ui" | grep -o 'text="[^"]*\(isn.t responding\|no responde\)[^"]*"' | head -1)
      echo "(aviso del sistema: $who)"
      if echo "$who" | grep -qi "palladio"; then fail "Palladio Health no responde (ANR)"; fi
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

# Oculta los avisos de "no responde" de las apps del emulador (lento en CI).
# Un ANR de Palladio se detecta igual en el registro del sistema, más abajo.
adb shell settings put global hide_error_dialogs 1 || true

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
# El botón está al final: se desplaza hacia abajo hasta encontrarlo.
tap_scrolling() { # texto, intentos
  for _ in $(seq 1 "$2"); do
    if tap_text "$1" "$(ui_dump)"; then return 0; fi
    adb shell input swipe 540 1800 540 400 300
    sleep 1
  done
  return 1
}
tap_scrolling "Entendido, empezar" 6 || fail "No se encontró el botón 'Entendido, empezar'"
wait_for_text "Cuánto dolor sentiste" 20 || fail "No se abrió la pantalla Hoy después del aviso"
echo "✓ Pantalla Hoy abierta"

echo "== Búsqueda real en MedlinePlus (el emulador tiene internet)"
tap_contains() { # pulsa el primer elemento cuyo texto contiene $1
  local bounds x1 y1 x2 y2
  bounds=$(ui_dump | tr '>' '\n' | grep "text=\"[^\"]*$1[^\"]*\"" | grep -o 'bounds="[^"]*"' | head -1 || true)
  [ -n "$bounds" ] || return 1
  read -r x1 y1 x2 y2 <<<"$(echo "$bounds" | grep -o '[0-9]\+' | tr '\n' ' ')"
  adb shell input tap $(((x1 + x2) / 2)) $(((y1 + y2) / 2))
}
medline_step() { # descripción, texto
  if tap_contains "$2"; then echo "  ✓ $1"; sleep 2; return 0; fi
  echo "  ✗ $1: no se encontró '$2'. Textos en pantalla:"
  ui_dump | tr '>' '\n' | grep -o 'text="[^"]\{2,60\}"' | head -25 | sed 's/^/      /'
  return 1
}
MEDLINE="no probado"
if medline_step "Pestaña Guía" "Guía" \
  && medline_step "Sección MedlinePlus" "MedlinePlus" \
  && medline_step "Activar consultas" "Activar consultas" \
  && medline_step "Tema sugerido" "Prostatitis"; then
  if wait_for_text "Ver más" 40; then
    MEDLINE="ok"
    echo "✓ MedlinePlus devolvió temas y la app los mostró como texto:"
    ui_dump | tr '>' '\n' | grep -o 'text="[^"]\{3,90\}"' | head -15 | sed 's/^/      /'
  else
    MEDLINE="sin resultados"
    ui_dump | tr '>' '\n' | grep -o 'text="[^"]\{3,160\}"' | head -20 | sed 's/^/      /'
  fi
fi
echo "Resultado MedlinePlus: $MEDLINE"
# Depende de un servicio externo: se informa pero no bloquea la publicación.

echo "== Comprobando que la app sigue viva"
sleep 3
adb shell pidof "$PKG" >/dev/null || fail "La app se cerró"
if adb logcat -d | grep -q "FATAL EXCEPTION"; then
  fail "Hubo un error fatal en el registro del sistema"
fi
if adb logcat -d | grep -q "ANR in $PKG"; then
  fail "Palladio Health dejó de responder (ANR) durante la prueba"
fi
adb logcat -d | grep "ANR in" | sed 's/^/(ANR de otra app del emulador) /' | head -5 || true

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
