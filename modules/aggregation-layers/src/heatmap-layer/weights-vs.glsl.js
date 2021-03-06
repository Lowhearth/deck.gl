export default `\
attribute vec3 positions;
attribute float weights;
varying vec4 weightsTexture;
uniform float radiusPixels;
uniform float textureWidth;
uniform vec4 commonBounds;
uniform float intensity;
void main()
{
  weightsTexture = vec4(weights * intensity, 0., 0., 1.);

  float radiusTexels  = radiusPixels * textureWidth / (commonBounds.z - commonBounds.x);
  gl_PointSize = radiusTexels * 2.;

  vec3 commonPosition = project_position(positions, vec2(0));

  // map xy from commonBounds to [-1, 1]
  gl_Position.xy = (commonPosition.xy - commonBounds.xy) / (commonBounds.zw - commonBounds.xy) ;
  gl_Position.xy = (gl_Position.xy * 2.) - (1.);
}
`;
