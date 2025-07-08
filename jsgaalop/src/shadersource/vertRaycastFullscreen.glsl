#version 300 es
precision highp float;

uniform vec2 focal;

out vec2 v_screen;//screen coords [-1,1]
out vec2 v_rayDirXY; // not normalized
out vec2 v_uv;//uv cords[0,1]

void main(void) {
  vec2 pos[3] = vec2[](
    vec2(-1.0, -1.0),
    vec2(3.0, -1.0),
    vec2(-1.0, 3.0)
  );

  vec2 screen = pos[gl_VertexID]; //screen coords [-1,1]

  v_uv = (screen + 1.) * 0.5;
  v_screen = screen;
  gl_Position = vec4(screen, 0., 1.);
  v_rayDirXY = screen / focal;
}