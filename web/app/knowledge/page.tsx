'use client';

import { useState, useEffect, useMemo } from 'react';
import WhatsAppLayout, { WhatsAppColors } from '@/components/layout/WhatsAppLayout';
import Sidebar from '@/components/layout/Sidebar';
import { api } from '@/lib/api';

// 类型定义
interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  keywords: string[];
  priority: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface KnowledgeStats {
  totalItems: number;
  activeItems: number;
  totalUsage: number;
  popularItems: KnowledgeItem[];
  categoryStats: { category: string; count: number }[];
}

type SortOption = 'recent' | 'usage' | 'title' | 'priority';
type FilterOption = 'all' | 'active' | 'inactive' | 'popular';

// 样式定义
const styles = {
  // 列表面板样式
  listHeader: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '10px 16px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: WhatsAppColors.border,
  },
  headerTitle: {
    color: WhatsAppColors.textPrimary,
    fontSize: '20px',
    fontWeight: '600' as const,
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  addButton: {
    padding: '6px 12px',
    backgroundColor: WhatsAppColors.accent,
    color: '#fff',
    borderWidth: '0',
    borderStyle: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  },
  manageCategoriesButton: {
    padding: '6px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    color: WhatsAppColors.textPrimary,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: WhatsAppColors.border,
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  },
  searchBar: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '8px 12px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: WhatsAppColors.border,
  },
  searchInput: {
    width: '100%',
    backgroundColor: WhatsAppColors.inputBackground,
    borderWidth: '0',
    borderStyle: 'none',
    borderRadius: '8px',
    padding: '8px 12px 8px 40px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
  },
  // 统计卡片
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    padding: '12px',
    backgroundColor: WhatsAppColors.panelBackground,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: WhatsAppColors.border,
  },
  statCard: {
    padding: '12px',
    backgroundColor: WhatsAppColors.inputBackground,
    borderRadius: '8px',
    textAlign: 'center' as const,
  },
  statIcon: {
    fontSize: '24px',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '700' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '2px',
  },
  statLabel: {
    fontSize: '12px',
    color: WhatsAppColors.textSecondary,
  },
  // 筛选和排序
  filterBar: {
    display: 'flex',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: WhatsAppColors.panelBackground,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: WhatsAppColors.border,
    overflowX: 'auto' as const,
  },
  filterButton: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: WhatsAppColors.border,
    borderRadius: '16px',
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s',
  },
  sortSelect: {
    padding: '6px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: WhatsAppColors.border,
    borderRadius: '6px',
    fontSize: '13px',
    color: WhatsAppColors.textPrimary,
    cursor: 'pointer',
    outline: 'none',
  },
  // 知识库列表
  knowledgeList: {
    overflowY: 'auto' as const,
    flex: 1,
  },
  knowledgeItem: {
    padding: '16px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: WhatsAppColors.border,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  knowledgeTitle: {
    color: WhatsAppColors.textPrimary,
    fontSize: '15px',
    fontWeight: '500' as const,
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  knowledgeCategory: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    backgroundColor: 'rgba(0, 168, 132, 0.2)',
    color: WhatsAppColors.accent,
  },
  knowledgePreview: {
    color: WhatsAppColors.textSecondary,
    fontSize: '13px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    marginBottom: '6px',
  },
  knowledgeMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    color: WhatsAppColors.textSecondary,
  },
  // 详情面板
  detailPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: WhatsAppColors.background,
  },
  detailHeader: {
    padding: '20px 30px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: WhatsAppColors.border,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: '24px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
  },
  detailBody: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '30px',
  },
  label: {
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
    marginBottom: '8px',
    fontWeight: '600' as const,
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: WhatsAppColors.border,
    borderRadius: '8px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
    marginBottom: '16px',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: WhatsAppColors.border,
    borderRadius: '8px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
    marginBottom: '16px',
    resize: 'vertical' as const,
    minHeight: '200px',
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: WhatsAppColors.border,
    borderRadius: '8px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
    marginBottom: '16px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
  },
  saveButton: {
    padding: '12px 32px',
    backgroundColor: WhatsAppColors.accent,
    color: '#fff',
    borderWidth: '0',
    borderStyle: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '12px 32px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    borderWidth: '0',
    borderStyle: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '12px 32px',
    backgroundColor: WhatsAppColors.textSecondary,
    color: '#fff',
    borderWidth: '0',
    borderStyle: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  },
  // 模态框
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: WhatsAppColors.background,
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto' as const,
  },
  modalHeader: {
    fontSize: '20px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '20px',
  },
  // 加载和空状态
  loadingState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: WhatsAppColors.textSecondary,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    textAlign: 'center' as const,
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '8px',
  },
  emptySubtext: {
    fontSize: '14px',
    color: WhatsAppColors.textSecondary,
  },
};

// 统计卡片组件
function StatCard({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

// 主组件
export default function KnowledgePage() {
  // 状态管理
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📁');
  const [newCategoryColor, setNewCategoryColor] = useState('#00a884');

  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: [] as string[],
    keywords: [] as string[],
    priority: 0,
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 开始加载知识库数据...');
      
      const [itemsData, categoriesData, statsData] = await Promise.all([
        api.knowledge.list(),
        api.knowledge.categories.list(),
        api.knowledge.getStats(),
      ]);
      
      console.log('✅ 知识库数据加载成功:', {
        知识条目数量: Array.isArray(itemsData) ? itemsData.length : 0,
        分类数量: Array.isArray(categoriesData) ? categoriesData.length : 0,
        统计数据: statsData,
      });
      
      setKnowledgeBase(Array.isArray(itemsData) ? itemsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setStats(statsData || null);
    } catch (error) {
      console.error('❌ 加载数据失败:', error);
      setKnowledgeBase([]);
      setCategories([]);
      setStats(null);
      alert('加载数据失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 筛选和排序
  const filteredAndSortedKnowledge = useMemo(() => {
    let filtered = knowledgeBase;

    // 搜索筛选
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.content.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.keywords.some(k => k.toLowerCase().includes(searchLower))
      );
    }

    // 分类筛选
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // 状态筛选
    if (filterBy === 'active') {
      filtered = filtered.filter(item => item.isActive);
    } else if (filterBy === 'inactive') {
      filtered = filtered.filter(item => !item.isActive);
    } else if (filterBy === 'popular') {
      filtered = filtered.filter(item => item.usageCount > 0);
    }

    // 排序
    const sorted = [...filtered];
    if (sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'usage') {
      sorted.sort((a, b) => b.usageCount - a.usageCount);
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'priority') {
      sorted.sort((a, b) => b.priority - a.priority);
    }

    return sorted;
  }, [knowledgeBase, searchQuery, selectedCategory, filterBy, sortBy]);

  // CRUD 操作
  const handleAddNew = () => {
    const newItem = {
      id: '',
      title: '新知识条目',
      content: '',
      category: categories.length > 0 ? categories[0].name : 'general',
      tags: [],
      keywords: [],
      priority: 0,
      usageCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedKnowledge(newItem);
    setFormData({
      title: newItem.title,
      content: newItem.content,
      category: newItem.category,
      tags: newItem.tags,
      keywords: newItem.keywords,
      priority: newItem.priority,
    });
    setEditMode(true);
  };

  const handleSelectKnowledge = (item: KnowledgeItem) => {
    setSelectedKnowledge(item);
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      tags: item.tags,
      keywords: item.keywords,
      priority: item.priority,
    });
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('请输入标题');
      return;
    }
    if (!formData.content.trim()) {
      alert('请输入内容');
      return;
    }

    try {
      console.log('💾 准备保存知识条目:', formData);
      let result;
      
      if (selectedKnowledge && selectedKnowledge.id) {
        console.log('📝 更新知识条目 ID:', selectedKnowledge.id);
        result = await api.knowledge.update(selectedKnowledge.id, formData);
        console.log('✅ 知识条目更新成功:', result);
        alert('知识条目已更新！');
      } else {
        console.log('➕ 创建新知识条目');
        result = await api.knowledge.create(formData);
        console.log('✅ 知识条目创建成功:', result);
        alert('知识条目已创建！');
      }
      
      console.log('🔄 重新加载数据...');
      await loadData();
      setEditMode(false);
      setSelectedKnowledge(result);
    } catch (error) {
      console.error('❌ 保存失败:', error);
      alert('保存失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleDelete = async () => {
    if (!selectedKnowledge || !selectedKnowledge.id) return;
    if (!confirm(`确定要删除"${selectedKnowledge.title}"吗？`)) return;

    try {
      console.log('🗑️ 准备删除知识条目 ID:', selectedKnowledge.id);
      await api.knowledge.delete(selectedKnowledge.id);
      console.log('✅ 知识条目删除成功');
      
      console.log('🔄 重新加载数据...');
      await loadData();
      setSelectedKnowledge(null);
      alert('知识条目已删除！');
    } catch (error) {
      console.error('❌ 删除失败:', error);
      alert('删除失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('请输入分类名称');
      return;
    }

    try {
      console.log('📁 准备创建分类:', newCategoryName);
      const result = await api.knowledge.categories.create({
        name: newCategoryName,
        icon: newCategoryIcon,
        color: newCategoryColor,
      });
      console.log('✅ 分类创建成功:', result);
      
      console.log('🔄 重新加载数据...');
      await loadData();
      setShowCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryIcon('📁');
      setNewCategoryColor('#00a884');
      alert('分类已添加！');
    } catch (error) {
      console.error('❌ 添加分类失败:', error);
      alert('添加失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 统计面板
  const statsPanel = stats && (
    <div style={styles.statsContainer}>
      <StatCard icon="📚" value={stats.totalItems} label="总条目" />
      <StatCard icon="✅" value={stats.activeItems} label="活跃条目" />
      <StatCard icon="📊" value={stats.totalUsage} label="总使用次数" />
      <StatCard icon="📂" value={categories.length} label="分类数" />
    </div>
  );

  // 列表面板
  const listPanel = (
    <>
      <div style={styles.listHeader}>
        <div style={styles.headerTitle}>知识库</div>
        <div style={styles.headerActions}>
          <button style={styles.manageCategoriesButton} onClick={() => setShowCategoryModal(true)}>
            📂 管理分类
          </button>
          <button style={styles.addButton} onClick={handleAddNew}>
            + 新建
          </button>
        </div>
      </div>

      {statsPanel}

      <div style={styles.searchBar}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: WhatsAppColors.textSecondary }}>🔍</span>
          <input
            type="text"
            placeholder="搜索知识库"
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.filterBar}>
        <button
          style={{
            ...styles.filterButton,
            borderColor: selectedCategory === 'all' ? WhatsAppColors.accent : WhatsAppColors.border,
            color: selectedCategory === 'all' ? WhatsAppColors.accent : WhatsAppColors.textSecondary,
          }}
          onClick={() => setSelectedCategory('all')}
        >
          全部
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            style={{
              ...styles.filterButton,
              borderColor: selectedCategory === cat.name ? WhatsAppColors.accent : WhatsAppColors.border,
              color: selectedCategory === cat.name ? WhatsAppColors.accent : WhatsAppColors.textSecondary,
            }}
            onClick={() => setSelectedCategory(cat.name)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <select
          style={styles.sortSelect}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
        >
          <option value="recent">最新</option>
          <option value="usage">最常用</option>
          <option value="title">标题</option>
          <option value="priority">优先级</option>
        </select>
      </div>

      <div style={styles.knowledgeList}>
        {loading ? (
          <div style={styles.loadingState}>
            <div style={{fontSize: '24px', marginBottom: '12px'}}>⏳</div>
            <div>加载中...</div>
          </div>
        ) : filteredAndSortedKnowledge.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyText}>
              {searchQuery || selectedCategory !== 'all' ? '未找到匹配的知识条目' : '暂无知识条目'}
            </div>
            <div style={styles.emptySubtext}>
              {searchQuery || selectedCategory !== 'all' ? '尝试修改搜索条件或筛选器' : '点击"新建"按钮创建第一个知识条目'}
            </div>
          </div>
        ) : (
          filteredAndSortedKnowledge.map((item) => (
            <div
              key={item.id}
              style={{
                ...styles.knowledgeItem,
                backgroundColor: selectedKnowledge?.id === item.id ? WhatsAppColors.hover : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (selectedKnowledge?.id !== item.id) {
                  e.currentTarget.style.backgroundColor = WhatsAppColors.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedKnowledge?.id !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onClick={() => handleSelectKnowledge(item)}
            >
              <div style={styles.knowledgeTitle}>
                <span>{item.title}</span>
                <span style={styles.knowledgeCategory}>{item.category}</span>
                {!item.isActive && (
                  <span style={{ ...styles.knowledgeCategory, backgroundColor: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c' }}>
                    未启用
                  </span>
                )}
              </div>
              <div style={styles.knowledgePreview}>
                {item.content.substring(0, 80)}...
              </div>
              <div style={styles.knowledgeMeta}>
                <span>💬 使用 {item.usageCount} 次</span>
                <span>⭐ 优先级 {item.priority}</span>
                <span>🏷️ {item.keywords.length} 个关键词</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  // 详情面板
  const mainContent = selectedKnowledge ? (
    <div style={styles.detailPanel}>
      <div style={styles.detailHeader}>
        <div style={styles.detailTitle}>
          {editMode ? (selectedKnowledge.id ? '编辑知识条目' : '新建知识条目') : selectedKnowledge.title}
        </div>
        {!editMode && (
          <button style={styles.addButton} onClick={() => setEditMode(true)}>
            ✏️ 编辑
          </button>
        )}
      </div>

      <div style={styles.detailBody}>
        <label style={styles.label}>标题</label>
        <input
          type="text"
          value={editMode ? formData.title : selectedKnowledge.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          style={styles.input}
          disabled={!editMode}
        />

        <label style={styles.label}>分类</label>
        <select
          value={editMode ? formData.category : selectedKnowledge.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          style={styles.select}
          disabled={!editMode}
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
          ))}
        </select>

        <label style={styles.label}>内容</label>
        <textarea
          value={editMode ? formData.content : selectedKnowledge.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          style={styles.textarea}
          disabled={!editMode}
          placeholder="输入知识内容..."
        />

        <label style={styles.label}>关键词（用逗号分隔）</label>
        <input
          type="text"
          value={editMode ? formData.keywords.join(', ') : selectedKnowledge.keywords.join(', ')}
          onChange={(e) => setFormData({
            ...formData,
            keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
          })}
          style={styles.input}
          disabled={!editMode}
          placeholder="关键词1, 关键词2, 关键词3"
        />

        <label style={styles.label}>优先级 (0-100)</label>
        <input
          type="number"
          min="0"
          max="100"
          value={editMode ? formData.priority : selectedKnowledge.priority}
          onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
          style={styles.input}
          disabled={!editMode}
        />

        {!editMode && (
          <>
            <label style={styles.label}>统计信息</label>
            <div style={{ ...styles.input, display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span>💬 使用次数: {selectedKnowledge.usageCount}</span>
              <span>📅 创建时间: {new Date(selectedKnowledge.createdAt).toLocaleString('zh-CN')}</span>
            </div>
          </>
        )}

        <div style={styles.buttonGroup}>
          {editMode ? (
            <>
              <button style={styles.saveButton} onClick={handleSave}>
                保存
              </button>
              <button style={styles.cancelButton} onClick={() => {
                setEditMode(false);
                if (!selectedKnowledge.id) {
                  setSelectedKnowledge(null);
                }
              }}>
                取消
              </button>
            </>
          ) : (
            <>
              <button style={styles.deleteButton} onClick={handleDelete}>
                删除
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div style={styles.emptyState}>
      <div style={styles.emptyText}>请选择或创建一个知识条目</div>
      <div style={styles.emptySubtext}>在左侧列表中选择知识条目以查看详情</div>
    </div>
  );

  // 分类管理模态框
  const categoryModal = showCategoryModal && (
    <div style={styles.modalOverlay} onClick={() => setShowCategoryModal(false)}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>添加新分类</div>
        
        <label style={styles.label}>分类名称</label>
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          style={styles.input}
          placeholder="输入分类名称"
        />

        <label style={styles.label}>图标（Emoji）</label>
        <input
          type="text"
          value={newCategoryIcon}
          onChange={(e) => setNewCategoryIcon(e.target.value)}
          style={styles.input}
          placeholder="选择一个 Emoji"
        />

        <label style={styles.label}>颜色</label>
        <input
          type="color"
          value={newCategoryColor}
          onChange={(e) => setNewCategoryColor(e.target.value)}
          style={styles.input}
        />

        <div style={styles.buttonGroup}>
          <button style={styles.saveButton} onClick={handleAddCategory}>
            添加
          </button>
          <button style={styles.cancelButton} onClick={() => setShowCategoryModal(false)}>
            取消
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <WhatsAppLayout
        sidebar={<Sidebar />}
        listPanel={listPanel}
        mainContent={mainContent}
      />
      {categoryModal}
    </>
  );
}
