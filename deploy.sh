#!/bin/bash

# 部署脚本 - 将修改后的文件上传到服务器

# 配置信息
SERVER_USER="root"
SERVER_HOST="8.155.46.226:3004"
SERVER_PATH="/var/www/api/"

# 显示帮助信息
echo "=== 部署脚本 ==="
echo "此脚本将修改后的文件上传到服务器，并重启API服务。"
echo "请确保已经修改了以下文件："
echo "- server/services/joinQueryService.js"
echo ""

# 确认是否继续
read -p "是否继续部署? (y/n): " confirm
if [ "$confirm" != "y" ]; then
  echo "部署已取消"
  exit 0
fi

# 上传修改后的文件
echo "正在上传修改后的文件..."
scp server/services/joinQueryService.js $SERVER_USER@$SERVER_HOST:$SERVER_PATH/server/services/
scp README-API-UPDATE.md $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

# 重启API服务
echo "正在重启API服务..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && pm2 restart api-server"

echo "部署完成！" 