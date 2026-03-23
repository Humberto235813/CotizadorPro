<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1UVMLBPgN5LxMf_BmtmFiAvjKAQp5BOmg

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Firma de correo animada

Para generar los GIF (logo animado + barra parpadeante) se añadió el script:

Ruta: `scripts/generate_signature_gifs.sh`

Requisitos (macOS):

```bash
brew install imagemagick gifsicle
```

Uso básico:

```bash
./scripts/generate_signature_gifs.sh assets/logo.png
```

Produce:

```text
build/signature/logo_anim.gif
build/signature/bar.gif
```

Luego:

1. Sube ambos a Firebase Storage (carpeta `signatures/`).
2. Reemplaza `LOGO_ANIM_URL` y `BAR_ANIM_URL` en `firma-correo.html`.
3. Abre el HTML en el navegador y copia la vista renderizada a tu cliente de correo.
4. Elimina la página temporal “Assets Firma” cuando termines.

Parámetros opcionales:

```bash
./scripts/generate_signature_gifs.sh assets/logo.png 120 140
```

Donde `120` es el ancho destino y `140` la altura de la barra.

Optimización adicional del logo (ya está optimizado por el script, pero puedes volver a correr):

```bash
gifsicle -O3 build/signature/logo_anim.gif -o build/signature/logo_anim.gif
```

