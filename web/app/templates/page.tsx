'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { MessageTemplate, TemplateCategory, TemplateFilters } from '@/lib/types';

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
  filters: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    background: '#FFFFFF',
    fontSize: '14px',
    minWidth: '150px',
  },
  searchInput: {
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    background: '#FFFFFF',
    fontSize: '14px',
    minWidth: '200px',
    flex: 1,
    maxWidth: '300px',
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  templateCard: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  templateCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    border: '1px solid #4F46E5',
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
  templateName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '8px',
    lineHeight: '1.4',
  },
  templateContent: {
    fontSize: '14px',
    color: '#6B7280',
    lineHeight: '1.5',
    marginBottom: '12px',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  templateFooter: {
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
  variables: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap' as const,
    marginTop: '8px',
  },
  variableTag: {
    background: '#F3F4F6',
    color: '#374151',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontFamily: 'monospace',
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
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    categories: Array<{ category: string; count: number }>;
    popular: Array<{ id: string; name: string; usageCount: number }>;
  } | null>(null);
  
  // 创建模板相关状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    content: '',
    category: '',
    description: ''
  });
  const [creating, setCreating] = useState(false);
  
  // 分类管理相关状态
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '📝',
    color: '#6B7280'
  });
  const [managingCategory, setManagingCategory] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [selectedCategory, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, categoriesData, statsData] = await Promise.all([
        api.templates.list(),
        api.categories.list(),
        api.templates.stats(),
      ]);
      
      setTemplates(templatesData);
      setCategories(categoriesData);
      setStats(statsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const filters: TemplateFilters = {
        category: selectedCategory || undefined,
        search: searchTerm || undefined,
        isActive: true,
      };
      
      const templatesData = await api.templates.list(filters);
      setTemplates(templatesData);
    } catch (error) {
      console.error('加载模板失败:', error);
    }
  };

  const handleUseTemplate = async (template: MessageTemplate) => {
    try {
      await api.templates.use(template.id);
      
      // 触发模板使用事件
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('templateSelected', { 
          detail: template 
        }));
      }
      
      // 重新加载数据
      loadData();
      
      alert(`模板"${template.name}"已使用！`);
    } catch (error) {
      console.error('使用模板失败:', error);
      alert('使用模板失败，请重试');
    }
  };

  const handleDuplicateTemplate = async (template: MessageTemplate) => {
    try {
      const newName = prompt('请输入新模板名称:', `${template.name} (副本)`);
      if (!newName) return;
      
      await api.templates.duplicate(template.id, newName);
      
      // 重新加载数据
      loadData();
      
      alert('模板复制成功！');
    } catch (error) {
      console.error('复制模板失败:', error);
      alert('复制模板失败，请重试');
    }
  };

  const handleDeleteTemplate = async (template: MessageTemplate) => {
    if (!confirm(`确定要删除模板"${template.name}"吗？`)) return;
    
    try {
      await api.templates.delete(template.id);
      
      // 重新加载数据
      loadData();
      
      alert('模板删除成功！');
    } catch (error) {
      console.error('删除模板失败:', error);
      alert('删除模板失败，请重试');
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.name === categoryId) || {
      name: categoryId,
      icon: '📝',
      color: '#6B7280'
    };
  };

  // 创建模板功能
  const handleCreateTemplate = () => {
    setShowCreateModal(true);
    setCreateForm({
      name: '',
      content: '',
      category: '',
      description: ''
    });
  };

  const handleCreateFormChange = (field: string, value: string) => {
    setCreateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitCreate = async () => {
    if (!createForm.name.trim() || !createForm.content.trim() || !createForm.category) {
      alert('请填写所有必填字段');
      return;
    }

    setCreating(true);
    try {
      // 创建模板数据
      const templateData = {
        name: createForm.name.trim(),
        content: createForm.content.trim(),
        category: createForm.category,
        description: createForm.description.trim(),
        isActive: true,
        usageCount: 0
      };

      // 调用API创建模板
      await api.templates.create(templateData);
      
      // 重新加载数据
      await loadData();
      
      // 关闭弹窗并重置表单
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        content: '',
        category: '',
        description: ''
      });
      
      alert('模板创建成功！');
    } catch (error) {
      console.error('创建模板失败:', error);
      alert('创建模板失败，请重试');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setCreateForm({
      name: '',
      content: '',
      category: '',
      description: ''
    });
  };

  // 分类管理功能
  const handleManageCategories = () => {
    setShowCategoryModal(true);
    setCategoryForm({
      name: '',
      description: '',
      icon: '📝',
      color: '#6B7280'
    });
  };

  const handleCategoryFormChange = (field: string, value: string) => {
    setCategoryForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitCategory = async () => {
    if (!categoryForm.name.trim()) {
      alert('请输入分类名称');
      return;
    }

    setManagingCategory(true);
    try {
      // 创建分类数据
      const categoryData = {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
        icon: categoryForm.icon,
        color: categoryForm.color
      };

      // 调用API创建分类
      await api.categories.create(categoryData);
      
      // 重新加载数据
      await loadData();
      
      // 关闭弹窗并重置表单
      setShowCategoryModal(false);
      setCategoryForm({
        name: '',
        description: '',
        icon: '📝',
        color: '#6B7280'
      });
      
      alert('分类创建成功！');
    } catch (error) {
      console.error('创建分类失败:', error);
      alert('创建分类失败，请重试');
    } finally {
      setManagingCategory(false);
    }
  };

  const handleDeleteCategory = async (category: TemplateCategory) => {
    if (!confirm(`确定要删除分类"${category.name}"吗？删除后该分类下的所有模板将变为未分类状态。`)) {
      return;
    }

    try {
      await api.categories.delete(category.id);
      await loadData();
      alert('分类删除成功！');
    } catch (error) {
      console.error('删除分类失败:', error);
      alert('删除分类失败，请重试');
    }
  };

  const handleCancelCategory = () => {
    setShowCategoryModal(false);
    setCategoryForm({
      name: '',
      description: '',
      icon: '📝',
      color: '#6B7280'
    });
  };

  const filteredTemplates = templates.filter(template => {
    if (selectedCategory && template.category !== selectedCategory) return false;
    if (searchTerm && !template.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !template.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;
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
        <h1 style={S.title}>消息模板管理</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            style={{
              ...S.createButton,
              background: '#10B981',
              fontSize: '13px',
              padding: '10px 20px'
            }}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, {
              ...S.createButtonHover,
              background: '#059669'
            })}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, {
              ...S.createButton,
              background: '#10B981'
            })}
            onClick={handleManageCategories}
          >
            🏷️ 管理分类
          </button>
          <button 
            style={S.createButton}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, S.createButtonHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, S.createButton)}
            onClick={handleCreateTemplate}
          >
            ➕ 创建模板
          </button>
        </div>
      </div>

      {stats && (
        <div style={S.statsBar}>
          <div style={S.statItem}>
            <div style={S.statValue}>{stats.total}</div>
            <div style={S.statLabel}>总模板数</div>
          </div>
          <div style={S.statItem}>
            <div style={S.statValue}>{stats.active}</div>
            <div style={S.statLabel}>激活模板</div>
          </div>
          <div style={S.statItem}>
            <div style={S.statValue}>{stats.categories.length}</div>
            <div style={S.statLabel}>分类数量</div>
          </div>
          <div style={S.statItem}>
            <div style={S.statValue}>{stats.popular[0]?.usageCount || 0}</div>
            <div style={S.statLabel}>最高使用次数</div>
          </div>
        </div>
      )}

      <div style={S.filters}>
        <select 
          style={S.filterSelect}
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
        
        <input
          type="text"
          placeholder="搜索模板..."
          style={S.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredTemplates.length === 0 ? (
        <div style={S.emptyState}>
          <div style={S.emptyStateIcon}>📝</div>
          <div style={S.emptyStateTitle}>暂无模板</div>
          <div style={S.emptyStateText}>
            {searchTerm || selectedCategory 
              ? '没有找到符合条件的模板，请调整筛选条件' 
              : '还没有创建任何模板，点击上方按钮开始创建'}
          </div>
        </div>
      ) : (
        <div style={S.templateGrid}>
          {filteredTemplates.map(template => {
            const categoryInfo = getCategoryInfo(template.category);
            const isHovered = hoveredTemplate === template.id;
            
            return (
              <div
                key={template.id}
                style={{
                  ...S.templateCard,
                  ...(isHovered ? S.templateCardHover : {}),
                }}
                onMouseEnter={() => setHoveredTemplate(template.id)}
                onMouseLeave={() => setHoveredTemplate(null)}
              >
                <div style={{
                  ...S.categoryBadge,
                  background: categoryInfo.color + '20',
                  color: categoryInfo.color,
                }}>
                  {categoryInfo.icon} {categoryInfo.name}
                </div>
                
                <div style={S.templateName}>{template.name}</div>
                <div style={S.templateContent}>{template.content}</div>
                
                {template.variables.length > 0 && (
                  <div style={S.variables}>
                    {template.variables.map(variable => (
                      <span key={variable} style={S.variableTag}>
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                )}
                
                <div style={S.templateFooter}>
                  <div style={S.usageCount}>
                    📊 使用 {template.usageCount} 次
                  </div>
                  {template.lastUsedAt && (
                    <div>
                      最后使用: {new Date(template.lastUsedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div style={S.actions}>
                  <button
                    style={{...S.actionButton, ...S.actionButtonPrimary}}
                    onClick={() => handleUseTemplate(template)}
                  >
                    使用
                  </button>
                  <button
                    style={S.actionButton}
                    onClick={() => handleDuplicateTemplate(template)}
                  >
                    复制
                  </button>
                  <button
                    style={{...S.actionButton, ...S.actionButtonDanger}}
                    onClick={() => handleDeleteTemplate(template)}
                  >
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 创建模板弹窗 */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#111827',
                margin: 0
              }}>
                📝 创建新模板
              </h2>
              <button
                onClick={handleCancelCreate}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px'
              }}>
                模板名称 *
              </label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => handleCreateFormChange('name', e.target.value)}
                placeholder="请输入模板名称"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px'
              }}>
                模板内容 *
              </label>
              <textarea
                value={createForm.content}
                onChange={(e) => handleCreateFormChange('content', e.target.value)}
                placeholder="请输入模板内容"
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px'
              }}>
                模板分类 *
              </label>
              <select
                value={createForm.category}
                onChange={(e) => handleCreateFormChange('category', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">请选择分类</option>
                {categories.map(category => (
                  <option key={category.name} value={category.name}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px'
              }}>
                模板描述
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) => handleCreateFormChange('description', e.target.value)}
                placeholder="请输入模板描述（可选）"
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCancelCreate}
                disabled={creating}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#374151',
                  fontSize: '14px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.6 : 1
                }}
              >
                取消
              </button>
              <button
                onClick={handleSubmitCreate}
                disabled={creating}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: creating ? '#9CA3AF' : '#4F46E5',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.6 : 1
                }}
              >
                {creating ? '创建中...' : '创建模板'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 分类管理弹窗 */}
      {showCategoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#111827',
                margin: 0
              }}>
                🏷️ 分类管理
              </h2>
              <button
                onClick={handleCancelCategory}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            {/* 现有分类列表 */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '12px'
              }}>
                现有分类
              </h3>
              {categories.length === 0 ? (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#6B7280',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px'
                }}>
                  暂无分类
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {categories.map(category => (
                    <div
                      key={category.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        backgroundColor: '#F3F4F6',
                        borderRadius: '20px',
                        fontSize: '14px'
                      }}
                    >
                      <span style={{ color: category.color }}>{category.icon}</span>
                      <span>{category.name}</span>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '2px 4px',
                          borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#FEE2E2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 添加新分类表单 */}
            <div style={{
              borderTop: '1px solid #E5E7EB',
              paddingTop: '20px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '16px'
              }}>
                添加新分类
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  分类名称 *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => handleCategoryFormChange('name', e.target.value)}
                  placeholder="请输入分类名称"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  分类图标
                </label>
                <input
                  type="text"
                  value={categoryForm.icon}
                  onChange={(e) => handleCategoryFormChange('icon', e.target.value)}
                  placeholder="选择图标"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{
                  fontSize: '12px',
                  color: '#6B7280',
                  marginTop: '4px'
                }}>
                  推荐图标：📝 📋 📄 📊 📈 📉 💬 🎯 ⭐ 🔥
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  分类颜色
                </label>
                <select
                  value={categoryForm.color}
                  onChange={(e) => handleCategoryFormChange('color', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="#6B7280">灰色</option>
                  <option value="#EF4444">红色</option>
                  <option value="#F59E0B">橙色</option>
                  <option value="#10B981">绿色</option>
                  <option value="#3B82F6">蓝色</option>
                  <option value="#8B5CF6">紫色</option>
                  <option value="#EC4899">粉色</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  分类描述
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => handleCategoryFormChange('description', e.target.value)}
                  placeholder="请输入分类描述（可选）"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={handleCancelCategory}
                  disabled={managingCategory}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    color: '#374151',
                    fontSize: '14px',
                    cursor: managingCategory ? 'not-allowed' : 'pointer',
                    opacity: managingCategory ? 0.6 : 1
                  }}
                >
                  关闭
                </button>
                <button
                  onClick={handleSubmitCategory}
                  disabled={managingCategory}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    background: managingCategory ? '#9CA3AF' : '#10B981',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    cursor: managingCategory ? 'not-allowed' : 'pointer',
                    opacity: managingCategory ? 0.6 : 1
                  }}
                >
                  {managingCategory ? '添加中...' : '添加分类'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
