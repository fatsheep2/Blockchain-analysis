#!/bin/bash

echo "🧪 测试构建过程..."

# 检查Node.js版本
echo "Node.js版本:"
node --version

# 检查pnpm版本
echo "pnpm版本:"
pnpm --version

# 安装依赖
echo "📦 安装依赖..."
pnpm install --frozen-lockfile

# 构建项目
echo "🔨 构建项目..."
pnpm run build

# 检查构建输出
echo "📁 构建输出:"
ls -la dist/

echo "✅ 构建测试完成！" 