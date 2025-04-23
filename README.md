# Blockchain Analysis

## 项目简介

Blockchain Analysis 是一个基于 Vue.js 的区块链地址分析应用。用户可以输入区块链地址，获取该地址的详细信息和分析结果。该应用支持以太坊和波场地址的分析。

## 功能

- **地址输入和检测**：支持输入和检测波场和以太坊(待支持)地址。
- **地址分析**：获取地址的代币余额、交易数据、地址信息和资源信息。
- **数据展示**：显示地址总结、钱包余额、交易图表和交易列表。
- **截图功能**：支持对分析结果进行截图。

## 技术栈

- Vue 3
- Element Plus
- Vite
- Axios
- ECharts
- html2canvas

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

## 目录结构

- `src/main.js`：应用程序入口文件。
- `src/App.vue`：应用程序主组件。
- `src/components/`：包含各种功能组件。
- `src/utils/`：包含工具函数。

## 贡献

欢迎贡献代码！请提交 Pull Request 或报告问题。

## AI声明
本项目均由`AI`生成,无一行代码为手写,`logo`使用`chatgpt`生成,项目代码使用`cursor`与`Roo Code`生成,特此声明~

## 许可证

本项目使用 MIT 许可证。