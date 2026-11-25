# Bonnote

一站式便签。手机浏览器里像一个小应用，桌面浏览器里是左侧导航加便签墙。

- 前端：Vite + React + TypeScript
- 后端：NestJS + Prisma + MySQL
- 账号、笔记本、标签、清单、提醒、置顶、收藏、归档、回收站、搜索筛选、浅色/深色、备份导入导出

## 准备 MySQL

账号、密码、接口密钥、邮件和网页端口都在 `server/.env`。复制 `server/.env.example` 后按本机情况修改。数据库用这几项：

```text
MYSQL_HOST、MYSQL_PORT、MYSQL_USER、MYSQL_PASSWORD、MYSQL_DATABASE、MYSQL_DATA_DIR
```

当前机器如果还没有数据库，按 `.env` 里的账号建库。要用 Docker 一次拉起数据库、接口和网页：

```bash
sh nas-up.sh
```

不要用群晖 Container Manager 界面上的「构建」，那条路径会停在 `resolving provenance for metadata file`。`nas-up.sh` 会逐个构建镜像并关闭 provenance。部署方式和 bonmanage 相同：MySQL 和接口不映射到宿主机，浏览器只开 `WEB_PORT`。`MYSQL_DATA_DIR` 用本项目自己的目录，不要指向 bonmanage 的数据目录。容器里的接口会连到本项目网络里的 MySQL（端口固定 3306）。停掉用 `npm run down`。

## 启动

```bash
npm install
npm run setup
npm run dev
```

- 网页和接口端口来自 `server/.env` 的 `WEB_PORT`、`PORT`
- 手机和电脑在同一网络时，用终端里 Vite 打印的局域网地址打开

邮箱验证码使用同文件里的 `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`、`MAIL_FROM`。`SMTP_HOST` 留空时不发信，验证码会显示在页面上。

本地用 `npm run dev` 前要先 `npm run setup` 建表。`npm run up` 启动容器时会自己建表。演示账号由 `SEED_DEMO` 决定：设为 `true` 时会写入 `DEMO_EMAIL` / `DEMO_PASSWORD`，登录页出现「填入演示账号」。部署时保持 `SEED_DEMO` 为空，就不会创建这个共享账号，页面上也不会露出账号和密码。

## 常用命令

```bash
npm run dev      # 同时启动接口和网页
npm run build    # 构建前后端
npm run setup    # 建表；仅当 SEED_DEMO=true 时写入演示账号
npm run up       # 同 sh nas-up.sh，逐个构建并启动容器
npm run down     # 停掉上述容器
```


## 部署
第一次：复制生成`.env`然后执行`SEED=1 sudo sh nas-up.sh`