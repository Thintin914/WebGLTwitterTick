import { useEffect, useRef, useState } from "react";
import { getGL } from "./utils/useCanvas";
import { Bezier } from "bezier-js";

const vertShader = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
   // convert the rectangle from pixels to 0.0 to 1.0
   vec2 zeroToOne = a_position / u_resolution;

   // convert from 0->1 to 0->2
   vec2 zeroToTwo = zeroToOne * 2.0;

   // convert from 0->2 to -1->+1 (clipspace)
   vec2 clipSpace = zeroToTwo - 1.0;

   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

   // pass the texCoord to the fragment shader
   // The GPU will interpolate this value between points.
   v_texCoord = a_texCoord;
}
`;

const fragShader = `
precision lowp float;

// our textures
uniform sampler2D u_image0;
uniform sampler2D u_image1;

// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

uniform vec3 outputColors[9];

uniform float texture2Size;

uniform float limit1;
uniform float limit2;

void main() {

  float zoom1 = texture2Size;
  if (zoom1 > limit1)
    zoom1 = limit1;

  float zoom2 = (1.1 - (texture2Size / 307.0));
  if (zoom2 < limit2){
    zoom2 = limit2;
  }

  vec2 texture1Coord = vec2(floor(zoom1 * v_texCoord.xy) / zoom1);
  texture1Coord = (texture1Coord - vec2(0.6, 0.4)) * zoom2 + vec2(0.6, 0.4);

  vec2 texture2Coord = v_texCoord * zoom1;
  texture2Coord = mod(texture2Coord, 1.0);

  vec4 color0 = texture2D(u_image0, texture1Coord);

  vec4 color1 = texture2D(u_image1, texture2Coord);

  vec3 newColor = outputColors[0];
  float minDist1 = distance(color0.rgb, outputColors[0]);
  for (int i = 1; i < 9; i++) {
      float dist = distance(color0.rgb, outputColors[i]);
      if (dist < minDist1) {
        newColor = outputColors[i];
        minDist1 = dist;
      }
  }

   if (color1.rgb == vec3(1.0, 1.0, 1.0)){
    gl_FragColor = vec4(1.0);
   }else if (color1.a == 1.0){
    gl_FragColor = vec4(newColor.rgb, color1.a);
   }else{
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
   }
}
`;

function loadShader(gl: WebGLRenderingContext, type: number, shader: string) {
  const s = gl.createShader(type);
  if (!s) return;
  gl.shaderSource(s, shader);
  gl.compileShader(s);
  return s;
}

function loadImage(url: string, callback: () => void) {
  var image = new Image();
  image.src = url;
  image.onload = callback;
  return image;
}

function hexToRgb(hex: string) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

const color: {
  name: string;
  default: { r: number; g: number; b: number };
}[] = [
  { name: "red", default: { r: 255, g: 0, b: 102 } },
  { name: "orange", default: { r: 239, g: 151, b: 44 } },
  { name: "yellow", default: { r: 255, g: 204, b: 0 } },
  { name: "green", default: { r: 153, g: 204, b: 0 } },
  { name: "tint", default: { r: 0, g: 204, b: 153 } },
  { name: "blue", default: { r: 51, g: 153, b: 255 } },
  { name: "purple", default: { r: 161, g: 151, b: 180 } },
  { name: "white", default: { r: 240, g: 240, b: 240 } },
  { name: "black", default: { r: 10, g: 10, b: 10 } },
];

export function GLPainter() {
  const count = useRef<number>(0);
  const program = useRef<WebGLProgram | undefined>(undefined);
  const points = useRef<{x: number, y: number}[] | null>(null);

  function loadImages(
    urls: string[],
    callback: (images: HTMLImageElement[]) => WebGLProgram | undefined
  ) {
    var images: HTMLImageElement[] = [];
    var imagesToLoad = urls.length;

    // Called each time an image finished
    // loading.
    var onImageLoad = function () {
      imagesToLoad--;
      // If all the images are loaded call the callback.
      if (imagesToLoad === 0) {
        program.current = callback(images);
      }
    };

    for (var ii = 0; ii < imagesToLoad; ++ii) {
      var image = loadImage(urls[ii], onImageLoad);
      images.push(image);
    }
    return program;
  }

  useEffect(() => {
    if (count.current > 0) return;

    count.current += 1;
    program.current = loadImages(
      ["images/monkey2.png", "images/tick.png"],
      render
    );

    points.current = new Bezier([0,0 , 0.5,0 , 0, 0.2 , 0,1 , 0.5,1]).getLUT(500)
    console.log(points.current)
  }, []);

  return (
    <>
      <br />
      <label>range</label>
      <input
        type="range"
        defaultValue={100}
        min={0}
        max={500}
        step={1}
        onChange={(e) => {
          let val = e.target.valueAsNumber;

          const gl = getGL();
          const location = gl.getUniformLocation(
            program.current!,
            "texture2Size"
          );
          if (!points.current) return;
          gl.uniform1f(location, Math.round(points.current[val].y * 307));
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }}
      />

      {color.map((val, index) => {
        return (
          <>
            <br />
            <label>{val.name}</label>
            <input
              id={val.name + "-input"}
              type="color"
              defaultValue={rgbToHex(
                val.default.r,
                val.default.g,
                val.default.b
              )}
              onChange={(e) => {
                const val = hexToRgb(e.target.value);
                if (!val) return;

                const gl = getGL();
                const location = gl.getUniformLocation(
                  program.current!,
                  "outputColors[" + index + "]"
                );
                gl.uniform3f(location, val.r / 255, val.g / 255, val.b / 255);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
              }}
            />
          </>
        );
      })}

      <br />
      <input
        type="button"
        value="reset"
        onClick={(e) => {
          const gl = getGL();
          color.forEach((val, index) => {
            const location = gl.getUniformLocation(
              program.current!,
              "outputColors[" + index + "]"
            );
            gl.uniform3f(
              location,
              val.default.r / 255,
              val.default.g / 255,
              val.default.b / 255
            );
            const input = document.getElementById(
              val.name + "-input"
            ) as HTMLInputElement;
            if (input) input.value = input.defaultValue;
          });
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }}
      />

      <br />
      <label>icon size limit</label>
      <input
        type="range"
        defaultValue={60}
        min={1}
        max={100}
        step={1}
        onChange={(e) => {
          let val = e.target.valueAsNumber;

          const gl = getGL();
          const location = gl.getUniformLocation(program.current!, "limit1");
          gl.uniform1f(location, val);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }}
      />

      <br />
      <label>zoom-in limit</label>
      <input
        type="range"
        defaultValue={0.03}
        min={0}
        max={1}
        step={0.01}
        onChange={(e) => {
          let val = e.target.valueAsNumber;

          const gl = getGL();
          const location = gl.getUniformLocation(program.current!, "limit2");
          gl.uniform1f(location, val);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }}
      />
    </>
  );
}

function render(images: HTMLImageElement[]) {
  const gl = getGL();
  if (!gl) {
    return;
  }

  // setup GLSL program
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertShader);
  if (!vertexShader) return;

  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragShader);
  if (!fragmentShader) return;
  const program = gl.createProgram();
  if (!program) return;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

  // Create a buffer to put three 2d clip space points in
  var positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Set a rectangle the same size as the image.
  const width = 512;
  const height = 512;
  setRectangle(gl, 0, 0, width, height);

  // provide texture coordinates for the rectangle.
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
    ]),
    gl.STATIC_DRAW
  );

  // create 2 textures
  var textures = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Upload the image into the texture.
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      images[ii]
    );

    // add the texture to the array of textures.
    textures.push(texture);
  }

  // lookup uniforms
  var resolutionLocation = gl.getUniformLocation(program, "u_resolution");

  // lookup the sampler locations.
  var u_image0Location = gl.getUniformLocation(program, "u_image0");
  var u_image1Location = gl.getUniformLocation(program, "u_image1");

  gl.canvas.width = width;
  gl.canvas.height = height;

  gl.viewport(0, 0, width, height);

  // Clear the canvas
  gl.clearColor(1, 1, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Turn on the position attribute
  gl.enableVertexAttribArray(positionLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // Turn on the texcoord attribute
  gl.enableVertexAttribArray(texcoordLocation);

  // bind the texcoord buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

  // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
  gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

  color.forEach((val, index) => {
    const location = gl.getUniformLocation(
      program,
      "outputColors[" + index + "]"
    );
    gl.uniform3f(
      location,
      val.default.r / 255,
      val.default.g / 255,
      val.default.b / 255
    ); // red
  });

  const texture2SizeLocation = gl.getUniformLocation(program, "texture2Size");
  gl.uniform1f(texture2SizeLocation, 100);

  const limit1Location = gl.getUniformLocation(program, "limit1");
  gl.uniform1f(limit1Location, 60);

  const limit2Location = gl.getUniformLocation(program, "limit2");
  gl.uniform1f(limit2Location, 0.03);

  // set the resolution
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

  // set which texture units to render with.
  gl.uniform1i(u_image0Location, 0); // texture unit 0
  gl.uniform1i(u_image1Location, 1); // texture unit 1

  // Set each texture unit to use a particular texture.
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);

  // Draw the rectangle.
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  return program;
}

function setRectangle(
  gl: WebGLRenderingContext,
  x: number,
  y: number,
  width: number,
  height: number
) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW
  );
}
