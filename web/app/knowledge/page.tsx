'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { KnowledgeItem, FAQCategory } from '@/lib/types';

const S = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '24px',
    background: 'linear-gradient(to bottom, #EEF2FF, #FFFFFF)',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  createButton: {
    background: '#4F46E5',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  createButtonHover: {
    background: '#3730A3',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
  },
  searchBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#FFFFFF',
    maxWidth: '400px',
  },
  categoryFilter: {
    padding: '12px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    background: '#FFFFFF',
    fontSize: '14px',
    minWidth: '150px',
  },
  knowledgeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  knowledgeCard: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  knowledgeCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    borderColor: '#4F46E5',
  },
  categoryBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 500,
    marginBottom: '12px',
  },
  knowledgeTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '8px',
    lineHeight: '1.4',
  },
  knowledgeContent: {
    fontSize: '14px',
    color: '#6B7280',
    lineHeight: '1.5',
    marginBottom: '12px',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  knowledgeFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: '#9CA3AF',
    marginTop: '12px',
  },
  usageCount: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  tags: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap' as const,
    marginTop: '8px',
  },
  tag: {
    background: '#F3F4F6',
    color: '#374151',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
  },
  keywords: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap' as const,
    marginTop: '8px',
  },
  keyword: {
    background: '#EEF2FF',
    color: '#4F46E5',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  actionButton: {
    padding: '6px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    background: '#FFFFFF',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  actionButtonPrimary: {
    background: '#4F46E5',
    color: '#FFFFFF',
    borderColor: '#4F46E5',
  },
  actionButtonDanger: {
    background: '#DC2626',
    color: '#FFFFFF',
    borderColor: '#DC2626',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#6B7280',
  },
  emptyStateIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyStateTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
  },
  emptyStateText: {
    fontSize: '14px',
    marginBottom: '24px',
  },
  statsBar: {
    display: 'flex',
    gap: '24px',
    padding: '16px',
    background: '#F8FAFC',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  statItem: {
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6B7280',
    marginTop: '4px',
  },
  searchResults: {
    background: '#F0F9FF',
    border: '1px solid #BAE6FD',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#0369A1',
  },
};

export default function KnowledgePage() {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    categories: Array<{ category: string; count: number }>;
    popular: Array<{ id: string; title: string; usageCount: number }>;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadKnowledgeItems();
  }, [selectedCategory, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData] = await Promise.all([
        api.faqCategories.list(),
        // api.knowledge.stats(), // 暂时注释掉，等后端实现
      ]);
      
      setCategories(categoriesData);
      // setStats(statsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKnowledgeItems = async () => {
    try {
      const filters = {
        category: selectedCategory || undefined,
        search: searchTerm || undefined,
        isActive: true,
      };
      
      const items = await api.knowledge.list(filters);
      setKnowledgeItems(items);
    } catch (error) {
      console.error('加载知识库失败:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadKnowledgeItems();
      return;
    }

    try {
      const results = await api.knowledge.search(query, { limit: 20 });
      setKnowledgeItems(results);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  const handleUseKnowledge = async (item: KnowledgeItem) => {
    try {
      await api.knowledge.use(item.id);
      
      // 触发知识库使用事件
      window.dispatchEvent(new CustomEvent('knowledgeSelected', { 
        detail: item 
      }));
      
      // 重新加载数据
      loadKnowledgeItems();
      
      alert(`知识库条目"${item.title}"已使用！`);
    } catch (error) {
      console.error('使用知识库条目失败:', error);
      alert('使用失败，请重试');
    }
  };

  const handleDeleteKnowledge = async (item: KnowledgeItem) => {
    if (!confirm(`确定要删除知识库条目"${item.title}"吗？`)) return;
    
    try {
      await api.knowledge.delete(item.id);
      
      // 重新加载数据
      loadKnowledgeItems();
      
      alert('知识库条目删除成功！');
    } catch (error) {
      console.error('删除知识库条目失败:', error);
      alert('删除失败，请重试');
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.name === categoryId) || {
      name: categoryId,
      icon: '📝',
      color: '#6B7280'
    };
  };

  const filteredItems = knowledgeItems.filter(item => {
    if (selectedCategory && item.category !== selectedCategory) return false;
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !item.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div style={S.container}>
        <div style={S.loadingContainer}>
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div style={S.container}>
      <div style={S.header}>
        <h1 style={S.title}>知识库管理</h1>
        <button 
          style={S.createButton}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, S.createButtonHover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, S.createButton)}
        >
          ➕ 创建知识库条目
        </button>
      </div>

      <div style={S.searchBar}>
        <input
          type="text"
          placeholder="搜索知识库..."
          style={S.searchInput}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (e.target.value.trim()) {
              handleSearch(e.target.value);
            }
          }}
        />
        
        <select 
          style={S.categoryFilter}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">所有分类</option>
          {categories.map(category => (
            <option key={category.id} value={category.name}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      {searchTerm && (
        <div style={S.searchResults}>
          搜索 "{searchTerm}" 找到 {filteredItems.length} 个结果
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div style={S.emptyState}>
          <div style={S.emptyStateIcon}>📚</div>
          <div style={S.emptyStateTitle}>暂无知识库条目</div>
          <div style={S.emptyStateText}>
            {searchTerm || selectedCategory 
              ? '没有找到符合条件的知识库条目，请调整筛选条件' 
              : '还没有创建任何知识库条目，点击上方按钮开始创建'}
          </div>
        </div>
      ) : (
        <div style={S.knowledgeGrid}>
          {filteredItems.map(item => {
            const categoryInfo = getCategoryInfo(item.category);
            const isHovered = hoveredItem === item.id;
            
            return (
              <div
                key={item.id}
                style={{
                  ...S.knowledgeCard,
                  ...(isHovered ? S.knowledgeCardHover : {}),
                }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div style={{
                  ...S.categoryBadge,
                  background: categoryInfo.color + '20',
                  color: categoryInfo.color,
                }}>
                  {categoryInfo.icon} {categoryInfo.name}
                </div>
                
                <div style={S.knowledgeTitle}>{item.title}</div>
                <div style={S.knowledgeContent}>{item.content}</div>
                
                {item.tags.length > 0 && (
                  <div style={S.tags}>
                    {item.tags.map(tag => (
                      <span key={tag} style={S.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {item.keywords.length > 0 && (
                  <div style={S.keywords}>
                    {item.keywords.slice(0, 5).map(keyword => (
                      <span key={keyword} style={S.keyword}>
                        {keyword}
                      </span>
                    ))}
                    {item.keywords.length > 5 && (
                      <span style={S.keyword}>+{item.keywords.length - 5}</span>
                    )}
                  </div>
                )}
                
                <div style={S.knowledgeFooter}>
                  <div style={S.usageCount}>
                    📊 使用 {item.usageCount} 次
                  </div>
                  <div>
                    优先级: {item.priority}
                  </div>
                </div>

                <div style={S.actions}>
                  <button
                    style={{...S.actionButton, ...S.actionButtonPrimary}}
                    onClick={() => handleUseKnowledge(item)}
                  >
                    使用
                  </button>
                  <button
                    style={S.actionButton}
                    onClick={() => {
                      // TODO: 实现编辑功能
                      alert('编辑功能待实现');
                    }}
                  >
                    编辑
                  </button>
                  <button
                    style={{...S.actionButton, ...S.actionButtonDanger}}
                    onClick={() => handleDeleteKnowledge(item)}
                  >
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
