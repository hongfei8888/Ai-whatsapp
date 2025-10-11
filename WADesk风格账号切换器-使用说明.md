# WADesk风格账号切换器 - 使用说明

## 🎯 设计理念

完全模仿WADesk的账号管理方式：
- **侧边栏顶部**：圆形头像代表当前账号
- **点击展开**：弹出账号管理窗口
- **快速切换**：一键切换不同账号

---

## 🎨 UI设计

### 侧边栏顶部圆形按钮

```
┌─────────┐
│         │
│  ┌───┐  │  ← 圆形头像
│  │BX │  │    显示账号缩写
│  └───┘  │    
│    ●    │  ← 在线状态点（右下角）
│   [5]   │  ← 账号数量徽章（右上角）
│         │
├─────────┤
│   📊    │  ← 仪表盘
│   💬    │  ← 对话
│   👥    │  ← 通讯录
│    ⋮    │
└─────────┘
```

### 弹出窗口设计

```
┌─────────────────────────────────┐
│ 账号切换          🔄  [6]        │  ← 头部：标题+刷新+数量
│ [🔍 搜索手机号或备注名]          │  ← 搜索框
├─────────────────────────────────┤
│ ┌───────────────────────────┐   │
│ │ [BX]  半箭         ✓      │   │  ← 当前账号（绿色边框）
│ │  ●   86130021408          │   │
│ │ ─────────────────────────  │   │
│ │ [在线]          [⚡] [⋮]  │   │
│ └───────────────────────────┘   │
│                                 │
│ ┌───────────────────────────┐   │
│ │ [LX]  离线                │   │  ← 其他账号
│ │  ○   1408                 │   │
│ │ ─────────────────────────  │   │
│ │ [离线]          [▶] [⋮]   │   │
│ └───────────────────────────┘   │
├─────────────────────────────────┤
│ [➕ 添加账号]           [📊]    │  ← 底部操作
└─────────────────────────────────┘
```

---

## 🎯 核心功能

### 1. **侧边栏圆形头像**

#### 显示内容
- **账号缩写**：自动提取名称缩写（如"半箭" → "BX"）
- **在线状态点**：
  - 绿色：在线
  - 无显示：离线
- **账号数量徽章**：
  - 显示总账号数
  - 红色徽章，右上角

#### 颜色编码
- **在线账号**：绿色渐变背景
- **离线账号**：蓝色渐变背景

#### 交互效果
- **悬停**：放大 1.1 倍 + 阴影加深
- **点击**：展开/收起账号管理窗口
- **打开时**：显示蓝色光圈

---

### 2. **账号管理弹出窗口**

#### 位置和尺寸
- **位置**：侧边栏右侧 80px 处
- **宽度**：320px
- **高度**：自适应（最大高度 calc(100vh - 32px)）
- **样式**：白色背景，圆角 12px，阴影

#### 功能区域

##### 头部区域
```tsx
// 标题 + 刷新按钮 + 数量徽章
┌─────────────────────────────────┐
│ 账号切换          🔄  [6]        │
│ [🔍 搜索框]                      │
└─────────────────────────────────┘
```

- **标题**："账号切换"
- **刷新按钮**：手动刷新账号列表
- **数量徽章**：蓝色圆形，显示账号总数
- **搜索框**：支持搜索手机号和备注名

##### 账号列表区域
```tsx
// 可滚动区域，显示所有账号
┌─────────────────────────────────┐
│ [头像] 账号名称 ✓                │
│   ●   手机号                     │
│ ──────────────────────────────── │
│ [状态]              [操作按钮]   │
└─────────────────────────────────┘
```

**每个账号卡片包含：**
- **头像**：42x42px，圆角 10px
  - 当前账号：绿色
  - 其他账号：蓝色
  - 右下角状态点：绿色（在线）/ 灰色（离线）
- **账号名称**：粗体显示，当前账号右侧显示 ✓
- **手机号**：灰色小字
- **状态徽章**：
  - 在线：绿色
  - 离线：灰色
  - 连接中：橙色
  - 待扫码：红色
- **操作按钮**：
  - 启动/停止按钮
  - 更多菜单（⋮）

**当前账号特殊标识：**
- 绿色边框（2px）
- 浅绿色背景
- 右侧显示 ✓ 图标

##### 底部操作区域
```tsx
┌─────────────────────────────────┐
│ [➕ 添加账号]           [📊]    │
└─────────────────────────────────┘
```

- **添加账号**：主按钮，蓝色
- **管理后台**：图标按钮，跳转到 `/accounts`

---

## 🔧 使用方式

### 基本操作

#### 1. 查看当前账号
- 查看侧边栏顶部圆形头像
- 查看账号缩写和状态点

#### 2. 展开账号列表
- **方式 1**：点击侧边栏顶部圆形头像
- **方式 2**：快捷键 `Ctrl + Alt + A`（待实现）

#### 3. 切换账号
- 点击账号卡片
- 自动切换并关闭弹窗
- 无需刷新页面

#### 4. 搜索账号
- 在搜索框输入手机号或备注名
- 实时过滤显示

#### 5. 启动/停止账号
- 点击 ⚡ 按钮（在线）
- 点击 ▶ 按钮（离线）

#### 6. 管理账号
- 点击 ⋮ 按钮
- 选择"管理账号"进入详细页面

#### 7. 添加新账号
- 点击底部"➕ 添加账号"按钮
- 填写账号信息

### 关闭弹窗

- **方式 1**：点击外部区域
- **方式 2**：再次点击侧边栏圆形头像
- **方式 3**：选择账号后自动关闭

---

## 💡 设计细节

### 1. **视觉反馈**

#### 侧边栏圆形头像
```tsx
// 默认状态
boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'

// 悬停状态
transform: 'scale(1.1)'
boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'

// 打开状态
boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)'
```

#### 账号卡片
```tsx
// 当前账号
border: '2px solid #10b981'
backgroundColor: '#f0fdf4'

// 普通账号
border: '1px solid #e5e7eb'
backgroundColor: '#ffffff'

// 悬停状态
backgroundColor: '#f9fafb'
```

### 2. **动画效果**

```tsx
// 所有过渡动画
transition: 'all 0.2s'

// 圆形头像动画
transition: 'all 0.3s'
```

### 3. **颜色系统**

| 用途 | 颜色 | 说明 |
|-----|------|------|
| 在线账号头像 | `#10b981` | 绿色渐变 |
| 离线账号头像 | `#3b82f6` | 蓝色渐变 |
| 在线状态点 | `#10b981` | 绿色 |
| 离线状态点 | `#9ca3af` | 灰色 |
| 数量徽章 | `#3b82f6` | 蓝色 |
| 多账号徽章 | `#ef4444` | 红色 |
| 当前边框 | `#10b981` | 绿色 |
| 当前背景 | `#f0fdf4` | 浅绿 |

### 4. **尺寸规范**

```tsx
// 侧边栏圆形头像
width: '48px'
height: '48px'
fontSize: '18px'

// 弹窗内头像
width: '42px'
height: '42px'
fontSize: '16px'

// 状态点
width: '12px'
height: '12px'

// 徽章
minWidth: '20px'
height: '20px'
```

---

## 🎯 技术实现

### 核心组件

#### 1. **AccountSwitcher.tsx**
```tsx
interface AccountSwitcherProps {
  isOpen: boolean;           // 是否打开
  onClose: () => void;       // 关闭回调
  triggerRef: React.RefObject<HTMLDivElement>;  // 触发器引用
}
```

**功能：**
- 显示账号列表
- 搜索过滤
- 切换账号
- 启动/停止账号
- 添加账号

#### 2. **Sidebar.tsx**
```tsx
// 添加状态管理
const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
const accountButtonRef = useRef<HTMLDivElement>(null);

// 使用账号数据
const { accounts, currentAccountId } = useAccount();
const currentAccount = accounts.find(acc => acc.id === currentAccountId);
```

**功能：**
- 显示圆形头像按钮
- 管理弹窗打开/关闭状态
- 传递引用给AccountSwitcher

### 点击外部关闭

```tsx
useEffect(() => {
  if (!isOpen) return;

  const handleClickOutside = (event: MouseEvent) => {
    if (
      panelRef.current &&
      !panelRef.current.contains(event.target as Node) &&
      triggerRef.current &&
      !triggerRef.current.contains(event.target as Node)
    ) {
      onClose();
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isOpen, onClose, triggerRef]);
```

### 账号缩写生成

```tsx
const getAccountInitials = (account: any) => {
  if (!account || !account.name) return '?';
  const words = account.name.trim().split(/\s+/);
  if (words.length >= 2) {
    // 多个词：取首尾字母
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  // 单个词：取前两个字符
  return account.name.substring(0, 2).toUpperCase();
};
```

---

## 🚀 优势特点

### 1. **节省空间**
- 不占用固定侧边栏空间
- 按需弹出，用完即收

### 2. **快速切换**
- 一键展开账号列表
- 点击即切换，无刷新

### 3. **清晰直观**
- 圆形头像一目了然
- 状态点清晰标识
- 数量徽章实时显示

### 4. **操作便捷**
- 支持搜索过滤
- 就地启动/停止
- 快速添加账号

### 5. **视觉美观**
- 现代化设计
- 流畅动画效果
- 统一色彩系统

---

## 📊 对比说明

### 旧设计（固定AccountPanel）

```
┌──────────┬────┬──────┬──────────┐
│          │    │      │          │
│  账号    │ 功 │ 列表 │  主内容  │
│  管理    │ 能 │      │          │
│  面板    │ 栏 │      │          │
│  280px   │    │      │          │
│          │    │      │          │
└──────────┴────┴──────┴──────────┘
```

**问题：**
- ❌ 占用 280px 固定宽度
- ❌ 小屏幕空间紧张
- ❌ 不符合常见UX习惯

### 新设计（WADesk风格）

```
┌────┬──────┬──────────┐
│    │      │          │
│ [●]│ 列表 │  主内容  │  ← 圆形按钮
│ 功 │      │          │
│ 能 │      │          │
│ 栏 │      │          │
│    │      │          │
└────┴──────┴──────────┘

点击展开 ↓

     ┌──────────────┐
     │ 账号切换     │  ← 弹出窗口
     │ [🔍]         │
     │ ───────────  │
     │ [●] 账号1    │
     │ [○] 账号2    │
     └──────────────┘
```

**优势：**
- ✅ 节省空间（无固定宽度）
- ✅ 按需显示
- ✅ 符合WADesk习惯
- ✅ 更好的响应式支持

---

## 🎨 示例代码

### 使用AccountSwitcher

```tsx
import { AccountSwitcher } from '@/components/account/AccountSwitcher';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        点击打开
      </div>
      
      <AccountSwitcher
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
      />
    </>
  );
}
```

### 集成到Sidebar

```tsx
export default function Sidebar() {
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const accountButtonRef = useRef<HTMLDivElement>(null);
  
  return (
    <>
      <div style={styles.container}>
        {/* 圆形头像按钮 */}
        <div ref={accountButtonRef} onClick={() => setAccountSwitcherOpen(!accountSwitcherOpen)}>
          {/* 头像内容 */}
        </div>
        
        {/* 其他导航 */}
      </div>
      
      {/* 弹出窗口 */}
      <AccountSwitcher
        isOpen={accountSwitcherOpen}
        onClose={() => setAccountSwitcherOpen(false)}
        triggerRef={accountButtonRef}
      />
    </>
  );
}
```

---

## 🔄 更新日志

### v2.0 (2025-10-10)
- ✅ 全新WADesk风格设计
- ✅ 移除固定AccountPanel
- ✅ 添加圆形账号切换器
- ✅ 弹出式账号管理窗口
- ✅ 优化交互体验
- ✅ 改进视觉设计

### v1.0 (之前)
- 固定AccountPanel设计
- 280px侧边栏宽度

---

## 📝 注意事项

1. **点击外部关闭**：点击弹窗外任何地方都会关闭
2. **切换自动关闭**：选择账号后自动关闭弹窗
3. **无刷新切换**：切换账号不会刷新页面
4. **状态实时更新**：账号状态实时反映在UI上
5. **响应式设计**：弹窗高度自适应屏幕大小

---

## 🎉 总结

新的WADesk风格账号切换器具有：

✨ **更节省空间** - 无固定宽度占用  
✨ **更符合习惯** - 模仿WADesk交互  
✨ **更快速便捷** - 一键展开切换  
✨ **更美观现代** - 精致的视觉设计  
✨ **更好体验** - 流畅的动画效果  

完美适配管理5个左右账号的使用场景！🚀

