#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------
# Script: generate_signature_gifs.sh
# Propósito: Generar logo_anim.gif (fade-in + hold) y bar.gif (parpadeo)
# Requisitos: ImageMagick (convert, identify), gifsicle
# macOS instalación: brew install imagemagick gifsicle
# Uso:
#   ./scripts/generate_signature_gifs.sh ruta/al/logo.png
# Salida:
#   build/signature/logo_anim.gif
#   build/signature/bar.gif
# -------------------------------------------------------------

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 logo.png [ANCHO_DESTINO] [ALTURA_BARRA]" >&2
  exit 1
fi

LOGO_SRC="$1"
TARGET_W="${2:-120}"      # ancho final del logo
BAR_H="${3:-140}"         # altura de la barra (ajusta si tu bloque es más alto)
OUT_DIR="build/signature"
FRAMES_DIR="$OUT_DIR/frames_logo"
FRAMES=14                  # frames de fade-in
HOLD=18                    # frames estáticos después del fade
FPS=18                     # ~0.77s fade + 1s hold

mkdir -p "$FRAMES_DIR"

if [[ ! -f "$LOGO_SRC" ]]; then
  echo "Archivo no encontrado: $LOGO_SRC" >&2
  exit 1
fi

echo "▶ Escalando logo a ${TARGET_W}px de ancho..."
SCALED="$FRAMES_DIR/logo_scaled.png"
convert "$LOGO_SRC" -resize ${TARGET_W}x "$SCALED"

echo "▶ Generando frames de fade-in..."
for i in $(seq 0 $((FRAMES-1))); do
  t=$(awk -v i=$i -v f=$((FRAMES-1)) 'BEGIN{printf "%.4f", i/f}')
  # alpha = t (lineal)
  ALPHA=$(awk -v t=$t 'BEGIN{printf "%.2f", t}')
  FRAME=$(printf "%s/frame_%02d.png" "$FRAMES_DIR" "$i")
  convert "$SCALED" -alpha set -channel A -evaluate multiply $ALPHA +channel "$FRAME"
done

echo "▶ Agregando frames de hold..."
for i in $(seq 0 $((HOLD-1))); do
  FRAME=$(printf "%s/frame_hold_%02d.png" "$FRAMES_DIR" "$i")
  cp "$SCALED" "$FRAME"
done

echo "▶ Creando GIF animado del logo..."
mkdir -p "$OUT_DIR"
convert -delay $((100/FPS)) -loop 0 "$FRAMES_DIR"/*.png "$OUT_DIR/logo_anim_raw.gif"
echo "▶ Optimizando logo_anim.gif..."
gifsicle -O3 "$OUT_DIR/logo_anim_raw.gif" -o "$OUT_DIR/logo_anim.gif"
rm -f "$OUT_DIR/logo_anim_raw.gif"

echo "▶ Generando bar.gif (parpadeo)..."
BAR_DIR="$OUT_DIR/frames_bar"
mkdir -p "$BAR_DIR"
convert -size 4x${BAR_H} xc:'#364FC7' "$BAR_DIR/bar_on.png"
convert -size 4x${BAR_H} xc:'#8aa2ff' "$BAR_DIR/bar_off.png"
convert -delay 70 "$BAR_DIR/bar_on.png" -delay 25 "$BAR_DIR/bar_off.png" -loop 0 "$OUT_DIR/bar_raw.gif"
gifsicle -O3 "$OUT_DIR/bar_raw.gif" -o "$OUT_DIR/bar.gif"
rm -f "$OUT_DIR/bar_raw.gif"

echo "✅ Listo"
echo "Archivos finales:"
ls -lh "$OUT_DIR"/*.gif
echo "Sube estos dos GIF a Firebase Storage y reemplaza LOGO_ANIM_URL y BAR_ANIM_URL en firma-correo.html"
