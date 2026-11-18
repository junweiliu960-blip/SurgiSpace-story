# 阿里云香港部署：游客存档版

本方案提供免登录试玩、昵称、服务器自动存档、同一浏览器续玩、恢复码跨设备恢复、JSON 备份导入导出。游戏题目、剧情、模型与流程沿用现有版本。新服务不需要 Cloudflare Access、Cloudflare D1、邮箱验证码或 Lux3D API 密钥。

## 1. 购买前准备

在 https://www.aliyun.com/ 注册中国站账号并按平台要求完成实名认证。推荐先用一台香港 Linux 服务器部署试玩版本；建议起始配置为 2 核、2 GB 内存、40 GB 磁盘，带宽和流量套餐依据预算选择。该配置是本项目的小规模试玩起点，不是阿里云服务承诺或并发性能保证。模型资产约 129 MB，实际流量取决于访问人数、缓存和加载场景。

选择 Ubuntu 24.04 LTS 或受 Docker 官方支持的 Linux 系统。不要购买仅支持静态页面的产品：本项目需要 Node.js 后端和持久化数据库。香港节点的公网服务通常无需大陆 ICP 备案；若以后改为大陆节点，先咨询阿里云有关备案及游戏服务的适用要求。

还需要一个自己可管理 DNS 的域名，例如 `game.yourdomain.com`，用于 HTTPS。已有域名可直接使用子域名。购买与实名认证由账号持有人完成，不在聊天中发送密码、AccessKey、私钥或验证码。

## 2. 网络和服务器

1. 将域名的 A 记录指向香港服务器公网 IPv4；不要保留错误的 AAAA 记录。DNS 直接解析，不经过原 Cloudflare 游戏或 Access。
2. 在阿里云服务器防火墙/安全组开放 TCP 80、443；UDP 443 可选。SSH 22 仅对管理者需要的来源开放。不要对公网开放 3000、SQLite 或其他数据库端口。
3. 安装 Docker Engine 和 Compose 插件，按官方发行版步骤：https://docs.docker.com/engine/install/ubuntu/ 。不要使用来源不明的一键安装脚本。
4. 将本项目部署到如 `/opt/surgispace`。可以上传随附 ZIP，也可用已授权 GitHub 账号克隆私有仓库。不要将 GitHub 私有令牌写进部署文件或提交到仓库。

## 3. 启动 HTTPS 服务

以下命令均在服务器项目目录执行。先确认域名解析正确，再启动 Caddy 获取 HTTPS 证书。

```sh
cd /opt/surgispace
cp deploy/.env.example deploy/.env
# 编辑 deploy/.env，将 GAME_DOMAIN=game.example.com 改成实际域名。
docker compose --project-name surgispace --env-file deploy/.env -f deploy/compose.yaml up -d --build
docker compose --project-name surgispace --env-file deploy/.env -f deploy/compose.yaml ps
```

`game` 容器运行 Node.js 24 和 SQLite，`web` 容器运行 Caddy，自动获取/续期 HTTPS 证书并压缩响应。游戏服务没有发布公网端口，只能通过 Caddy 访问。首次构建需要下载容器和 npm 依赖，耗时依网络而定。

数据库保存在 Compose 的命名卷 `surgispace_players`，代码更新不会删除它。不要使用 `docker compose down -v` 或删除该卷。SQLite 采用 WAL 模式，单机单实例部署；不要把同一数据库文件用于多台服务器写入。

## 4. 上线验收

- 从中国大陆手机网络及家庭宽带分别直接访问 HTTPS 域名，确认无需 VPN、无需邮箱登录。香港线路可达性仍需实际测试，不能保证所有运营商始终稳定。
- 答完一道题，关闭页面后重新打开，选择继续上次任务，确认进度保留。
- 顶部“存档管理”填写昵称，生成并保管恢复码。在另一台设备输入恢复码，确认昵称和进度一致。
- 用另一个全新浏览器访问，确认不会看到前一位玩家的进度。
- 测试手机问诊、报告显示、手术和回看已答题；确认模型均从自己的域名加载。
- 同一存档同时在两台设备操作时，较旧的页面应提示读取云端进度，不覆盖新进度。

## 5. 老玩家进度迁移

原 Cloudflare 版本和 D1 数据库暂时保留。只有新版游客站点不需要邮箱登录，旧站仍使用原邮箱验证。

1. 为原站发布带“导出进度文件”的兼容版本（本代码已包含该按钮，位于顶部邮箱账号窗口）。
2. 老玩家验证原邮箱后，在账号窗口导出自己的 JSON 存档。
3. 打开阿里云新版，进入“存档管理”，选择该 JSON 文件，勾选确认替换，再导入。
4. 生成并保存新版恢复码。旧站的存档仍保留，不会因导出或导入被删除。

不能仅输入邮箱直接取回原存档，否则其他人可冒领。不把旧邮箱映射表或全部玩家数据放进公开网页资源。若以后需要批量迁移，应另行执行后台导出和身份核验。

## 6. 日常更新和备份

推送 GitHub 本身不会自动更新服务器。当前交付采用受控更新：上传新代码或在服务器拉取后，重新执行第 3 节的 Compose 命令即可。域名保持不变，玩家访问的是服务器最新已部署版本。自动发布可在服务器账号建立后配置，不能在未配置时声称已启用。

更新前以及每天至少一次执行一致性备份：

```sh
cd /opt/surgispace
docker compose --project-name surgispace --env-file deploy/.env -f deploy/compose.yaml exec -T game node tools/backup-guests.mjs
```

备份位于数据卷的 `/app/data/backups/`。该命令用 SQLite `VACUUM INTO` 生成一致性副本，不直接复制运行中的主数据库文件。应再定期把备份安全复制到服务器之外；仅同一块磁盘的备份不能防止整机或磁盘丢失。备份包含游客进度及会话凭证的哈希，应限制读取权限，不提交到 GitHub。

恢复时先停止 `game`，保留当前数据目录作为回退副本，在临时卷中检查备份完整性，再以备份替换数据库并处理对应 WAL/SHM 文件，最后启动和验收。不要直接在运行中的数据库上覆盖文件。

## 7. 游客机制与边界

- 服务器随机创建游客编号；持久 Cookie 为 HttpOnly、Secure、SameSite=Lax，最长一年。浏览器主动清理、隐私模式、换设备会丢失本机凭证。
- 昵称不是账号密码，也不能用昵称查找存档。恢复码为高强度随机凭证，服务器只保存哈希；生成新码会使旧码失效，但不会踢出已恢复存档的其他设备。
- 恢复码可访问对应存档，不要公开分享；忘记恢复码且浏览器凭证丢失时，无法可靠找回。
- 同一浏览器默认一个当前游客存档，恢复码可以切换；同设备多人轮流试玩时，各自保管恢复码。
- 页面关闭前、阶段切换后会保存，离线时保留本机待同步备份；远端发生变化时先解决冲突。服务器不可用且尚未建立游客身份的新访客，需要网络恢复后才能开始。
- 当前保存昵称、答题记录、进度、重试和时长，不主动收集邮箱；属于游客标识体系，并非对真实身份的验证。
- 已实现来源校验、恢复尝试限速、随机凭证、账号绑定检查和版本条件写入。本方案定位小规模试玩，正式大规模服务前需再做容量、风控和运维评估。

## 8. 本地验证与已知验证范围

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run build:private
$env:PUBLIC_ORIGIN='http://127.0.0.1:3000'
node server/aliyun.js
```

本机回环地址允许 HTTP 供测试；公开部署强制 HTTPS。生产 Node 服务、游客 API、浏览器恢复流程已在 Windows 本地验证。当前开发环境没有 Docker，容器镜像构建、阿里云端口/证书和大陆线路测试需要有真实服务器后完成。

参考：
- 阿里云网站部署流程：https://www.alibabacloud.com/help/en/dws/getting-started/the-whole-process-of-website-building/
- 香港节点及备案：https://www.alibabacloud.com/en/icp
- Docker Ubuntu 安装：https://docs.docker.com/engine/install/ubuntu/
