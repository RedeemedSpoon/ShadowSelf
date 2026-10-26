<script module lang="ts">
  import type {GlobeVector, RoutingMarker} from '$type';

  function spherePoint(longitude: number, latitude: number): GlobeVector {
    const lambda = (longitude * Math.PI) / 180;
    const phi = (latitude * Math.PI) / 180;
    const parallel = Math.cos(phi);

    return [parallel * Math.sin(lambda), Math.sin(phi), parallel * Math.cos(lambda)];
  }

  function projection(longitude: number) {
    const lambda = (longitude * Math.PI) / 180;
    const phi = (15 * Math.PI) / 180;
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    return ([x, y, z]: GlobeVector) => {
      const depth = x * sinLambda + z * cosLambda;

      return {
        x: x * cosLambda - z * sinLambda,
        y: y * cosPhi - depth * sinPhi,
        z: y * sinPhi + depth * cosPhi,
      };
    };
  }

  export function projectRoutingMarker(longitude: number, latitude: number, view: number): RoutingMarker {
    const point = projection(view)(spherePoint(longitude, latitude));

    return {
      x: 300 + point.x * 164,
      y: 214 - point.y * 164,
      visibility: Math.max(0, Math.min(point.z / 0.15, 1)),
    };
  }
</script>

<script lang="ts">
  import {onMount} from 'svelte';
  import geometry from './world-land.json';

  let {longitude}: {longitude: number} = $props();
  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D | null = null;
  let ready = $state(false);
  let coasts: GlobeVector[][] = [];
  let land: GlobeVector[] = [];
  let graticule: GlobeVector[][] = [];

  onMount(() => {
    context = canvas.getContext('2d');
    coasts = geometry.coastlines.map((ring) => ring.map(([lon, lat]) => spherePoint(lon, lat)));
    land = geometry.points.map(([lon, lat]) => spherePoint(lon, lat));

    for (let latitude = -60; latitude <= 60; latitude += 30) {
      graticule.push(Array.from({length: 181}, (_, index) => spherePoint(index * 2 - 180, latitude)));
    }

    for (let meridian = -180; meridian < 180; meridian += 30) {
      graticule.push(Array.from({length: 91}, (_, index) => spherePoint(meridian, index * 2 - 90)));
    }

    ready = true;
  });

  $effect(() => {
    if (ready && context) {
      drawGlobe(context, longitude);
    }
  });

  function trace(context: CanvasRenderingContext2D, rings: GlobeVector[][], project: ReturnType<typeof projection>) {
    context.beginPath();

    for (const ring of rings) {
      let visible = false;

      for (const vector of ring) {
        const point = project(vector);

        if (point.z >= 0) {
          const x = 164 + point.x * 164;
          const y = 164 - point.y * 164;

          if (visible) {
            context.lineTo(x, y);
          } else {
            context.moveTo(x, y);
          }
        }

        visible = point.z >= 0;
      }
    }

    context.stroke();
  }

  function drawGlobe(context: CanvasRenderingContext2D, longitude: number) {
    const project = projection(longitude);
    context.setTransform(2, 0, 0, 2, 0, 0);
    context.clearRect(0, 0, 328, 328);
    context.lineWidth = 0.6;
    context.strokeStyle = '#9b91ff26';
    trace(context, graticule, project);
    context.lineWidth = 0.45;
    context.strokeStyle = '#b8adff66';
    trace(context, coasts, project);
    context.fillStyle = '#b8adff99';
    context.beginPath();

    for (const vector of land) {
      const point = project(vector);

      if (point.z <= 0.02) {
        continue;
      }

      const x = 164 + point.x * 164;
      const y = 164 - point.y * 164;
      const radius = 0.45 + point.z * 0.5;
      context.moveTo(x + radius, y);
      context.arc(x, y, radius, 0, Math.PI * 2);
    }

    context.fill();
  }
</script>

<canvas bind:this={canvas} width="656" height="656" aria-hidden="true"></canvas>

<style>
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
