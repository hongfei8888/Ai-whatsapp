'use client';

import { useState, useEffect, useMemo } from 'react';
import { WhatsAppColors } from './layout/WhatsAppLayout';

// 类型定义
interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  keywords: string[];
  usageCount: number;
  isActive: boolean;
}

interface KnowledgeSelectorProps {
  onSelect: (knowledge: KnowledgeItem) => void;
  onClose?: () => void;
  searchQuery?: string;
  category?: string;
}

// 样式定义
const styles = {
  container: {
    position: 'absolute' as const,
    bottom: '60px',
    left: '0',
    right: '0',
    maxHeight: '400px',
    backgroundColor: WhatsAppColors.panelBackground,
    borderTopWidth: '1px',
    borderTopStyle: 'solid' as const,
    borderTopColor: WhatsAppColors.border,
    display: 'flex',
    flexDirection: 'column' as const,
    zIndex: 100,
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
  },
  header: {
    padding: '12px 16px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid' as const,
    borderBottomColor: WhatsAppColors.border,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
  },
  closeButton: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    borderWidth: '0',
    borderStyle: 'none',
    color: WhatsAppColors.textSecondary,
    cursor: 'pointer',
    fontSize: '20px',
  },
  searchBar: {
    padding: '8px 16px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid' as const,
    borderBottomColor: WhatsAppColors.border,
    display: 'flex',
    gap: '8px',
  },
  searchInput: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    borderWidth: '1px',
    borderStyle: 'solid' as const,
    borderColor: WhatsAppColors.border,
    borderRadius: '8px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
  },
  categoryFilter: {
    padding: '8px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    borderWidth: '1px',
    borderStyle: 'solid' as const,
    borderColor: WhatsAppColors.border,
    borderRadius: '8px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none',
  },
  list: {
    flex: 1,
    overflowY: 'auto' as const,
  },
  item: {
    padding: '12px 16px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid' as const,
    borderBottomColor: WhatsAppColors.border,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: '500' as const,
    color: WhatsAppColors.textPrimary,
  },
  itemCategory: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '8px',
    backgroundColor: 'rgba(0, 168, 132, 0.2)',
    color: WhatsAppColors.accent,
  },
  itemContent: {
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    marginBottom: '4px',
  },
  itemMeta: {
    fontSize: '12px',
    color: WhatsAppColors.textSecondary,
    display: 'flex',
    gap: '12px',
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center' as const,
    color: WhatsAppColors.textSecondary,
  },
  loadingState: {
    padding: '40px 20px',
    textAlign: 'center' as const,
    color: WhatsAppColors.textSecondary,
  },
  popularSection: {
    padding: '8px 16px',
    backgroundColor: WhatsAppColors.inputBackground,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid' as const,
    borderBottomColor: WhatsAppColors.border,
  },
  popularTitle: {
    fontSize: '12px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textSecondary,
    marginBottom: '8px',
  },
  popularTags: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  popularTag: {
    padding: '4px 8px',
    backgroundColor: WhatsAppColors.panelBackground,
    borderWidth: '1px',
    borderStyle: 'solid' as const,
    borderColor: WhatsAppColors.border,
    borderRadius: '12px',
    fontSize: '12px',
    color: WhatsAppColors.textPrimary,
    cursor: 'pointer',
  },
};

export default function KnowledgeSelector({
  onSelect,
  onClose,
  searchQuery: initialSearch = '',
  category: initialCategory = '',
}: KnowledgeSelectorProps) {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [popularItems, setPopularItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [categories, setCategories] = useState<string[]>([]);

  // 加载数据
  useEffect(() => {
    loadKnowledge();
    loadPopular();
  }, []);

  const loadKnowledge = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/knowledge');
      const data = await response.json();
      
      if (data.ok && Array.isArray(data.data)) {
        setKnowledgeItems(data.data);
        
        // 提取所有分类
        const allCategories = Array.from(new Set(data.data.map((item: KnowledgeItem) => item.category))) as string[];
        setCategories(allCategories);
      }
    } catch (error) {
      console.error('加载知识库失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPopular = async () => {
    try {
      const response = await fetch('http://localhost:4000/knowledge/popular?limit=5');
      const data = await response.json();
      
      if (data.ok && Array.isArray(data.data)) {
        setPopularItems(data.data);
      }
    } catch (error) {
      console.error('加载热门知识失败:', error);
    }
  };

  // 筛选知识
  const filteredKnowledge = useMemo(() => {
    let filtered = knowledgeItems.filter(item => item.isActive);

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.content.toLowerCase().includes(searchLower) ||
        item.keywords.some(k => k.toLowerCase().includes(searchLower))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // 按使用次数排序
    return filtered.sort((a, b) => b.usageCount - a.usageCount);
  }, [knowledgeItems, searchQuery, selectedCategory]);

  const handleSelectItem = (item: KnowledgeItem) => {
    onSelect(item);
  };

  const handleQuickSearch = (keyword: string) => {
    setSearchQuery(keyword);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>💡 知识库</div>
        {onClose && (
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="搜索知识库..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={styles.categoryFilter}
        >
          <option value="">所有分类</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {!searchQuery && popularItems.length > 0 && (
        <div style={styles.popularSection}>
          <div style={styles.popularTitle}>🔥 热门知识</div>
          <div style={styles.popularTags}>
            {popularItems.map(item => (
              <button
                key={item.id}
                style={styles.popularTag}
                onClick={() => handleQuickSearch(item.title)}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={styles.list}>
        {loading ? (
          <div style={styles.loadingState}>
            <div style={{fontSize: '24px', marginBottom: '8px'}}>⏳</div>
            <div>加载中...</div>
          </div>
        ) : filteredKnowledge.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{fontSize: '32px', marginBottom: '8px'}}>📭</div>
            <div>{searchQuery ? '未找到匹配的知识' : '暂无知识条目'}</div>
          </div>
        ) : (
          filteredKnowledge.map(item => (
            <div
              key={item.id}
              style={styles.item}
              onClick={() => handleSelectItem(item)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={styles.itemHeader}>
                <div style={styles.itemTitle}>{item.title}</div>
                <div style={styles.itemCategory}>{item.category}</div>
              </div>
              <div style={styles.itemContent}>{item.content}</div>
              <div style={styles.itemMeta}>
                <span>💬 {item.usageCount} 次使用</span>
                <span>🏷️ {item.keywords.slice(0, 3).join(', ')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

