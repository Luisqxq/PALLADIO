#!/usr/bin/env python3
"""Sale con error si la zona central de una captura PNG no es negra.
Sirve para comprobar que FLAG_SECURE bloquea las capturas de pantalla."""
import struct
import sys
import zlib


def read_png(path):
    data = open(path, "rb").read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        sys.exit("no es un PNG")
    pos, idat = 8, b""
    width = height = ctype = depth = 0
    while pos < len(data):
        length, kind = struct.unpack(">I4s", data[pos:pos + 8])
        chunk = data[pos + 8:pos + 8 + length]
        if kind == b"IHDR":
            width, height, depth, ctype = struct.unpack(">IIBB", chunk[:10])
        elif kind == b"IDAT":
            idat += chunk
        pos += 12 + length
    if depth != 8 or ctype not in (2, 6):
        sys.exit(f"formato PNG no soportado (profundidad {depth}, tipo {ctype})")
    bpp = 3 if ctype == 2 else 4
    raw = zlib.decompress(idat)
    stride = width * bpp
    rows, prev = [], bytearray(stride)
    for y in range(height):
        f = raw[y * (stride + 1)]
        line = bytearray(raw[y * (stride + 1) + 1:(y + 1) * (stride + 1)])
        for i in range(stride):
            a = line[i - bpp] if i >= bpp else 0
            b = prev[i]
            c = prev[i - bpp] if i >= bpp else 0
            if f == 1:
                line[i] = (line[i] + a) & 0xFF
            elif f == 2:
                line[i] = (line[i] + b) & 0xFF
            elif f == 3:
                line[i] = (line[i] + (a + b) // 2) & 0xFF
            elif f == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pred = a if pa <= pb and pa <= pc else (b if pb <= pc else c)
                line[i] = (line[i] + pred) & 0xFF
        rows.append(line)
        prev = line
    return width, height, bpp, rows


def main():
    width, height, bpp, rows = read_png(sys.argv[1])
    bright = 0
    for y in range(height // 4, 3 * height // 4):
        line = rows[y]
        for x in range(width):
            r, g, b = line[x * bpp:x * bpp + 3]
            if r > 16 or g > 16 or b > 16:
                bright += 1
    print(f"píxeles no negros en la zona central: {bright}")
    if bright > 0:
        sys.exit("✗ La captura muestra contenido: FLAG_SECURE no está activo")
    print("✓ La captura de pantalla sale en negro")


if __name__ == "__main__":
    main()
