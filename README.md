# cex-deposit-withdraw

监控 Bitget 交易所所有现货币种的充提状态变化，每分钟轮询一次，有变化时通过 PushPlus 推送通知。

## 依赖

- [Bun](https://bun.sh)
- PushPlus token（[pushplus.plus](https://www.pushplus.plus) 注册后获取）
- 可选：HTTP 代理（国内服务器访问 Bitget API 时需要）

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

## 部署

```bash
curl -fsSL https://raw.githubusercontent.com/21Hzzzz/cex-deposit-withdraw/main/deploy.sh | PUSHPLUS_TOKEN=your_token bash
```

如需设置代理：

```bash
curl -fsSL https://raw.githubusercontent.com/21Hzzzz/cex-deposit-withdraw/main/deploy.sh | PUSHPLUS_TOKEN=your_token HTTPS_PROXY=http://127.0.0.1:42001 bash
```

脚本会自动完成：安装 Bun、克隆项目、配置环境变量、注册并启动 systemd 服务。

**卸载**

```bash
systemctl disable --now cex-deposit-withdraw && rm /etc/systemd/system/cex-deposit-withdraw.service && rm -rf /root/cex-deposit-withdraw
```
