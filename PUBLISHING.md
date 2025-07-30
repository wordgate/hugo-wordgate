# WordGate 模块发布指南

本文档提供了如何将 WordGate Hugo 模块发布到 Git 仓库，以及如何在其他项目中使用它的详细步骤。

## 1. 发布到 Git 仓库

### 步骤 1: 初始化 Git 仓库

如果你还没有初始化 Git 仓库，请运行以下命令：

```bash
git init
```

### 步骤 2: 添加文件

添加所有文件到 Git 暂存区：

```bash
git add .
```

### 步骤 3: 提交更改

提交你的更改：

```bash
git commit -m "Initial commit of Hugo WordGate module"
```

### 步骤 4: 添加远程仓库

首先，在 GitHub、GitLab 或其他 Git 托管服务上创建一个新的空仓库。然后，添加该仓库作为远程仓库：

```bash
git remote add origin https://github.com/wordgate/hugo-wordgate.git
```

### 步骤 5: 推送到远程仓库

将你的代码推送到远程仓库：

```bash
git push -u origin main
```

### 步骤 6: 创建版本标签

为了便于版本管理，创建一个 Git 标签：

```bash
git tag v1.0.0
git push --tags
```

## 2. 在其他项目中使用该模块

### 步骤 1: 初始化 Hugo 模块

在你的 Hugo 项目目录中初始化 Hugo 模块系统：

```bash
cd your-hugo-project
hugo mod init github.com/yourusername/your-hugo-project
```

### 步骤 2: 在配置中导入 WordGate 模块

在你的 `config.yaml` 或 `hugo.yaml` 文件中添加以下内容：

```yaml
module:
  imports:
    - path: github.com/yourusername/hugo-wordgate
```

### 步骤 3: 获取模块

获取并更新模块：

```bash
hugo mod get -u
```

### 步骤 4: 配置 WordGate

在你的配置文件中添加必要的 WordGate 配置（参见 `example-site-config.yaml` 中的示例）。

### 步骤 5: 使用 WordGate 组件

现在，你可以在你的 Hugo 项目中使用 WordGate 的组件，例如：

- 在模板中使用局部模板：`{{ partial "wordgate-init.html" . }}`
- 在内容中使用短代码：`{{< wordgate-login >}}`
- 创建使用 WordGate 布局的页面：`layout: "wordgate-pay"`

## 3. 更新模块

### 对于模块维护者

当你需要更新模块时：

1. 修改代码
2. 提交更改：`git commit -m "Update description"`
3. 创建新的版本标签：`git tag v1.0.1`
4. 推送更改：`git push && git push --tags`

### 对于模块使用者

当你需要更新你项目中使用的模块时：

```bash
hugo mod get -u
```

如果你需要使用特定版本的模块，可以在配置文件中指定版本：

```yaml
module:
  imports:
    - path: github.com/yourusername/hugo-wordgate
      version: v1.0.0
```

## 4. 故障排除

### 模块不加载

如果模块未正确加载，尝试以下操作：

```bash
hugo mod clean
hugo mod get -u
```

### 模板或短代码找不到

确保你的项目配置中正确导入了模块，并且没有本地模板覆盖模块提供的模板。 