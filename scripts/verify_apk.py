#!/usr/bin/env python3
"""Revisa el AndroidManifest final dentro del APK y falla si algo no cumple
docs/SEGURIDAD.md: permisos fuera de la lista, respaldo activado, tráfico sin
cifrar o componentes expuestos a otras apps sin protección.

Uso: verify_apk.py <ruta-aapt2> <app.apk>
"""
import re
import subprocess
import sys

ALLOWED_PERMISSIONS = {
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.RECEIVE_BOOT_COMPLETED",
    "android.permission.SCHEDULE_EXACT_ALARM",
    "android.permission.USE_BIOMETRIC",
    "android.permission.USE_FINGERPRINT",
    "android.permission.VIBRATE",
    # Solo para consultar MedlinePlus (desde la versión 1.1). Ver docs/SEGURIDAD.md.
    "android.permission.INTERNET",
}
# Permiso interno que AndroidX crea para proteger sus propios receptores.
INTERNAL_PERMISSION = re.compile(r"^[\w.]+\.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION$")

COMPONENTS = {"activity", "activity-alias", "service", "receiver", "provider"}
ANDROID_NS = "http://schemas.android.com/apk/res/android:"


class Element:
    def __init__(self, tag, depth):
        self.tag, self.depth, self.attrs, self.children = tag, depth, {}, []


def parse_xmltree(text):
    root = Element("#root", -1)
    stack = [root]
    for line in text.splitlines():
        stripped = line.lstrip(" ")
        depth = len(line) - len(stripped)
        if stripped.startswith("E: "):
            tag = stripped[3:].split(" ")[0]
            while stack[-1].depth >= depth:
                stack.pop()
            el = Element(tag, depth)
            stack[-1].children.append(el)
            stack.append(el)
        elif stripped.startswith("A: "):
            m = re.match(r"A: (.+?)(?:\(0x[0-9a-f]+\))?=(.*)$", stripped)
            if not m:
                continue
            name = m.group(1).replace(ANDROID_NS, "android:")
            value = m.group(2)
            s = re.match(r'"(.*?)"', value)
            if s:
                value = s.group(1)
            while stack[-1].depth >= depth:
                stack.pop()
            stack[-1].attrs[name] = value.strip()
    return root


def walk(el):
    yield el
    for c in el.children:
        yield from walk(c)


def is_true(v):
    return v is not None and v.lower() in ("true", "0xffffffff", "-1") or (v or "").endswith(")0xffffffff")


def is_false(v):
    return v is not None and (v.lower() in ("false", "0x0", "0") or v.endswith(")0x0"))


def main():
    aapt2, apk = sys.argv[1], sys.argv[2]
    text = subprocess.run(
        [aapt2, "dump", "xmltree", "--file", "AndroidManifest.xml", apk],
        check=True, capture_output=True, text=True,
    ).stdout
    tree = parse_xmltree(text)
    elements = list(walk(tree))
    errors = []

    perms = sorted(
        e.attrs.get("android:name", "?")
        for e in elements
        if e.tag in ("uses-permission", "uses-permission-sdk-23")
    )
    print("Permisos en el APK:")
    for p in perms:
        print("  -", p)
        if p not in ALLOWED_PERMISSIONS and not INTERNAL_PERMISSION.match(p):
            errors.append(f"Permiso no permitido: {p}")

    apps = [e for e in elements if e.tag == "application"]
    if len(apps) != 1:
        errors.append("No se encontró <application> en el manifiesto")
    else:
        app = apps[0]
        if not is_false(app.attrs.get("android:allowBackup")):
            errors.append(f"allowBackup no es false: {app.attrs.get('android:allowBackup')}")
        if is_true(app.attrs.get("android:usesCleartextTraffic")):
            errors.append("usesCleartextTraffic está activado")
        if is_true(app.attrs.get("android:debuggable")):
            errors.append("El APK es depurable (debuggable)")

    print("Componentes expuestos a otras apps:")
    for e in elements:
        if e.tag not in COMPONENTS or not is_true(e.attrs.get("android:exported")):
            continue
        name = e.attrs.get("android:name", "?")
        permission = e.attrs.get("android:permission")
        filters = [c for c in e.children if c.tag == "intent-filter"]
        actions = [a.attrs.get("android:name") for f in filters for a in f.children if a.tag == "action"]
        is_launcher = "android.intent.action.MAIN" in actions and len(filters) == 1 and len(actions) == 1
        has_data = any(d.tag == "data" for f in filters for d in f.children)
        print(f"  - {e.tag} {name} permiso={permission} acciones={actions}")
        if is_launcher and not has_data:
            continue  # la pantalla principal (ícono de la app)
        if permission:
            continue  # protegido: solo el sistema u otras apps con ese permiso
        errors.append(f"Componente expuesto sin protección: {e.tag} {name}")

    if errors:
        print("\nFALLÓ la verificación de seguridad:")
        for err in errors:
            print("  ✗", err)
        sys.exit(1)
    print("\n✓ El APK cumple la política de seguridad.")


if __name__ == "__main__":
    main()
