# 《杨氏之子》互动课堂

GitHub Pages 发布目录为 `docs/`，包含横屏界面、角色图片、配音和本地备用题库。学生回答留在页面中，可以自行下载问答记录。

1. 在 Supabase 项目的 SQL Editor 运行 `supabase/migrations/20261112000000_classroom_content.sql`。它创建题库，并授予访客只读权限。
2. 在 `docs/classroom-config.js` 填写项目 URL 和以 `sb_publishable_` 开头的公开密钥。
3. 推送到 GitHub 后，在仓库的 **Settings → Pages** 选择 **Deploy from a branch**、`main` 和 `/docs`。

网页加载时尝试从 Supabase 读取指定版本的题库。读取超时或服务不可用时，网页仍可使用打包的题库和音频。更新台词时请同步更新题库版本、网页配置和配音。
