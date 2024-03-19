precision highp float;

// Attributes
attribute vec3 position;
attribute vec2 uv;

// Uniforms
uniform mat4 viewMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

// Varying
varying vec2 vUV;

void main(void) {

  vUV = uv;
  
  vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
  
  gl_Position = projectionMatrix * modelViewPosition;
  gl_Position /= gl_Position.w ;

}