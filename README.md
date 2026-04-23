# cex-deposit-withdraw

监控 Bitget 交易所所有现货币种的充提状态变化，每分钟轮询一次，有变化时通过 PushPlus 推送通知。

## 依赖

- [Bun](https://bun.sh) v1.3+
- PushPlus token（[pushplus.plus](https://www.pushplus.plus) 注册后获取）
- 可选：HTTP 代理（国内服务器访问 Bitget API 时需要）

## 快速开始

```bash
git clone https://github.com/your-username/cex-deposit-withdraw.git
cd cex-deposit-withdraw
bun install
cp .env.example .env
# 编辑 .env，填入 PUSHPLUS_TOKEN 和可选的 HTTPS_PROXY
bun run index.ts
```

## 环境变量

| 变量             | 必填 | 说明                                       |
| ---------------- | ---- | ------------------------------------------ |
| `PUSHPLUS_TOKEN` | 是   | PushPlus token                             |
| `HTTPS_PROXY`    | 否   | HTTP 代理地址，如 `http://127.0.0.1:42001` |

## 通知格式

有状态变化时通过 PushPlus app 渠道推送，标题"充提状态变化"，正文每条变化一行：

| 场景         | 示例                                                                               |
| ------------ | ---------------------------------------------------------------------------------- |
| 充提状态变化 | `[2026-04-23T13:00:00.000Z] BTC/BEP20: withdraw true->false, recharge true->true`  |
| 新增币种/链  | `[2026-04-23T13:00:00.000Z] NEWCOIN/ERC20: withdraw N/A->true, recharge N/A->true` |
| 删除币种/链  | `[2026-04-23T13:00:00.000Z] OLDCOIN/TRC20: withdraw true->N/A, recharge true->N/A` |

多条变化合并为一条通知推送。

## 监控覆盖范围

| 场景                   | 是否覆盖 |
| ---------------------- | -------- |
| 某币种某链充提状态变化 | ✅       |
| 某币种新增/删除一条链  | ✅       |
| 新增/删除币种          | ✅       |

## 部署到 Ubuntu 服务器

**1. 安装 Bun**

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

**2. 克隆项目并配置**

```bash
git clone https://github.com/your-username/cex-deposit-withdraw.git
cd cex-deposit-withdraw
bun install
cp .env.example .env
nano .env
```

**3. 用 pm2 守护进程**

```bash
bunx pm2 start index.ts --interpreter bun --name cex-monitor
bunx pm2 save
bunx pm2 startup  # 按提示执行输出的命令以开机自启
```

**常用命令**

```bash
bunx pm2 logs cex-monitor
bunx pm2 restart cex-monitor
bunx pm2 stop cex-monitor
```
