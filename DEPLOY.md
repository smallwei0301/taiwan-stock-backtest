# DEPLOY.md

## Taiwan Stock Backtest — Deployment SOP (Vercel + GitHub SSH)

這份文件定義此專案的標準部署流程，避免白畫面、路由錯誤與權限問題。

---

## 1) 架構與部署目標

- Frontend: React (CRA)
- Deploy target: Vercel (Static Build)
- Trigger mode: Push 到 `main` 後自動部署
- Git transport: SSH (`git@github.com:smallwei0301/taiwan-stock-backtest.git`)

---

## 2) Vercel 專案設定（必要）

在 Vercel 專案中確認：

- **Root Directory**: `/`（repo 根目錄）
- **Build Command**: `npm run build`
- **Output Directory**: `build`

專案已有 `vercel.json`：

- 使用 `@vercel/static-build`
- `distDir` 指向 `build`
- SPA fallback rewrite 到 `/index.html`

---

## 3) 每次部署流程（標準）

```bash
# 1. 拉最新
git pull origin main

# 2. 安裝依賴（如有變更）
npm install

# 3. 本地驗證 build
npm run build

# 4. 提交
git add .
git commit -m "feat/fix: <your message>"

# 5. 推送觸發 Vercel 自動部署
git push origin main
```

---

## 4) 快速驗收清單（Deploy Done Criteria）

部署後至少檢查：

- 首頁可正常載入（非白畫面）
- 重新整理子路由不會 404（SPA rewrite 正常）
- Browser console 無致命錯誤
- 關鍵 API 路徑（如 `/api/...`）可正常回應

---

## 5) 常見故障與修復

### A. Vercel 白畫面

優先檢查：

1. React 版本與啟動方式是否匹配
   - React 19 需使用 `createRoot`，不可用 `ReactDOM.render`
2. `vercel.json` 是否存在且設定正確
3. Vercel build/output 目錄是否對應到 `build`

### B. 直接開子路由 404

- 確認 `vercel.json` 有 SPA fallback：
  - `/(.*)` → `/index.html`

### C. 無法 push

- 確認 SSH 驗證：

```bash
ssh -T git@github.com
```

預期看到：

`Hi smallwei0301! You've successfully authenticated...`

---

## 6) 安全規範

- 不在聊天室貼長效 token
- 優先使用 SSH key
- 若臨時 token 必須使用：最小權限 + 短效 + 任務後立即撤銷

---

## 7) 備註

若未來改成前後端分離部署（Vercel + API service），請新增：

- API base URL 的環境變數策略（dev/staging/prod）
- CORS 與 Proxy 設定
- Health check 與回滾流程
