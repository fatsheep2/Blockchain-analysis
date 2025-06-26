# Blockchain Analysis

## 项目简介

Blockchain Analysis 是一个基于 Vue.js 的区块链地址分析应用。用户可以输入区块链地址，获取该地址的详细信息和分析结果。该应用支持以太坊和波场地址的分析。

## 功能

- **地址输入和检测**：支持输入和检测波场和以太坊(待支持)地址。
- **地址分析**：获取地址的代币余额、交易数据、地址信息和资源信息。
- **数据展示**：显示地址总结、钱包余额、交易图表和交易列表。
- **分页功能**：交易记录支持分页显示，可选择每页显示数量（10/20/50/100条）。
- **完整交易记录**：可选择获取地址的所有交易记录（可能需要较长时间）。
- **截图功能**：支持对分析结果进行截图，可选择保存到剪贴板或下载文件。
- **分享功能**：支持分享分析报告链接。

## 技术栈

- Vue 3
- Element Plus
- Vite
- Axios
- ECharts
- html2canvas

## 在线演示

🌐 **官方网站**: [https://usdtscan.life](https://usdtscan.life)

🌐 **GitHub Pages**: [https://fatsheep2.github.io/Blockchain-analysis/](https://fatsheep2.github.io/Blockchain-analysis/)

## 安装和运行

### 安装依赖

首先，确保已安装 [Node.js](https://nodejs.org/) 和 [pnpm](https://pnpm.io/)。

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm run dev
```

### 构建项目

```bash
pnpm run build
```

### 预览构建结果

```bash
pnpm run preview
```

### 本地测试构建

```bash
chmod +x test-build.sh
./test-build.sh
```

## 自动部署

本项目配置了GitHub Actions自动部署到GitHub Pages：

1. **推送代码到main分支**会自动触发部署
2. **部署完成后**可通过GitHub Pages访问
3. **支持PR构建测试**，确保代码质量

### 部署设置

1. 进入仓库设置 → Pages
2. 选择 "GitHub Actions" 作为源
3. 推送代码到main分支即可自动部署

## 目录结构

- `src/main.js`：应用程序入口文件。
- `src/App.vue`：应用程序主组件。
- `src/components/`：包含各种功能组件。
- `src/api/`：API接口模块。
- `src/utils/`：包含工具函数。
- `.github/workflows/`：GitHub Actions配置。

## 主要功能说明

### 交易记录分页
- 支持分页显示交易记录
- 可选择每页显示数量：10、20、50、100条
- 提供页码导航和上一页/下一页按钮
- 显示当前页范围和总记录数

### 获取所有交易记录
- 可选择获取地址的所有交易记录
- 自动分页获取，避免API限制
- 显示获取进度和状态
- 适用于需要完整交易历史的场景

### 截图功能
- 支持三种截图模式：
  - 概要信息：仅包含地址概要和钱包余额
  - 概要+图表：包含图表分析部分
  - 完整报告：包含所有分析内容
- 支持保存到剪贴板或下载文件
- 自动处理图片加载和图表渲染

## 贡献

欢迎贡献代码！请提交 Pull Request 或报告问题。

## AI声明
本项目均由`AI`生成,无一行代码为手写,`logo`使用`chatgpt`生成,项目代码使用`cursor`与`Roo Code`生成,特此声明~

## 许可证

本项目使用 MIT 许可证。