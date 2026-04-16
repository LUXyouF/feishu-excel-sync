# 飞书多维表格 Excel 数据同步插件

一个可以将本地 Excel 文件快速同步到飞书多维表格的插件。

## 功能特性

- ✅ **Excel上传** - 支持拖拽或点击上传 .xlsx/.xls 文件
- ✅ **智能解析** - 自动读取 Excel 表头和数据行
- ✅ **字段自动匹配** - Excel表头与多维表格字段智能映射
- ✅ **同步策略选择** - 支持增量追加和全量覆盖
- ✅ **数据预览** - 同步前可预览数据和映射关系
- ✅ **进度显示** - 实时显示同步进度
- ✅ **结果统计** - 展示同步成功/失败数量

## 开发环境

- Node.js >= 16.x
- npm 或 yarn

## 安装依赖

```bash
npm install
```

## 本地开发调试

1. 启动开发服务器：

```bash
npm run dev
```

2. 本地服务启动后，会在终端显示访问地址（通常是 `http://localhost:3000`）

3. 在飞书多维表格中使用插件：
   - 打开任意多维表格
   - 点击「插件」展开插件面板
   - 点击「自定义插件」
   - 点击「+新增插件」
   - 在输入框内填入 `http://localhost:3000`
   - 点击「确定」添加并运行插件

4. 修改代码后，页面会自动热更新

## 生产部署

1. 构建生产版本：

```bash
npm run build
```

2. 将 `dist` 文件夹部署到服务器或静态托管服务（如 Vercel、Netlify）

3. 使用部署后的 URL 地址添加插件

## 使用说明

### 1. 上传文件

在插件界面点击上传区域或直接拖拽 Excel 文件到上传区域。

### 2. 检查字段映射

插件会自动分析 Excel 表头并与多维表格字段进行智能匹配：
- ✅ 绿色标记表示已自动匹配
- 🟡 橙色标记表示未匹配，可手动选择对应字段

### 3. 选择同步策略

- **增量追加**：将 Excel 数据追加到多维表格现有数据之后
- **全量覆盖**：清空多维表格现有数据，用 Excel 数据替换

### 4. 开始同步

点击「开始同步」按钮，等待同步完成。

## 技术栈

- React 18
- TypeScript
- Vite
- @lark-base-open/js-sdk (飞书官方 SDK)
- xlsx (Excel 解析库)

## 项目结构

```
feishu-excel-sync-plugin/
├── manifest.json              # 插件配置文件
├── package.json               # 依赖声明
├── vite.config.ts             # Vite 配置
├── tsconfig.json              # TypeScript 配置
├── index.html                 # 入口 HTML
├── src/
│   ├── main.tsx               # React 入口
│   ├── App.tsx                # 主应用组件
│   ├── index.css              # 全局样式
│   ├── components/
│   │   ├── FileUploader.tsx   # Excel 上传组件
│   │   ├── FieldMapper.tsx    # 字段映射组件
│   │   └── SyncResult.tsx     # 结果展示组件
│   └── utils/
│       ├── excelParser.ts     # Excel 解析工具
│       ├── fieldMatcher.ts    # 字段匹配算法
│       └── bitableHelper.ts   # 飞书 SDK 封装
└── README.md
```

## 注意事项

1. **权限说明**：插件权限与当前用户在多维表格中的权限保持一致
2. **数据量限制**：大量数据同步可能需要较长时间，建议分批处理
3. **字段类型**：部分字段类型（如公式、查找等）可能无法直接写入

## License

MIT
