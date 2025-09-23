# GitHub 身份验证指南

## 问题说明
当前遇到权限错误：`Permission denied to chengyl1989`，需要设置正确的GitHub身份验证。

## 解决方案

### 方法1: 使用个人访问令牌 (推荐)

1. **创建个人访问令牌**
   - 访问: https://github.com/settings/tokens
   - 点击 "Generate new token" → "Generate new token (classic)"
   - 设置名称: `skyrouter-ai-client`
   - 选择权限: 勾选 `repo` (完整仓库权限)
   - 点击 "Generate token"
   - **复制生成的令牌** (只显示一次!)

2. **使用令牌推送**
   ```bash
   # 方式1: 在URL中使用令牌
   git remote set-url origin https://YOUR_TOKEN@github.com/chengyanlong521-art/skyrouter-ai-client.git
   git push -u origin main

   # 方式2: 推送时输入凭据
   git push -u origin main
   # 用户名: chengyanlong521-art
   # 密码: 粘贴你的个人访问令牌
   ```

### 方法2: 使用SSH密钥

1. **生成SSH密钥**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **添加SSH密钥到GitHub**
   - 复制公钥: `cat ~/.ssh/id_ed25519.pub`
   - 访问: https://github.com/settings/keys
   - 点击 "New SSH key"，粘贴公钥

3. **使用SSH URL**
   ```bash
   git remote set-url origin git@github.com:chengyanlong521-art/skyrouter-ai-client.git
   git push -u origin main
   ```

### 方法3: 使用GitHub CLI

```bash
# 安装并登录GitHub CLI
gh auth login

# 推送代码
git push -u origin main
```

## 当前状态

- ✅ 远程仓库已添加
- ✅ 分支已重命名为 main
- ❌ 需要身份验证才能推送

## 推荐操作

1. 创建个人访问令牌
2. 使用方法1推送代码
3. 推送成功后，标签也需要推送：
   ```bash
   git push origin --tags
   ```

## 注意事项

- 个人访问令牌具有与密码相同的权限
- 不要将令牌分享给他人
- 可以随时在GitHub设置中撤销令牌