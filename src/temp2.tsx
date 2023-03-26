import { useEffect, useRef, useState } from "react";
import { getCanvas, getGL } from "./utils/useCanvas";

// Create vertex and fragment shaders
const vertexShaderSource = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;
const fragmentShaderSource = `
precision mediump float;

uniform sampler2D u_texture1;
varying vec2 v_texCoord;

uniform sampler2D u_texture2;

uniform vec3 outputColors[9];

void main()
{

    vec4 texColor = texture2D(u_texture1, v_texCoord);

    vec3 newColor = outputColors[0];
    float minDist = distance(texColor.rgb, outputColors[0]);
    for (int i = 1; i < 9; i++) {
        float dist = distance(texColor.rgb, outputColors[i]);
        if (dist < minDist) {
            newColor = outputColors[i];
            minDist = dist;
        }
    }

    gl_FragColor = vec4(newColor, texColor.a);
}

`;

function loadShader(gl: WebGLRenderingContext, type: number, shader: string) {
  const s = gl.createShader(type);
  if (!s) return;
  gl.shaderSource(s, shader);
  gl.compileShader(s);
  return s;
}

const images: string[] = ["images/icon.png", "images/berry.png"];

export function GLPainter() {
  const program = useRef<WebGLProgram | null>(null);
  const textures = useRef<WebGLTexture[]>([]);
  const [texLength, setTexLength] = useState<number>(0);

  useEffect(() => {
    if (textures.current.length !== 2) return;

    const gl = getGL();

    for (let i = 0; i < textures.current.length; i++) {
      const location = gl.getUniformLocation(
        program.current!,
        "u_texture" + (i + 1)
      );
      gl.uniform1i(location, i);
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, textures.current[i]);
    }

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw texture
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  }, [texLength]);

  useEffect(() => {
    if (program.current) return;

    const gl = getGL();

    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    if (!vertexShader) return;

    const fragmentShader = loadShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );
    if (!fragmentShader) return;

    // Create program and link shaders
    program.current = gl.createProgram();
    if (!program.current) return;

    gl.attachShader(program.current, vertexShader);
    gl.attachShader(program.current, fragmentShader);
    gl.linkProgram(program.current);

    // Set vertex attributes and uniforms
    const positionAttributeLocation = gl.getAttribLocation(
      program.current,
      "a_position"
    );
    const texCoordAttributeLocation = gl.getAttribLocation(
      program.current,
      "a_texCoord"
    );

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, 1, 1, 1, -1, -1, -1]),
      gl.STATIC_DRAW
    );

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      gl.STATIC_DRAW
    );


    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(texCoordAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const outputColorsLocation0 = gl.getUniformLocation(
      program.current,
      "outputColors[0]"
    );
    const outputColorsLocation1 = gl.getUniformLocation(
      program.current,
      "outputColors[1]"
    );
    const outputColorsLocation2 = gl.getUniformLocation(
      program.current,
      "outputColors[2]"
    );
    const outputColorsLocation3 = gl.getUniformLocation(
      program.current,
      "outputColors[3]"
    );
    const outputColorsLocation4 = gl.getUniformLocation(
      program.current,
      "outputColors[4]"
    );
    const outputColorsLocation5 = gl.getUniformLocation(
      program.current,
      "outputColors[5]"
    );
    const outputColorsLocation6 = gl.getUniformLocation(
      program.current,
      "outputColors[6]"
    );
    const outputColorsLocation7 = gl.getUniformLocation(
      program.current,
      "outputColors[7]"
    );
    const outputColorsLocation8 = gl.getUniformLocation(
      program.current,
      "outputColors[8]"
    );

    gl.uniform3f(outputColorsLocation0, 1, 0, 0.4);
    gl.uniform3f(outputColorsLocation1, 1, 0.6, 0.2);
    gl.uniform3f(outputColorsLocation2, 1, 0.8, 0);
    gl.uniform3f(outputColorsLocation3, 0.2, 0.4, 1);
    gl.uniform3f(outputColorsLocation4, 0.2, 0.8, 0.8);
    gl.uniform3f(outputColorsLocation5, 0, 0.4, 0.8);
    gl.uniform3f(outputColorsLocation6, 0.4, 0, 1);
    gl.uniform3f(outputColorsLocation7, 0, 0, 0);
    gl.uniform3f(outputColorsLocation8, 1, 1, 1);

    for (let i = 0; i < images.length; i++) {
      var image = new Image();
      image.src = images[i];
      image.onload = () => {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image
        );

        gl.canvas.width = image.width;
        gl.canvas.height = image.height;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        textures.current.push(texture!);
        setTexLength(textures.current.length);
      };
    }
    
  }, []);

  useEffect(() => {
    const canvas = getCanvas();
    const gl = getGL();

    const scroll = (e: any) => {
      console.log(program.current);
      let y = e.deltaY > 0 ? -1 : 1;

      const pixelSizeLocation = gl.getUniformLocation(
        program.current!,
        "pixel"
      );
      gl.uniform1f(pixelSizeLocation, 10000.0);
    };

    canvas.addEventListener("wheel", scroll, false);

    return () => {
      canvas.removeEventListener("wheel", scroll);
    };
  }, []);

  return <></>;
}
