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
    height: 70, display: "flex", alignItems: "center",
    background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(229, 231, 235, 0.8)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
  },
  appBarRow: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" },
  brand: { display: "flex", alignItems: "center", gap: 12, color: "#111827", textDecoration: "none" },
  brandLogo: { 
    width: 28, 
    height: 28, 
    borderRadius: 8, 
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    boxShadow: "0 2px 10px rgba(102, 126, 234, 0.3)"
  },
  brandText: { fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" },
  tabs: { display: "flex", alignItems: "center", gap: 4 },
  tab: (active: boolean = false) => ({
    fontSize: 14, lineHeight: "20px", padding: "10px 14px",
    color: active ? "#667eea" : "#6B7280",
    borderBottom: active ? "2px solid #667eea" : "2px solid transparent",
    textDecoration: "none", borderRadius: 8, cursor: "pointer",
    fontWeight: active ? 600 : 500,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundColor: active ? "rgba(102, 126, 234, 0.05)" : "transparent"
  }),
  rightIcons: { display: "flex", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    background: "#fff", border: "1px solid rgba(229, 231, 235, 0.8)",
    boxShadow: "0 2px 8px rgba(0,0,0,.05)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", userSelect: "none" as const,
    fontSize: 18, color: "#374151",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
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
    e.currentTarget.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    e.currentTarget.style.borderColor = "rgba(102, 126, 234, 0.5)";
    e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
    e.currentTarget.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.3)";
    e.currentTarget.style.color = "#FFFFFF";
  };

  const handleIconLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "#fff";
    e.currentTarget.style.borderColor = "rgba(229, 231, 235, 0.8)";
    e.currentTarget.style.transform = "translateY(0) scale(1)";
    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.05)";
    e.currentTarget.style.color = "#374151";
  };

  const handleTabHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== e.currentTarget.pathname) {
      e.currentTarget.style.color = "#667eea";
      e.currentTarget.style.backgroundColor = "rgba(102, 126, 234, 0.08)";
    }
  };

  const handleTabLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== e.currentTarget.pathname) {
      e.currentTarget.style.color = "#6B7280";
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
      <QRCodeDialog 
        isOpen={showQRDialog} 
        onClose={() => setShowQRDialog(false)}
        onSuccess={() => {
          setShowQRDialog(false);
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
      />
    </div>
  );
}
