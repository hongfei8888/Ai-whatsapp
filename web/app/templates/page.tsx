'use client';

import { useState, useEffect } from 'react';
import WhatsAppLayout, { WhatsAppColors } from '@/components/layout/WhatsAppLayout';
import Sidebar from '@/components/layout/Sidebar';
import { api } from '@/lib/api';

const styles = {
  listHeader: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '10px 16px',
    minHeight: '60px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  toolbarRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  select: {
    padding: '6px 10px',
    backgroundColor: WhatsAppColors.inputBackground,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '6px',
    color: WhatsAppColors.textPrimary,
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
  },
  searchBar: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '8px 12px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  searchInput: {
    width: '100%',
    backgroundColor: WhatsAppColors.inputBackground,
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px 8px 40px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
  },
  templateList: {
    overflowY: 'auto' as const,
    flex: 1,
  },
  templateItem: {
    padding: '16px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  templateName: {
    color: WhatsAppColors.textPrimary,
    fontSize: '15px',
    fontWeight: '500' as const,
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  templateMeta: {
    fontSize: '12px',
    color: WhatsAppColors.textSecondary,
    marginBottom: '6px',
  },
  templateContent: {
    color: WhatsAppColors.textSecondary,
    fontSize: '13px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  badge: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600' as const,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 168, 132, 0.15)',
    color: WhatsAppColors.accent,
  },
  usageBadge: {
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
    color: '#f39c12',
  },
  detailPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
  },
  detailHeader: {
    padding: '20px 30px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    backgroundColor: WhatsAppColors.panelBackground,
  },
  detailTitle: {
    fontSize: '24px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '8px',
  },
  detailBody: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '30px',
    backgroundColor: WhatsAppColors.background,
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
    marginBottom: '8px',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  label: {
    fontSize: '14px',
    color: WhatsAppColors.textSecondary,
    marginBottom: '8px',
    fontWeight: '500' as const,
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
    marginBottom: '16px',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
    marginBottom: '16px',
    resize: 'vertical' as const,
    minHeight: '120px',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  previewBox: {
    padding: '12px',
    backgroundColor: WhatsAppColors.messageSent,
    borderRadius: '8px',
    fontSize: '14px',
    color: WhatsAppColors.textPrimary,
    whiteSpace: 'pre-wrap' as const,
    marginBottom: '16px',
    border: `1px solid ${WhatsAppColors.border}`,
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
    flexWrap: 'wrap' as const,
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  primaryButton: {
    backgroundColor: WhatsAppColors.accent,
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: WhatsAppColors.inputBackground,
    color: WhatsAppColors.textPrimary,
  },
  dangerButton: {
    backgroundColor: WhatsAppColors.error,
    color: '#fff',
  },
  infoCard: {
    padding: '12px 16px',
    backgroundColor: WhatsAppColors.panelBackground,
    borderRadius: '8px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  variableChip: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: 'rgba(0, 168, 132, 0.15)',
    color: WhatsAppColors.accent,
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600' as const,
    marginRight: '8px',
    marginBottom: '8px',
  },
  // 弹窗样式
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: WhatsAppColors.panelBackground,
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '20px',
  },
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'usage'>('recent');
  
  // 编辑状态
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: '',
    description: '',
    variables: [] as string[],
    tags: [] as string[],
  });
  
  // 预览状态
  const [previewText, setPreviewText] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  
  // 弹窗状态
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 开始加载模版数据...');
      
      const [templatesData, categoriesData] = await Promise.all([
        api.getTemplates(),
        api.getTemplateCategories()
      ]);
      
      console.log('✅ 模版数据加载成功:', {
        模版数量: Array.isArray(templatesData) ? templatesData.length : 0,
        分类数量: Array.isArray(categoriesData) ? categoriesData.length : 0,
        模版数据: templatesData,
        分类数据: categoriesData
      });
      
      // apiFetch 已经返回 payload.data，不需要再访问 .data 属性
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('❌ 加载数据失败:', error);
      setTemplates([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // 提取模版中的变量
  const extractVariables = (content: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  };

  // 渲染模版预览
  const renderPreview = (content: string, vars: Record<string, string>): string => {
    let result = content;
    Object.entries(vars).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`);
    });
    return result;
  };

  // 更新预览
  useEffect(() => {
    if (editMode) {
      const variables = extractVariables(formData.content);
      setFormData(prev => ({ ...prev, variables }));
      setPreviewText(renderPreview(formData.content, variableValues));
    }
  }, [formData.content, variableValues, editMode]);

  // 筛选和排序
  const filteredTemplates = templates
    .filter(template => {
      // 搜索过滤
      const matchSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 分类过滤
      const matchCategory = categoryFilter === 'all' || 
        template.category === categoryFilter;
      
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'usage') {
        return (b.usageCount || 0) - (a.usageCount || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleAddNew = () => {
    setFormData({
      name: '新模板',
      content: '',
      category: categories[0]?.name || '',
      description: '',
      variables: [],
      tags: [],
    });
    setVariableValues({});
    setSelectedTemplate(null);
    setEditMode(true);
  };

  const handleEdit = () => {
    if (!selectedTemplate) return;
    setFormData({
      name: selectedTemplate.name,
      content: selectedTemplate.content,
      category: selectedTemplate.category || '',
      description: selectedTemplate.description || '',
      variables: selectedTemplate.variables || [],
      tags: selectedTemplate.tags || [],
    });
    setVariableValues({});
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      alert('请填写模板名称和内容');
      return;
    }

    try {
      console.log('💾 准备保存模版:', formData);
      
      let result;
      if (selectedTemplate && selectedTemplate.id) {
        // 更新现有模板
        console.log('📝 更新模版 ID:', selectedTemplate.id);
        result = await api.updateTemplate(selectedTemplate.id, formData);
        console.log('✅ 模版更新成功:', result);
        alert('模板已更新！');
      } else {
        // 创建新模板
        console.log('➕ 创建新模版');
        result = await api.createTemplate(formData);
        console.log('✅ 模版创建成功:', result);
        alert('模板已创建！');
      }
      
      console.log('🔄 重新加载数据...');
      await loadData();
      setEditMode(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('❌ 保存失败:', error);
      alert('保存失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    if (!confirm(`确定要删除模板"${selectedTemplate.name}"吗？`)) return;

    try {
      await api.deleteTemplate(selectedTemplate.id);
      await loadData();
      setSelectedTemplate(null);
      alert('删除成功！');
    } catch (error) {
      alert('删除失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleDuplicate = async () => {
    if (!selectedTemplate) return;

    try {
      await api.duplicateTemplate(selectedTemplate.id, `${selectedTemplate.name} (副本)`);
      await loadData();
      alert('复制成功！');
    } catch (error) {
      alert('复制失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleUse = async (template: any) => {
    try {
      await api.useTemplate(template.id);
      await loadData();
    } catch (error) {
      console.error('更新使用统计失败:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('请输入分类名称');
      return;
    }

    try {
      console.log('📁 准备创建分类:', newCategoryName);
      const result = await api.createTemplateCategory({ name: newCategoryName });
      console.log('✅ 分类创建成功:', result);
      
      console.log('🔄 重新加载数据...');
      await loadData();
      setShowNewCategoryModal(false);
      setNewCategoryName('');
      alert('分类已添加！');
    } catch (error) {
      console.error('❌ 添加分类失败:', error);
      alert('添加失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 统计数据
  const stats = {
    total: templates.length,
    byCategory: categories.map(cat => ({
      name: cat.name,
      count: templates.filter(t => t.category === cat.name).length
    }))
  };

  // 列表面板
  const listPanel = (
    <>
      <div style={styles.listHeader}>
        <div style={styles.headerTop}>
          <div style={styles.headerTitle}>消息模板</div>
          <div style={styles.headerActions}>
            <button
              style={styles.addButton}
              onClick={handleAddNew}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = WhatsAppColors.accent}
            >
              ➕ 新建
            </button>
          </div>
        </div>

        <div style={styles.toolbarRow}>
          <select
            style={styles.select}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'usage')}
          >
            <option value="recent">最新创建</option>
            <option value="usage">最常使用</option>
          </select>

          <select
            style={styles.select}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">全部分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <button
            style={{...styles.select, cursor: 'pointer'}}
            onClick={() => setShowNewCategoryModal(true)}
            title="添加新分类"
          >
            ➕
          </button>
        </div>

        <div style={styles.statsRow}>
          <span>总计: {stats.total}</span>
          {categoryFilter === 'all' && stats.byCategory.map(cat => cat.count > 0 && (
            <span key={cat.name}>• {cat.name}: {cat.count}</span>
          ))}
        </div>
      </div>

      <div style={styles.searchBar}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: WhatsAppColors.textSecondary }}>🔍</span>
          <input
            type="text"
            placeholder="搜索模板名称或内容"
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.templateList}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: WhatsAppColors.textSecondary }}>
            加载中...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: WhatsAppColors.textSecondary }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <div style={{ fontSize: '16px', marginBottom: '8px', color: WhatsAppColors.textPrimary }}>
              {searchQuery ? '未找到匹配的模板' : '暂无模板'}
            </div>
            <div style={{ fontSize: '14px' }}>
              {!searchQuery && '点击右上角"新建"按钮创建第一个模板'}
            </div>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              style={styles.templateItem}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = WhatsAppColors.hover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => {
                setSelectedTemplate(template);
                setEditMode(false);
                handleUse(template);
              }}
            >
              <div style={styles.templateName}>
                {template.name}
                {template.category && (
                  <span style={{...styles.badge, ...styles.categoryBadge}}>
                    {template.category}
                  </span>
                )}
              </div>
              <div style={styles.templateMeta}>
                {template.usageCount > 0 && (
                  <span style={styles.usageBadge}>
                    使用 {template.usageCount} 次
                  </span>
                )}
                {template.variables && template.variables.length > 0 && (
                  <span> • {template.variables.length} 个变量</span>
                )}
              </div>
              <div style={styles.templateContent}>{template.content}</div>
            </div>
          ))
        )}
      </div>
    </>
  );

  // 详情/编辑面板
  const mainContent = (selectedTemplate || editMode) ? (
    <div style={styles.detailPanel}>
      <div style={styles.detailHeader}>
        <div style={styles.detailTitle}>
          {editMode ? (selectedTemplate?.id ? '编辑模板' : '新建模板') : selectedTemplate?.name}
        </div>
      </div>

      <div style={styles.detailBody}>
        {/* 基本信息 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>基本信息</div>
          
          <label style={styles.label}>模板名称 *</label>
          <input
            type="text"
            value={editMode ? formData.name : selectedTemplate?.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={styles.input}
            disabled={!editMode}
            placeholder="例如：欢迎消息"
          />

          <label style={styles.label}>分类</label>
          <select
            value={editMode ? formData.category : selectedTemplate?.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            style={styles.input}
            disabled={!editMode}
          >
            <option value="">未分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <label style={styles.label}>描述</label>
          <input
            type="text"
            value={editMode ? formData.description : selectedTemplate?.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            style={styles.input}
            disabled={!editMode}
            placeholder="简要描述此模板的用途"
          />
        </div>

        {/* 模板内容 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>模板内容</div>
          
          <label style={styles.label}>
            内容 * 
            <span style={{fontWeight: 'normal', marginLeft: '8px'}}>
              (使用 {`{{变量名}}`} 插入变量)
            </span>
          </label>
          <textarea
            value={editMode ? formData.content : selectedTemplate?.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            style={styles.textarea}
            disabled={!editMode}
            placeholder="例如：您好 {{name}}，欢迎使用我们的服务！"
          />

          {/* 变量说明 */}
          {(editMode ? formData.variables : selectedTemplate?.variables)?.length > 0 && (
            <>
              <label style={styles.label}>检测到的变量</label>
              <div style={{marginBottom: '16px'}}>
                {(editMode ? formData.variables : selectedTemplate?.variables).map((variable: string) => (
                  <span key={variable} style={styles.variableChip}>
                    {`{{${variable}}}`}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* 实时预览 */}
          {editMode && formData.variables.length > 0 && (
            <>
              <label style={styles.label}>预览（填入变量值查看效果）</label>
              {formData.variables.map((variable) => (
                <div key={variable} style={{marginBottom: '8px'}}>
                  <input
                    type="text"
                    placeholder={`${variable} 的值`}
                    value={variableValues[variable] || ''}
                    onChange={(e) => setVariableValues({
                      ...variableValues,
                      [variable]: e.target.value
                    })}
                    style={{...styles.input, marginBottom: '8px'}}
                  />
                </div>
              ))}
              <div style={styles.previewBox}>
                {previewText || '填写变量值以预览效果'}
              </div>
            </>
          )}
        </div>

        {/* 统计信息 */}
        {!editMode && selectedTemplate && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>统计信息</div>
            
            <div style={styles.infoCard}>
              <span style={{color: WhatsAppColors.textSecondary}}>使用次数</span>
              <span style={{color: WhatsAppColors.textPrimary, fontWeight: 600}}>
                {selectedTemplate.usageCount || 0} 次
              </span>
            </div>

            {selectedTemplate.lastUsedAt && (
              <div style={styles.infoCard}>
                <span style={{color: WhatsAppColors.textSecondary}}>最后使用</span>
                <span style={{color: WhatsAppColors.textPrimary}}>
                  {new Date(selectedTemplate.lastUsedAt).toLocaleString('zh-CN')}
                </span>
              </div>
            )}

            <div style={styles.infoCard}>
              <span style={{color: WhatsAppColors.textSecondary}}>创建时间</span>
              <span style={{color: WhatsAppColors.textPrimary}}>
                {new Date(selectedTemplate.createdAt).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={styles.buttonGroup}>
          {editMode ? (
            <>
              <button
                style={{...styles.button, ...styles.primaryButton}}
                onClick={handleSave}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                💾 保存
              </button>
              <button
                style={{...styles.button, ...styles.secondaryButton}}
                onClick={() => {
                  setEditMode(false);
                  if (!selectedTemplate) setSelectedTemplate(null);
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                取消
              </button>
            </>
          ) : (
            <>
              <button
                style={{...styles.button, ...styles.primaryButton}}
                onClick={handleEdit}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                ✏️ 编辑
              </button>
              <button
                style={{...styles.button, ...styles.secondaryButton}}
                onClick={handleDuplicate}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                📄 复制
              </button>
              <button
                style={{...styles.button, ...styles.dangerButton}}
                onClick={handleDelete}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                🗑️ 删除
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%',
      flexDirection: 'column',
      color: WhatsAppColors.textSecondary,
      gap: '16px'
    }}>
      <div style={{ fontSize: '64px' }}>📝</div>
      <div style={{ fontSize: '18px' }}>选择一个模板查看详情</div>
      <button
        style={{...styles.button, ...styles.primaryButton, marginTop: '16px'}}
        onClick={handleAddNew}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
      >
        ➕ 创建新模板
      </button>
    </div>
  );

  return (
    <>
      <WhatsAppLayout
        sidebar={<Sidebar />}
        listPanel={listPanel}
        mainContent={mainContent}
      />

      {/* 添加分类弹窗 */}
      {showNewCategoryModal && (
        <div style={styles.modalOverlay} onClick={() => setShowNewCategoryModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>添加新分类</div>
            
            <label style={styles.label}>分类名称</label>
            <input
              type="text"
              style={styles.input}
              placeholder="例如：促销活动"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              autoFocus
            />

            <div style={styles.buttonGroup}>
              <button
                style={{...styles.button, ...styles.secondaryButton}}
                onClick={() => {
                  setShowNewCategoryModal(false);
                  setNewCategoryName('');
                }}
              >
                取消
              </button>
              <button
                style={{...styles.button, ...styles.primaryButton}}
                onClick={handleAddCategory}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = WhatsAppColors.accent}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
