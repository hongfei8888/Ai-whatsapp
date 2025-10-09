'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { TemplateCategory, TemplateCreatePayload } from '@/lib/types';

const S = {
  container: {
    maxWidth: 800,
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
  backButton: {
    background: '#F3F4F6',
    color: '#374151',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  form: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    background: '#FFFFFF',
    transition: 'border-color 0.2s',
  },
  inputFocus: {
    borderColor: '#4F46E5',
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)',
  },
  textarea: {
    width: '100%',
    minHeight: '120px',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    background: '#FFFFFF',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    background: '#FFFFFF',
  },
  tagInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    background: '#FFFFFF',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginTop: '8px',
  },
  tag: {
    background: '#EEF2FF',
    color: '#4F46E5',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  tagRemove: {
    background: 'none',
    border: 'none',
    color: '#4F46E5',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '0',
  },
  variableInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    background: '#FFFFFF',
    fontFamily: 'monospace',
  },
  variables: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginTop: '8px',
  },
  variable: {
    background: '#F3F4F6',
    color: '#374151',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'monospace',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  preview: {
    background: '#F8FAFC',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '20px',
  },
  previewTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '8px',
  },
  previewContent: {
    fontSize: '14px',
    color: '#6B7280',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap' as const,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #E5E7EB',
  },
  button: {
    padding: '10px 20px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonPrimary: {
    background: '#4F46E5',
    color: '#FFFFFF',
    borderColor: '#4F46E5',
  },
  buttonSecondary: {
    background: '#FFFFFF',
    color: '#374151',
    borderColor: '#D1D5DB',
  },
  buttonPrimaryHover: {
    background: '#3730A3',
    borderColor: '#3730A3',
  },
  buttonSecondaryHover: {
    background: '#F9FAFB',
  },
  helpText: {
    fontSize: '12px',
    color: '#6B7280',
    marginTop: '4px',
  },
  error: {
    color: '#DC2626',
    fontSize: '12px',
    marginTop: '4px',
  },
};

export default function CreateTemplatePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [formData, setFormData] = useState<TemplateCreatePayload>({
    name: '',
    content: '',
    description: '',
    category: '',
    tags: [],
    variables: [],
    sortOrder: 0,
  });

  const [tagInput, setTagInput] = useState('');
  const [variableInput, setVariableInput] = useState('');
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    updatePreview();
  }, [formData.content]);

  const loadCategories = async () => {
    try {
      const categoriesData = await api.categories.list();
      setCategories(categoriesData);
      if (categoriesData.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: categoriesData[0].name }));
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const updatePreview = () => {
    let preview = formData.content;
    
    // 替换变量为示例值
    if (formData.variables) {
      formData.variables.forEach(variable => {
        const exampleValue = getExampleValue(variable);
        const regex = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g');
        preview = preview.replace(regex, exampleValue);
      });
    }
    
    // 替换默认变量
    const now = new Date();
    preview = preview.replace(/\{\{\s*时间\s*\}\}/g, now.toLocaleString('zh-CN'));
    preview = preview.replace(/\{\{\s*日期\s*\}\}/g, now.toLocaleDateString('zh-CN'));
    
    setPreviewContent(preview);
  };

  const getExampleValue = (variable: string): string => {
    const examples: Record<string, string> = {
      '姓名': '张三',
      '客户': '李四',
      '产品': '我们的产品',
      '价格': '¥99',
      '时间': '2024年1月1日',
      '日期': '2024-01-01',
      '公司': '示例公司',
      '服务': '我们的服务',
    };
    return examples[variable] || `示例${variable}`;
  };

  const handleInputChange = (field: keyof TemplateCreatePayload, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleAddVariable = () => {
    if (variableInput.trim() && !formData.variables?.includes(variableInput.trim())) {
      setFormData(prev => ({
        ...prev,
        variables: [...(prev.variables || []), variableInput.trim()]
      }));
      setVariableInput('');
    }
  };

  const handleRemoveVariable = (variableToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables?.filter(variable => variable !== variableToRemove) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('请输入模板名称');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('请输入模板内容');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await api.templates.create(formData);
      
      router.push('/templates');
    } catch (error) {
      console.error('创建模板失败:', error);
      setError(error instanceof Error ? error.message : '创建模板失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.container}>
      <div style={S.header}>
        <h1 style={S.title}>创建模板</h1>
        <a href="/templates" style={S.backButton}>
          ← 返回模板列表
        </a>
      </div>

      <form style={S.form} onSubmit={handleSubmit}>
        <div style={S.formGroup}>
          <label style={S.label}>模板名称 *</label>
          <input
            type="text"
            style={S.input}
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="请输入模板名称"
            required
          />
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>模板描述</label>
          <input
            type="text"
            style={S.input}
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="请输入模板描述"
          />
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>分类 *</label>
          <select
            style={S.select}
            value={formData.category || ''}
            onChange={(e) => handleInputChange('category', e.target.value)}
            required
          >
            <option value="">请选择分类</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>模板内容 *</label>
          <textarea
            style={S.textarea}
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder="请输入模板内容，使用 {{变量名}} 来插入动态变量"
            required
          />
          <div style={S.helpText}>
            支持使用 {`{{变量名}}`} 格式插入动态变量，如：{`{{姓名}}`}、{`{{时间}}`}、{`{{日期}}`} 等
          </div>
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>标签</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              style={S.tagInput}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="输入标签后按回车添加"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddTag}
              style={{...S.button, ...S.buttonSecondary}}
            >
              添加
            </button>
          </div>
          {formData.tags && formData.tags.length > 0 && (
            <div style={S.tags}>
              {formData.tags.map(tag => (
                <div key={tag} style={S.tag}>
                  {tag}
                  <button
                    type="button"
                    style={S.tagRemove}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>自定义变量</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              style={S.variableInput}
              value={variableInput}
              onChange={(e) => setVariableInput(e.target.value)}
              placeholder="输入变量名（不含{{}}）"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddVariable();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddVariable}
              style={{...S.button, ...S.buttonSecondary}}
            >
              添加
            </button>
          </div>
          {formData.variables && formData.variables.length > 0 && (
            <div style={S.variables}>
              {formData.variables.map(variable => (
                <div key={variable} style={S.variable}>
                  {`{{${variable}}}`}
                  <button
                    type="button"
                    style={S.tagRemove}
                    onClick={() => handleRemoveVariable(variable)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={S.helpText}>
            系统会自动提取内容中的变量，您也可以手动添加自定义变量
          </div>
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>排序顺序</label>
          <input
            type="number"
            style={S.input}
            value={formData.sortOrder || 0}
            onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
            placeholder="0"
            min="0"
          />
        </div>

        {formData.content && (
          <div style={S.preview}>
            <div style={S.previewTitle}>预览效果</div>
            <div style={S.previewContent}>{previewContent}</div>
          </div>
        )}

        {error && <div style={S.error}>{error}</div>}

        <div style={S.actions}>
          <button
            type="button"
            style={S.buttonSecondary}
            onClick={() => router.push('/templates')}
          >
            取消
          </button>
          <button
            type="submit"
            style={S.buttonPrimary}
            disabled={loading}
          >
            {loading ? '创建中...' : '创建模板'}
          </button>
        </div>
      </form>
    </div>
  );
}
