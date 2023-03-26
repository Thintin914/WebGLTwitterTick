import { useEffect, useRef } from "react";

export function getCanvas(){
  const c = document.getElementById("webgl-canvas") as HTMLCanvasElement;
  return c;
}

export function getGL() {
  const c = getCanvas();
  const gl = c.getContext("webgl") as WebGLRenderingContext;

  return gl;
}

export function getCanvasAspectRation(){
  const c = getCanvas()
  return c.width / c.height;
}