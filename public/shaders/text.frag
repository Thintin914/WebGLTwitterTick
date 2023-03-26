precision mediump float;
// Input texture
uniform sampler2D u_texture;
varying vec2 v_texCoord;

uniform sampler2D u_texture2;

// Output color palette
const uniform vec3[4] outputColors = vec3[4](
    vec3(1.0, 0.0, 0.0),
    vec3(0.0, 0.0, 1.0),
    vec3(0.0, 1.0, 0.0),
    vec3(1.0, 1.0, 1.0)
);

// Main function
void main()
{
    // Get the texture color
    vec4 texColor = texture(u_texture, v_texCoord.xy);

    // Map the texture color to the closest output color
    vec3 newColor = outputColors[0];
    float minDist = distance(texColor.rgb, outputColors[0]);
    for (int i = 1; i < 4; i++) {
        float dist = distance(texColor.rgb, outputColors[i]);
        if (dist < minDist) {
            newColor = outputColors[i];
            minDist = dist;
        }
    }

    // Output the new color
    gl_FragColor = vec4(newColor, texColor.a);
}