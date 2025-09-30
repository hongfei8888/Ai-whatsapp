"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import QRCodeDialog from "@/components/QRCodeDialog";

// 样式字典
const S = {
  container: { maxWidth: 1200, margin: "0 auto", padding: "0 24px" },
  appBar: {
    position: "sticky" as const, top: 0, zIndex: 50,
    height: 64, display: "flex", alignItems: "center",
    background: "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)"
  },
  appBarRow: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" },
  brand: { display: "flex", alignItems: "center", gap: 10, color: "#111827", textDecoration: "none" },
  brandLogo: { width: 22, height: 22, borderRadius: 6, background: "#4f46e5" },
  brandText: { fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" },
  tabs: { display: "flex", alignItems: "center", gap: 6 },
  tab: (active: boolean = false) => ({
    fontSize: 14, lineHeight: "20px", padding: "8px 10px",
    color: active ? "#111827" : "#667085",
    borderBottom: active ? "2px solid #4f46e5" : "2px solid transparent",
    textDecoration: "none", borderRadius: 4, cursor: "pointer",
    transition: "all 0.2s ease"
  }),
  rightIcons: { display: "flex", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    background: "#fff", border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 1px 3px rgba(16,24,40,.08)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", userSelect: "none",
    fontSize: 16, color: "#374151",
    transition: "all 0.2s ease"
  }
};

interface AppBarProps {
  onAddAccount: () => void;
  onRefresh: () => void;
}

export default function AppBar({ onAddAccount, onRefresh }: AppBarProps) {
  const pathname = usePathname();
  const [showQRDialog, setShowQRDialog] = useState(false);
  
  const routes = [
    { href: "/dashboard", label: "仪表盘" },
    { href: "/contacts",  label: "联系人" },
    { href: "/threads",   label: "会话" },
    { href: "/templates", label: "模板" },
    { href: "/batch",     label: "批量操作" },
    { href: "/knowledge", label: "知识库" },
    { href: "/settings",  label: "设置" },
  ];

  const handleAddAccount = () => {
    console.log('AppBar: 点击添加账号按钮');
    setShowQRDialog(true);
    console.log('AppBar: 设置showQRDialog为true');
    onAddAccount();
  };

  const handleQRSuccess = () => {
    setShowQRDialog(false);
    // 可以在这里添加登录成功的处理逻辑
    console.log('WhatsApp登录成功！');
  };

  const handleIconHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "#f8fafc";
    e.currentTarget.style.borderColor = "#4f46e5";
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.15)";
  };

  const handleIconLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "#fff";
    e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)";
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 1px 3px rgba(16,24,40,.08)";
  };

  const handleTabHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== e.currentTarget.pathname) {
      e.currentTarget.style.color = "#4f46e5";
      e.currentTarget.style.backgroundColor = "rgba(79, 70, 229, 0.05)";
    }
  };

  const handleTabLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== e.currentTarget.pathname) {
      e.currentTarget.style.color = "#667085";
      e.currentTarget.style.backgroundColor = "transparent";
    }
  };

  return (
    <div style={S.appBar}>
      <div style={S.container}>
        <div style={S.appBarRow}>
          <Link href="/dashboard" style={S.brand}>
            <div style={S.brandLogo} />
            <span style={S.brandText}>WhatsApp Ops</span>
          </Link>

          {/* 主导航 */}
          <nav style={S.tabs}>
            {routes.map(r => (
              <Link 
                key={r.href} 
                href={r.href} 
                style={S.tab(pathname === r.href)}
                onMouseEnter={handleTabHover}
                onMouseLeave={handleTabLeave}
              >
                {r.label}
              </Link>
            ))}
          </nav>

          {/* 右侧全局图标按钮：添加账号、刷新、通知、用户 */}
          <div style={S.rightIcons}>
            <button 
              aria-label="Add account" 
              style={S.iconBtn} 
              onClick={handleAddAccount}
              onMouseEnter={handleIconHover}
              onMouseLeave={handleIconLeave}
            >
              ＋
            </button>
            <button 
              aria-label="Refresh status" 
              style={S.iconBtn} 
              onClick={onRefresh}
              onMouseEnter={handleIconHover}
              onMouseLeave={handleIconLeave}
            >
              ⟳
            </button>
            <button 
              aria-label="Notifications" 
              style={S.iconBtn}
              onMouseEnter={handleIconHover}
              onMouseLeave={handleIconLeave}
            >
              🔔
            </button>
            <button 
              aria-label="User" 
              style={S.iconBtn}
              onMouseEnter={handleIconHover}
              onMouseLeave={handleIconLeave}
            >
              👤
            </button>
          </div>
        </div>
      </div>
      
      {/* 二维码登录对话框 */}
      {console.log('AppBar: 渲染QRCodeDialog', { showQRDialog })}
      <QRCodeDialog 
        isOpen={showQRDialog}
        onClose={() => {
          console.log('AppBar: 关闭二维码对话框');
          setShowQRDialog(false);
        }}
        onSuccess={handleQRSuccess}
      />
    </div>
  );
}
