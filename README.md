# MySky Astro Viewer

Visor astronomico web con tres modos de representacion del cielo, timeline nocturno, selector de dia, capas de objetos celestes, datos meteorologicos en tiempo real y configuracion persistente de ubicacion.

## Funcionalidades principales

- Vista 360 circular para orientacion completa.
- Vista panoramica arrastrable para planificacion de encuadres.
- Vista de inclinacion orientada al centro galactico (centrada en la card).
- Timeline nocturno con hitos: ocaso, crepusculo astronomico, salida/ocultacion de Via Lactea, salida/puesta del Centro Galactico y amanecer.
- Selector de dia: rango desde hoy hasta +2 meses, con label flotante de fecha al arrastrar.
- Panel de datos astronomicos (Altura y Azimut del CG, altura maxima y inclinacion de la Via Lactea) debajo de las tres vistas.
- Condiciones meteorologicas actuales y prevision compacta en subcards (+6h, +12h, +24h, +72h).
- Capas de objetos celestes: planetas, constelaciones y deep-sky.
- Busqueda de objetos y resaltado en el mapa.
- Configuracion de ubicacion con:
  - Nombre de ubicacion.
  - Localizaciones favoritas guardables y seleccionables.
  - Coordenadas GPS por clic en mapa o busqueda de direccion.
  - Carga de perfil de horizonte en SVG.
- Ajuste de focal simulada (n/a, 16mm, 35mm, 50mm) para Panoramica e Inclinacion.
- Capa de satelite superpuesta en Vista 360 (con zoom y arrastre Ctrl+drag).
- Control de visibilidad de capas graficas desde el modal de configuracion.

## Layout de la interfaz

- **Cabecera**: titulo de ubicacion, selector de fecha, botones de dia anterior/siguiente, actualizar, icono de manual (📖) e icono de configuracion (⚙️).
- **Columna izquierda**: resumen de tiempos astronomicos, informacion del calculo y leyenda.
- **Zona central**: visor (360 / Panoramica / Inclinacion), panel de datos, timeline horario y selector de dia.
- **Columna derecha**: condiciones meteorologicas actuales + prevision, capas de objetos celestes.

## Archivos clave

- `index.php`: render principal, calculos astronomicos en servidor, CSS embebido de layout.
- `app.js`: logica de render interactivo, proyecciones, dia/noche, focales, dragging y eventos.
- `style.css`: estilos globales compartidos.
- `config.json`: configuracion persistente (ubicacion actual, favoritos y SVG de horizonte).
- `save_config.php`: endpoint para guardar configuracion y subir SVG.
- `manual.html`: manual de usuario accesible desde el icono 📖 de la cabecera.

## Uso

1. Servir el proyecto en un servidor PHP (por ejemplo, `/var/www/html/astro`).
2. Abrir `index.php` en el navegador.
3. Seleccionar fecha con el input o los botones ← →, pulsar Actualizar.
4. Ajustar la hora con el slider del timeline; usar el selector de dia para cambiar de jornada.
5. Abrir configuracion (icono ⚙️) para fijar ubicacion, guardar favoritas y ajustar horizonte.

## Manual de usuario

Accesible desde el icono 📖 de la cabecera superior. Incluye:

- Guia paso a paso de uso.
- Descripcion de vistas, timeline, capas de objetos y meteorologia.
- Descripcion del modal de configuracion y persistencia.
