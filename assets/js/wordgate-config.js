// WordGate 配置脚本
// 这个文件会在构建时由 Hugo 动态生成，包含站点中配置的 WordGate 参数

// 填充全局配置对象
window.wordgate_config = {
  "base_url": {{ site.Params.wordgate.base_url | default "" | jsonify }},
  "app_code": {{ site.Params.wordgate.app_code | default "" | jsonify }},
  "enable_payment": {{ if site.Params.wordgate.enable_payment }}true{{ else }}false{{ end }}
  "currency": {{ site.Params.wordgate.currency | default "USD" | jsonify }}
};