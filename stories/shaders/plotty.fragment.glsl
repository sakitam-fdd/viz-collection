precision mediump float;
// our texture
uniform sampler2D u_textureData;
uniform sampler2D u_textureScale;
uniform vec2 u_textureSize;
uniform vec2 u_domain;
uniform float u_noDataValue;
uniform bool u_clampLow;
uniform bool u_clampHigh;
// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;
void main() {
  vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
  float value = texture2D(u_textureData, v_texCoord)[0];
  if (value == u_noDataValue)
    gl_FragColor = vec4(0.0, 0, 0, 0.0);
  else if ((!u_clampLow && value < u_domain[0]) || (!u_clampHigh && value > u_domain[1]))
    gl_FragColor = vec4(0, 0, 0, 0);
  else {
    float normalisedValue = (value - u_domain[0]) / (u_domain[1] - u_domain[0]);
    gl_FragColor = texture2D(u_textureScale, vec2(normalisedValue, 0));
  }
}
