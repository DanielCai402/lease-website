# CONTEXT.md — 项目完整上下文

> 最后更新：2026-03-31

---

## 一、项目简介与目标

**NYCRentals** 是一个面向华人社区的纽约/新泽西短租与转租信息平台，类似于小红书租房板块的独立站版本。

**核心目标：**
- 让华人房东/租客能用中文发布和浏览租房信息
- 支持整租和分租（转租）两种模式
- 支持按月和按日计价
- 覆盖纽约五区 + 新泽西哈德逊县（Jersey City、Hoboken）
- 全平台中英双语

---

## 二、技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16.2.1（App Router + Turbopack） |
| 语言 | TypeScript 5 |
| UI 样式 | Tailwind CSS v4 + @tailwindcss/postcss |
| 国际化 | next-intl 4.8.3（路由级 i18n） |
| 地图 | Leaflet 1.9.4 + OpenStreetMap tiles + Nominatim API（ZIP 边界） |
| 数据库 | 暂无（目前使用本地静态 mock 数据） |
| 部署 | 未配置 |

**运行命令：**
```bash
npm run dev      # 开发（Turbopack）
npm run build    # 生产构建
npm run lint     # ESLint 检查
```

---

## 三、已完成的功能模块

### 3.1 首页 — 浏览房源（`app/[locale]/page.tsx`）

客户端组件，实时过滤。

**FilterBar 过滤字段：**
- 租赁类型：全部 / 整租 / 分租（pills）
- 地区：Borough 下拉（Manhattan / Brooklyn / Queens / Bronx / Staten Island / Jersey City / Hoboken / NJ Hudson County）
- 价格区间：按月/按日切换 + 最低/最高输入框
- 入住日期：日期选择器（`availableFrom ≤ 选择日期`）
- 重置按钮

**ListingCard 展示字段：**
- 封面图（16:9，带类型角标）
- 标题
- 地区 + 邻里（borough · neighborhood）
- 入住/退租日期（含"灵活"标签）
- 月租价 + 日租价（各带"可议"标签）
- 快速标签：furnished / pets / parking
- 点击跳转详情页

---

### 3.2 房源详情页（`app/[locale]/listings/[id]/page.tsx`）

服务端组件，静态生成。

**MediaGallery：**
- 主图 + 缩略图条（横向滚动）
- 全屏灯箱（键盘：Esc / ← / →，图片计数角标）

**主体信息区：**
- 标题
- 类型徽章：整租/分租、户型（Studio/1B1B 等）
- 位置：Borough · Neighborhood（邮编）
- 入住日期 ~ 退租日期，含"日期灵活"标签
- 房源描述（段落文本）

**房屋详情（三列 emoji 网格）：**
- 家具情况：全配 / 部分配 / 无家具（含家具清单）
- 停车：无 / 免费 / 收费（含停车费）
- 宠物：允许 / 不允许 / 可协商

**分租专属信息（rentalType === 'room'）：**
- 房间类型：主卧 / 次卧 / 客厅改造间
- 室友人数 + 性别构成（女生 / 男生 / 混住）
- 共用浴室数量
- 客厅间：是否有隔断、是否有窗户

**发布时间**

**ContactCard 侧边栏（桌面固定，手机底部抽屉）：**
- 月租价（含"可议"） + 日租价（含"可议"）
- 水电费说明（含/不含，金额，按月/按日）
- 押金说明
  - 月租押金：无 / 压一付一 / 自定义金额
  - 日租押金：固定金额 / 百分比 / 无
- WeChat ID 展示 + 一键复制
- 联系表单：填写微信号 + 留言（演示，不持久化）
- 免责声明 tooltip

**ZIP 地图（ZipMapLeaflet）：**
- Leaflet 地图，动态加载（SSR=false）
- 调用 Nominatim API 获取 ZIP 边界 GeoJSON
- 蓝色填充边界多边形 + fitBounds

---

### 3.3 发布房源页（`app/[locale]/post/page.tsx`）

客户端组件，共 8 个 section，完整客户端验证。

**Section 1 — 基本信息：**
- 标题（必填，5~80 字符）
- 房源描述（必填，20~2000 字符）
- 户型：Studio / 1B1B / 2B1B / 2B2B / 3B1B / 3B2B / 3B3B / 其他

**Section 2 — 租赁类型：**
- 整租 / 分租（radio）
- 分租时：房间类型（主卧 / 次卧 / 客厅改造间）

**Section 3 — 位置信息：**
- 街道地址（必填）
- 邮编（必填，5 位数字）→ 自动查表（`zip-to-neighborhood.ts`）→ 自动填充 Neighborhood + Borough
- 查不到时显示手动输入框

**Section 4 — 入住时间：**
- 入住日期（必填）
- 退租日期（可选）
- 是否灵活（toggle）

**Section 5 — 价格与押金：**
- 月租价（可选）+ 可议 toggle
- 日租价（可选）+ 可议 toggle（月/日至少填一个）
- 水电费：是否含在租金内，若不含则填金额+按月/按日
- 月租押金：按惯例（无押金 / 压一付一）/ 自定义金额
- 日租押金：固定金额 / 占日租百分比 / 无押金

**Section 6 — 房屋条件：**
- 家具情况：全配 / 部分配 / 无家具
- 若有家具：家具清单文本框
- 停车：无 / 免费 / 收费（含停车费输入）
- 宠物政策：允许 / 不允许 / 可协商
- 分租时额外：
  - 室友人数（1~5）
  - 室友性别：女生 / 男生 / 混住
  - 共用浴室数量
  - 客厅间：是否有隔断、是否有窗户

**Section 7 — 图片与视频：**
- 最多 10 张图片（jpg/png/webp/gif）
- 最多 3 个视频（mp4/mov/webm）
- 拖放或点击上传
- 缩略图预览 + 删除
- 点击图片打开灯箱

**Section 8 — 联系方式：**
- 微信号（必填）
- 手机号（可选）
- 邮箱（可选）

**提交后：** 显示成功页面（演示，数据不持久化）

---

### 3.4 国际化（`i18n/` + `messages/`）

- 路由：`/zh/...`（默认）和 `/en/...`
- 翻译文件：`messages/en.json` 和 `messages/zh.json`
- 所有页面文本、表单 label、placeholder、错误信息均双语
- LanguageSwitcher 组件：localstorage 保存偏好，首次挂载自动应用
- middleware（`proxy.ts`）：处理 locale 路由重定向

---

## 四、当前文件结构

```
lease-website/
├── app/
│   ├── layout.tsx                      # 根 HTML 结构，Geist 字体，metadata
│   └── [locale]/
│       ├── layout.tsx                  # i18n 布局：导航栏 + Footer + Provider
│       ├── page.tsx                    # 首页（浏览 + 过滤）
│       ├── listings/
│       │   └── [id]/
│       │       └── page.tsx            # 详情页（SSG）
│       └── post/
│           └── page.tsx                # 发布房源表单
│
├── components/
│   ├── ContactCard.tsx                 # 价格 + 联系表单（侧边栏/底部抽屉）
│   ├── FilterBar.tsx                   # 首页过滤栏
│   ├── ImageGallery.tsx                # 简单图片画廊
│   ├── LanguageSwitcher.tsx            # EN / 中文 切换
│   ├── ListingCard.tsx                 # 房源卡片
│   ├── MediaGallery.tsx                # 全功能媒体画廊 + 灯箱
│   ├── Tooltip.tsx                     # 问号 tooltip（Portal 实现）
│   ├── ZipMap.tsx                      # 动态加载 Leaflet 地图的包装器
│   └── ZipMapLeaflet.tsx               # Leaflet 地图实现（ZIP 边界）
│
├── lib/
│   ├── types.ts                        # 核心 TypeScript 接口
│   ├── data.ts                         # 8 条静态 mock 房源数据
│   ├── utils.ts                        # shortDate 工具函数
│   └── zip-to-neighborhood.ts          # ZIP → {neighborhood, borough, lat, lon}
│
├── i18n/
│   ├── routing.ts                      # locales 配置（['zh','en']，default: 'zh'）
│   ├── request.ts                      # i18n 请求处理
│   └── navigation.ts                   # i18n 导航 helpers
│
├── messages/
│   ├── en.json                         # 英文翻译（~200 条）
│   └── zh.json                         # 中文翻译（~200 条）
│
├── public/                             # 静态资源
├── proxy.ts                            # Next.js 16 middleware（intl 路由）
├── next.config.ts                      # next-intl plugin + picsum 远程图片
├── tailwind.config.ts                  # (v4 已不需要，通过 postcss 配置)
├── postcss.config.mjs                  # @tailwindcss/postcss
├── tsconfig.json                       # strict mode，路径别名 @/*
├── eslint.config.mjs                   # flat config，next/core-web-vitals
├── CLAUDE.md                           # Claude 指令
├── AGENTS.md                           # 指向 Next.js 16 docs 的提醒
└── package.json
```

---

## 五、重要设计决策

### 5.1 联系方式设计

- **微信为核心**：发布时微信号必填，展示时带一键复制按钮
- 电话、邮箱均为可选补充
- ContactCard 里没有展示原始联系方式（仅展示微信号），避免爬取风险
- 联系表单（填写自己的微信号 + 留言）是演示态，接数据库后应发送到房东

### 5.2 邮编系统

- 当前：`lib/zip-to-neighborhood.ts` 静态查找表，覆盖约 220+ 个 NYC/NJ 邮编
- 查找结果：`{ neighborhood: string, borough: string, lat: number, lon: number }`
- 待办：迁移到外部 ZIP API（见第六节）

### 5.3 国际化（i18n）

- 默认语言为 **中文（zh）**，英文为备选
- 使用 next-intl v4，路由级别切换（URL 前缀）
- LanguageSwitcher 通过 `useRouter` + `usePathname` 实现无刷新切换
- localStorage 记忆偏好

### 5.4 价格与押金系统

**月租押金：**
- `convention`：无押金 / 压一付一（行业惯例）
- `custom`：自定义金额

**日租押金：**
- `fixed`：固定金额
- `percent`：占日租金百分比
- `none`：无押金

### 5.5 数据类型设计

```typescript
// 核心接口（lib/types.ts）
interface Listing {
  id: string
  title: string
  description: string
  address: string
  zip: string
  neighborhood: string
  borough: Borough       // 枚举：Manhattan | Brooklyn | Queens | Bronx | Staten Island | Jersey City | Hoboken | NJ Hudson County
  rentalType: 'entire' | 'room'
  roomType?: 'master' | 'secondary' | 'living'
  layout: 'Studio' | '1B1B' | '2B1B' | '2B2B' | '3B1B' | '3B2B' | '3B3B' | 'Other'
  availableFrom: string   // YYYY-MM-DD
  availableTo?: string
  flexibleDates: boolean
  monthlyPrice?: number
  monthlyNegotiable: boolean
  dailyPrice?: number
  dailyNegotiable: boolean
  utilitiesIncluded: boolean
  utilitiesCost?: number
  utilitiesUnit?: 'monthly' | 'daily'
  depositMonthlyMode: 'convention' | 'custom'
  depositMonthlyConvention?: 'none' | 'one_plus_one'
  depositMonthlyAmount?: number
  depositDailyMode: 'fixed' | 'percent' | 'none'
  depositDailyAmount?: number
  depositDailyPercent?: number
  furnished: 'full' | 'partial' | 'none'
  furnitureDetails?: string
  parking: 'none' | 'free' | 'paid'
  parkingFee?: number
  pets: 'yes' | 'no' | 'negotiable'
  roommatesCount?: number
  roommatesGender?: 'female' | 'male' | 'mixed'
  sharedBathrooms?: number
  hasPartition?: boolean
  hasWindow?: boolean
  images: string[]
  wechat?: string
  phone?: string
  email?: string
  postedAt: string        // ISO datetime
}
```

### 5.6 地图实现

- Leaflet 通过动态 import（`SSR: false`）加载，避免服务端报错
- `ZipMap.tsx` 是骨架屏 + 动态加载包装器
- `ZipMapLeaflet.tsx` 调用 Nominatim API：
  ```
  https://nominatim.openstreetmap.org/search?postalcode={zip}&countrycodes=us&format=json&polygon_geojson=1
  ```
- 返回 GeoJSON 后渲染边界多边形 + fitBounds

### 5.7 Next.js 16 特性

- middleware 文件名为 `proxy.ts`（Next.js 16 breaking change，非 `middleware.ts`）
- 使用 App Router + Server Components（详情页 SSG）
- Turbopack 作为开发服务器

---

## 六、待完成事项

### 6.1 数据库接入（Supabase）— 最高优先级

- [ ] 创建 Supabase 项目，设计 `listings` 表（对应 `Listing` 接口）
- [ ] 设计 `contacts` 表（存储联系请求：发件人微信号 + 消息 + 目标 listing ID）
- [ ] 首页从 Supabase 拉取房源列表（替换 `lib/data.ts`）
- [ ] 详情页从 Supabase 按 ID 查询
- [ ] 发布页表单提交写入 Supabase
- [ ] 图片上传：Supabase Storage（替换本地文件预览）
- [ ] 联系表单写入 `contacts` 表（可选：触发 Edge Function 通知房东）
- [ ] 设置 Row Level Security（RLS）策略

### 6.2 举报按钮

- [ ] 详情页添加"举报此房源"按钮
- [ ] 举报类型：虚假信息 / 诈骗 / 已下架 / 其他
- [ ] 写入 Supabase `reports` 表（listing_id, reason, description, reporter_ip）
- [ ] 后台查看举报（管理员功能，暂不做 UI，可直接在 Supabase 看）

### 6.3 邮编改用 API

- [ ] 替换 `lib/zip-to-neighborhood.ts` 静态查找表
- [ ] 候选方案：
  - Zippopotam.us（免费）：`https://api.zippopotam.us/us/{zip}`
  - USPS API
  - Google Maps Geocoding API
- [ ] 同时返回 neighborhood、borough、lat/lon
- [ ] 对于 NJ 邮编（Jersey City/Hoboken）需要特殊处理

### 6.4 排序功能

- [ ] 首页房源列表支持排序
- [ ] 排序选项：
  - 最新发布（默认）
  - 价格从低到高（月租）
  - 价格从高到低（月租）
  - 入住日期最近
- [ ] 与现有过滤逻辑配合（先过滤后排序）

### 6.5 其他待办

- [ ] **分页 / 无限滚动**：当数据来自真实数据库后，需要分页
- [ ] **用户认证**：发布房源需要登录（Supabase Auth + 微信/手机号登录）
- [ ] **我的房源**：用户可查看/编辑/删除自己发布的房源
- [ ] **房源过期**：`availableTo` 过期后自动标记为不可用
- [ ] **SEO**：为详情页生成动态 metadata（title, description, og:image）
- [ ] **生产部署**：Vercel 部署配置 + 环境变量管理
- [ ] **图片优化**：接入 Next.js Image + Supabase Storage CDN
- [ ] **移动端体验优化**：Post 页面表单在手机上的交互细节

---

## 七、环境变量（待配置）

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # 仅服务端使用

# 可选：ZIP API
ZIP_API_KEY=
```
