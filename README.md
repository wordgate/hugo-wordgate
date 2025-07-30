# WordGate Hugo模块

为Hugo站点提供WordGate电子商务和会员管理功能的集成模块。

## 安装说明

### 1. 在配置中导入模块

将以下内容添加到您的Hugo配置文件（config.toml、hugo.yaml或hugo.yml）中：

```yaml
module:
  imports:
    - path: github.com/wordgate/hugo-wordgate
```

### 2. 本地开发时使用相对路径

如果您在本地开发环境中使用，在项目根目录创建一个`go.mod`文件：

```go
module github.com/yourname/yoursite

go 1.20

require github.com/wordgate/hugo-wordgate v0.0.0

replace github.com/wordgate/hugo-wordgate => ../hugo-wordgate  // 调整路径以匹配您的目录结构
```

### 3. 设置WordGate配置

在您的Hugo配置文件中添加必要的WordGate配置：

```yaml
params:
  wordgate:
    base_url: "https://your-wordgate-api-url.com"  # WordGate API服务地址
    app_code: "your_app_code_here"                 # WordGate应用代码
    enable_payment: true                           # 是否启用支付功能
```

## 自动资源注入

本模块会自动将必要的CSS和JavaScript资源注入到您的网站中，包括：

- Pure CSS库
- Alpine.js库
- WordGate专用样式和脚本

**注意**：自动资源注入需要Hugo v0.111.0或更高版本。

## 可用的模板和短代码

本模块提供以下功能：

- 购物车功能
- 会员登录和注册
- 支付页面
- 订单管理
- 会员资格管理

### 短代码使用说明

#### wordgate-cart-add-btn

添加商品到购物车的按钮组件。

```markdown
{{< wordgate-cart-add-btn 
    code="product-001" 
    title="示例商品" 
    price=9900 
    image="/images/product.jpg"
    type="product"
    require_address=true
    allow_multiple=true
    button_text="立即购买"
    success_text="已添加到购物车"
>}}
```

**参数说明：**

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `code` | string | 是 | - | 商品代码，必须唯一 |
| `title` | string | 否 | "未命名商品" | 商品标题 |
| `price` | number | 否 | 0 | 商品价格（分为单位） |
| `image` | string | 否 | "" | 商品图片URL |
| `type` | string | 否 | "" | 商品类型 |
| `require_address` | boolean | 否 | false | 是否需要收货地址 |
| `allow_multiple` | boolean | 否 | false | 是否允许选择数量 |
| `button_text` | string | 否 | "加入购物车" | 按钮文本 |
| `success_text` | string | 否 | "已添加到购物车" | 成功提示文本 |

#### wordgate-cart-list

购物车列表组件，显示购物车中的商品并提供结算功能。

```markdown
{{< wordgate-cart-list >}}
```

此组件会自动检测购物车中的商品是否需要收货地址，如果需要则显示地址选择界面。

请参阅详细文档了解如何使用这些功能。

## 需求和兼容性

- Hugo v0.111.0+
- 支持HTML5的现代浏览器
- 基于Pure CSS的响应式设计

## 许可证

请参阅LICENSE文件了解许可信息。