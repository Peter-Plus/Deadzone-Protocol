# Material DSL V1

必填 `schema: material.v1`、`id`、`color`；颜色格式为六位十六进制 `#RRGGBB`。

支持 roughness、metalness、opacity（均为 0..1）、emissive（#RRGGBB）、transparent（boolean）。默认 roughness=.7、metalness=0、opacity=1、emissive=#000000、transparent=false。

使用 Three.js MeshStandardMaterial，低多边形 flatShading。色值由 Three.js 按颜色管理转换后输出 glTF 线性材质。建议非金属 roughness 0.6..1，金属 metalness 0.6..1。需要透明时同时设置 transparent=true 和 opacity<1。

V1 不使用纹理，以几何、颜色、材质建立统一风格。材质必须有独立 `.material.json`；材质引用不是文件路径。
