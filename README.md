# MySky Astro Viewer

Visor astronomico web con cuatro modos de representacion, timeline nocturno, selector de dia, capas de objetos celestes, datos meteorologicos en tiempo real y configuracion persistente de ubicacion.

## Funcionalidades principales

- Vista 360 circular para orientacion completa.
- Vista panoramica arrastrable para planificacion de encuadres.
- Vista de inclinacion orientada al centro galactico (centrada en la card).
- Vista de perfil del terreno embebida desde Peakfinder.
- Timeline nocturno con hitos: ocaso, crepusculo astronomico, salida/ocultacion de Via Lactea, salida/puesta del Centro Galactico y amanecer.
- Selector de dia: rango desde hoy hasta +2 meses, con label flotante de fecha al arrastrar.
- Panel de datos astronomicos (Altura y Azimut del CG, altura maxima y inclinacion de la Via Lactea) debajo de las tres vistas.
- Condiciones meteorologicas actuales y prevision compacta en subcards (+6h, +12h, +24h, +72h).
- Capas de objetos celestes: planetas, constelaciones y deep-sky.
- Busqueda de objetos y resaltado en el mapa.
- Configuracion de ubicacion con:
  - Nombre de ubicacion.
  - Localizaciones favoritas guardables y seleccionables.
  - Coordenadas GPS por clic en mapa (con cambio Mapa/Satelite) o busqueda de direccion.
  - Carga de perfil de horizonte en SVG.
- Sincronizacion de Peakfinder:
  - Usa por defecto las coordenadas de la ubicacion activa o de la favorita cargada.
  - Si la capa de satelite esta activa en Vista 360, `Ctrl + arrastrar` mueve el mapa y actualiza las coordenadas enviadas a Peakfinder.
  - La hora que se pasa a Peakfinder es siempre la puesta de sol calculada para el dia activo (no varía con el timeline).
  - La sincronizacion es de la app hacia Peakfinder; el iframe externo no devuelve de forma fiable sus coordenadas internas a la aplicacion.
- Ajuste de focal simulada (n/a, 16mm, 35mm, 50mm) para Panoramica e Inclinacion.
- Capa de satelite superpuesta en Vista 360 (con zoom y arrastre Ctrl+drag).
- Control de visibilidad de capas graficas desde el modal de configuracion.

## Vista de perfil del terreno (Peakfinder)

La pestaña **Perfil** muestra un iframe incrustado de [Peakfinder](https://www.peakfinder.com/es/) con el perfil del horizonte real alrededor de la ubicacion configurada.

### Acceso

Boton **Perfil** en la fila de botones de la card de Simulacion (junto a 360°, Pano e Incl.).

### Comportamiento

- **Coordenadas**: se toman de la ubicacion activa o de la favorita cargada. Si en Vista 360 se mueve el mapa satelite con `Ctrl + arrastrar`, Peakfinder pasa a usar temporalmente el centro de ese mapa.
- **Fecha/hora**: siempre se usa la puesta de sol calculada para el dia activo, independientemente de la posicion del slider del timeline.
- **Enlace externo**: el boton «Abrir en Peakfinder» de la barra superior abre la misma URL en una pestaña nueva.
- **Limitacion de sincronizacion**: la comunicacion es unidireccional (MySky → Peakfinder). El iframe no puede devolver coordenadas ni cambios realizados dentro de Peakfinder a la aplicacion.

## Layout de la interfaz

- **Cabecera**: titulo de ubicacion, selector de fecha, botones de dia anterior/siguiente, actualizar, icono de manual (📖) e icono de configuracion (⚙️).
- **Columna izquierda**: resumen de tiempos astronomicos, informacion del calculo y leyenda.
- **Zona central**: visor (360 / Panoramica / Inclinacion / Perfil), panel de datos, timeline horario y selector de dia.
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
- Descripcion de vistas, timeline, capas de objetos, meteorologia y perfil del terreno.
- Descripcion del modal de configuracion y persistencia.
