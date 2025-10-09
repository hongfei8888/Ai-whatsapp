# GitHub 推送指南

## 问题原因

1. **HTTP 408 超时**：项目文件较大（~167 MB），推送时网络超时
2. **需要身份认证**：GitHub 需要 Personal Access Token (PAT)

## 解决步骤

### 步骤 1：生成 GitHub Personal Access Token

1. 访问：https://github.com/settings/tokens
2. 点击 **"Generate new token"** → **"Generate new token (classic)"**
3. 设置：
   - **Note**: `WhatsApp AI Automation`
   - **Expiration**: 选择过期时间（建议 90 days）
   - **Select scopes**: 勾选 `repo`（完整仓库权限）
4. 点击 **"Generate token"**
5. **重要**：复制生成的 Token（只显示一次！）

### 步骤 2：使用脚本推送

运行项目根目录下的 `git-push-complete.bat` 脚本。

## 手动推送（备选方案）

如果脚本失败，请在命令行执行：

```bash
# 1. 配置Git（增加缓冲区，处理大文件）
git config http.postBuffer 524288000
git config http.lowSpeedLimit 0
git config http.lowSpeedTime 999999

# 2. 推送（替换 YOUR_TOKEN）
git push https://YOUR_TOKEN@github.com/hongfei8888/Ai-whatsapp.git master --force
```

## 常见问题

**Q: 推送很慢或超时？**
- 原因：项目文件较大，网络不稳定
- 解决：使用脚本中的配置增加超时时间和缓冲区

**Q: 认证失败？**
- 检查 Token 是否正确
- 确保 Token 有 `repo` 权限

**Q: 推送后仓库空的？**
- 检查 `.gitignore` 是否过滤了太多文件
- 运行 `git status` 查看有哪些文件被跟踪

## 推送后验证

访问：https://github.com/hongfei8888/Ai-whatsapp

检查是否包含：
- ✅ Docker 配置文件
- ✅ 源代码（server、web）
- ✅ README.md
- ✅ 项目文档
