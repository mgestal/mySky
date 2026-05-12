# MySky Astro Viewer

Visor astronomico web con tres modos de representacion del cielo, timeline nocturno, capas de objetos celestes y configuracion persistente de ubicacion.

## Funcionalidades principales

- Vista 360 circular para orientacion completa.
- Vista panoramica arrastrable para planificacion de encuadres.
- Vista de inclinacion orientada al centro galactico.
- Timeline con hitos (ocaso, crepusculo, via lactea, centro galactico, amanecer).
- Capas de objetos: planetas, constelaciones y deep-sky.
- Busqueda de objetos y resaltado en el mapa.
- Configuracion de ubicacion con:
  - Nombre de ubicacion.
  - Coordenadas GPS por clic en mapa.
  - Busqueda de direccion (geocodificacion).
  - Carga de perfil de horizonte en SVG.

## Archivos clave

- `index.php`: render principal y calculos en servidor.
- `app.js`: logica de render y controles de interaccion.
- `style.css`: estilos globales.
- `config.json`: configuracion persistente (ubicacion y SVG de horizonte).
- `save_config.php`: endpoint para guardar configuracion y subir SVG.
- `manual.html`: manual de usuario accesible desde la UI.

## Uso

1. Servir el proyecto en tu servidor PHP (por ejemplo, `/var/www/html/astro`).
2. Abrir `index.php` en navegador.
3. Ajustar fecha/hora y explorar las vistas.
4. Entrar en `Configuracion` para fijar ubicacion y horizonte.

## Manual de usuario

Desde la columna derecha de la interfaz:

- Card `Manual de usuario` -> abre `manual.html`.

El manual incluye:

- Guia paso a paso de uso.
- Explicacion de vistas, timeline, capas y configuracion.
- Galeria visual con recursos disponibles en el proyecto.
