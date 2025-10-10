'use client';

import { useState, useEffect } from 'react';
import { WhatsAppColors } from './layout/WhatsAppLayout';
import { api } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  content: string;
  category?: string;
  variables?: string[];
  usageCount?: number;
}

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
  selectedTemplateId?: string | null;
  onClose?: () => void;
}

const styles = {
  container: {
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    backgroundColor: WhatsAppColors.panelBackground,
    maxHeight: '400px',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  searchBar: {
    padding: '12px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '6px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
  },
  templateList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '8px',
  },
  templateItem: {
    padding: '12px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '8px',
    transition: 'background-color 0.2s',
    border: `1px solid ${WhatsAppColors.border}`,
  },
  templateItemSelected: {
    backgroundColor: 'rgba(0, 168, 132, 0.1)',
    borderColor: WhatsAppColors.accent,
  },
  templateName: {
    fontSize: '14px',
    color: WhatsAppColors.textPrimary,
    fontWeight: '600' as const,
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  templateCategory: {
    fontSize: '11px',
    padding: '2px 6px',
    backgroundColor: 'rgba(0, 168, 132, 0.15)',
    color: WhatsAppColors.accent,
    borderRadius: '8px',
  },
  templateContent: {
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    marginBottom: '6px',
  },
  templateMeta: {
    fontSize: '12px',
    color: WhatsAppColors.textSecondary,
  },
  variableChip: {
    display: 'inline-block',
    padding: '2px 6px',
    backgroundColor: WhatsAppColors.inputBackground,
    borderRadius: '8px',
    fontSize: '11px',
    marginRight: '4px',
  },
};

export default function TemplateSelector({ onSelect, selectedTemplateId, onClose }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templatesData = await api.getTemplates();
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (error) {
      console.error('加载模版失败:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.content.toLowerCase().includes(query)
    );
  });

  return (
    <div style={styles.container}>
      <div style={{...styles.searchBar, display: 'flex', gap: '8px', alignItems: 'center'}}>
        <input
          type="text"
          placeholder="搜索模版..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{...styles.searchInput, flex: 1}}
        />
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '8px 12px',
              backgroundColor: WhatsAppColors.inputBackground,
              border: `1px solid ${WhatsAppColors.border}`,
              borderRadius: '6px',
              color: WhatsAppColors.textSecondary,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      <div style={styles.templateList}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: WhatsAppColors.textSecondary }}>
            加载中...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: WhatsAppColors.textSecondary }}>
            {searchQuery ? '未找到匹配的模版' : '暂无模版，请先创建模版'}
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              style={{
                ...styles.templateItem,
                ...(selectedTemplateId === template.id ? styles.templateItemSelected : {}),
              }}
              onClick={() => onSelect(template)}
              onMouseEnter={(e) => {
                if (selectedTemplateId !== template.id) {
                  e.currentTarget.style.backgroundColor = WhatsAppColors.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTemplateId !== template.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={styles.templateName}>
                {template.name}
                {template.category && (
                  <span style={styles.templateCategory}>
                    {template.category}
                  </span>
                )}
              </div>
              <div style={styles.templateContent}>
                {template.content}
              </div>
              <div style={styles.templateMeta}>
                {template.variables && template.variables.length > 0 && (
                  <span>
                    变量: {template.variables.map(v => (
                      <span key={v} style={styles.variableChip}>{`{{${v}}}`}</span>
                    ))}
                  </span>
                )}
                {template.usageCount !== undefined && template.usageCount > 0 && (
                  <span> • 使用 {template.usageCount} 次</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

