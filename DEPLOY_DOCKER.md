# Docker 部署指南

本文按 Ubuntu 22.04/24.04、普通云服务器、项目目录 `/opt/zhangfen` 编写。建议最低配置为 2 核 CPU、2 GB 内存；服务器必须能访问 DeepSeek 和火山引擎 API。

## 1. 安装 Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
newgrp docker
docker version
docker compose version
```

## 2. 上传项目

在本地 Windows PowerShell 执行。压缩包会排除依赖、构建产物、虚拟环境和真实密钥：

```powershell
cd E:\python\code
tar --exclude=Zhangfen/frontend/node_modules --exclude=Zhangfen/frontend/dist --exclude=Zhangfen/frontend/*.log --exclude=Zhangfen/backend/venv --exclude=Zhangfen/backend/__pycache__ --exclude=Zhangfen/backend/.env -czf Zhangfen-deploy.tar.gz Zhangfen
scp .\Zhangfen-deploy.tar.gz USER@SERVER_IP:/tmp/
```

登录服务器并解压：

```bash
ssh USER@SERVER_IP
sudo mkdir -p /opt/zhangfen
sudo tar -xzf /tmp/Zhangfen-deploy.tar.gz -C /opt/zhangfen --strip-components=1
sudo chown -R "$USER":"$USER" /opt/zhangfen
cd /opt/zhangfen
```

也可以用 Git：把项目推到私有仓库后，在服务器执行 `git clone 仓库地址 /opt/zhangfen`。

## 3. 配置生产密钥

```bash
cd /opt/zhangfen
cp backend/.env.example backend/.env
nano backend/.env
chmod 600 backend/.env
```

至少替换 `DEEPSEEK_API_KEY`。诊断继续使用 `deepseek-reasoner`，其他 AI 功能使用 `deepseek-chat`。如果没有火山引擎 Key，删除或留空 `VOLCENGINE_API_KEY`，系统会降级为无 AI 配图。

不要把 `backend/.env` 放进镜像、压缩包、Git 或聊天记录。

## 4. 启动服务

先确认 80 端口没有被占用：

```bash
sudo ss -lntp | grep ':80 ' || true
docker compose config
docker compose build --pull
docker compose up -d
docker compose ps
docker compose logs -f --tail=100
```

看到 `backend` 为 `healthy`、`frontend` 为 `running/healthy` 后按 `Ctrl+C` 退出日志，不会停止容器。

## 5. 验证与放行端口

```bash
curl http://127.0.0.1/api/health
curl -I http://127.0.0.1/
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

同时在云厂商安全组中放行 TCP `22`、`80`；使用 HTTPS 时再放行 `443`。浏览器打开 `http://SERVER_IP`。后端 8000 端口只在 Docker 内部暴露，不应对公网开放。

## 6. 域名和 HTTPS（推荐）

先把域名 A 记录指向服务器公网 IP。然后创建 Compose 自动读取的根目录 `.env`，让应用只监听服务器本机 `8080`：

```bash
cd /opt/zhangfen
printf 'APP_BIND=127.0.0.1\nAPP_PORT=8080\n' > .env
docker compose up -d
```

创建 `/opt/zhangfen/Caddyfile`：

```caddyfile
your-domain.com {
    reverse_proxy 127.0.0.1:8080
}
```

用 Docker 启动 Caddy：

```bash
docker run -d --name zhangfen-caddy --restart unless-stopped --network host \
  -v /opt/zhangfen/Caddyfile:/etc/caddy/Caddyfile:ro \
  -v zhangfen_caddy_data:/data -v zhangfen_caddy_config:/config caddy:2.8-alpine
docker logs -f --tail=100 zhangfen-caddy
```

Caddy 会自动申请和续期证书。确认 `https://your-domain.com` 可访问后，不要再把应用前端直接映射到公网端口。

如果需要停止 HTTPS 入口，执行 `docker stop zhangfen-caddy`；重新启动执行 `docker start zhangfen-caddy`。

## 7. 更新、日志和停止

```bash
cd /opt/zhangfen
docker compose logs -f --tail=200
docker compose up -d --build
docker compose restart backend
docker compose down
```

更新代码后执行 `docker compose up -d --build`。不要使用 `docker compose down -v`，它会删除 Compose 数据卷；HTTPS 场景下 Caddy 证书保存在独立的 `zhangfen_caddy_data` 卷中。

## 8. 当前项目的生产限制

- 账号画像、创作结果和风格样本保存在浏览器内存中，刷新页面会丢失，没有数据库持久化。
- 当前没有登录、用户隔离和调用额度控制，不建议直接开放给不受信任的大量公网用户。
- API 调用会产生 DeepSeek/火山引擎费用，应在服务商控制台设置余额告警和限额。
- `docker compose logs` 不会打印 `.env`，但不要手工输出或提交密钥文件。
