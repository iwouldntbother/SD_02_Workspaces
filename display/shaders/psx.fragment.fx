// #version 300 es
precision highp float;

varying vec2 vUV;
uniform sampler2D textureSampler;

const float PALETTE_SIZE = 8.0; // Limited color depth

vec3 manualRound(vec3 number) {
    return vec3(floor(number.x + 0.5), floor(number.y + 0.5), floor(number.z + 0.5));
}

float dither2x2(vec2 position, float brightness) {
  int x = int(mod(position.x, 2.0));
  int y = int(mod(position.y, 2.0));
  int index = x + y * 2;
  float limit = 0.0;

  if (x < 8) {
    if (index == 0) limit = 0.25;
    if (index == 1) limit = 0.75;
    if (index == 2) limit = 1.00;
    if (index == 3) limit = 0.50;
  }

  return brightness < limit ? 0.0 : 1.0;
}

// out vec4 fragColor;

void main() {
    // Dithering effect
    vec4 color = texture2D(textureSampler, vUV);
    vec2 ditherPos = mod(gl_FragCoord.xy, 2.0);
    float ditherValue = dither2x2(ditherPos, 1.0);
    color.rgb = color.rgb + ditherValue / 255.0;

    // Quantize to a limited color palette for both animated and non-animated models
    color.rgb = manualRound(color.rgb * PALETTE_SIZE) / PALETTE_SIZE;

    gl_FragColor = color;
}