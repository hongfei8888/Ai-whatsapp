'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { BatchImportConfig } from '@/lib/types';

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
  },
  textarea: {
    width: '100%',
    minHeight: '200px',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    background: '#FFFFFF',
    resize: 'vertical' as const,
    fontFamily: 'monospace',
  },
  fileUpload: {
    border: '2px dashed #D1D5DB',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    background: '#F9FAFB',
  },
  fileUploadHover: {
    borderColor: '#4F46E5',
    background: '#EEF2FF',
  },
  fileUploadIcon: {
    fontSize: '48px',
    color: '#9CA3AF',
    marginBottom: '16px',
  },
  fileUploadText: {
    fontSize: '16px',
    color: '#374151',
    marginBottom: '8px',
  },
  fileUploadSubtext: {
    fontSize: '14px',
    color: '#6B7280',
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
    marginBottom: '12px',
  },
  previewTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '12px',
  },
  previewHeader: {
    background: '#F3F4F6',
    fontWeight: 500,
    color: '#374151',
  },
  previewCell: {
    padding: '8px 12px',
    border: '1px solid #E5E7EB',
    textAlign: 'left' as const,
  },
  previewRow: {
    '&:nth-child(even)': {
      background: '#F9FAFB',
    },
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
  success: {
    color: '#059669',
    fontSize: '12px',
    marginTop: '4px',
  },
  checkbox: {
    marginRight: '8px',
  },
  checkboxLabel: {
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
};

interface ContactData {
  phoneE164: string;
  name?: string;
  tags?: string[];
  notes?: string;
}

export default function BatchImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  const [importData, setImportData] = useState<BatchImportConfig>({
    contacts: [],
    tags: [],
    source: '',
    skipDuplicates: true,
  });

  const [tagInput, setTagInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const parseCSV = (csvText: string): ContactData[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const contacts: ContactData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length >= 1 && values[0]) {
        const contact: ContactData = {
          phoneE164: values[0],
        };
        
        if (headers.includes('name') && values[1]) {
          contact.name = values[1];
        }
        
        if (headers.includes('notes') && values[2]) {
          contact.notes = values[2];
        }
        
        contacts.push(contact);
      }
    }
    
    return contacts;
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const contacts = parseCSV(csvText);
        
        if (contacts.length === 0) {
          setError('CSV文件中没有找到有效的联系人数据');
          return;
        }
        
        setImportData(prev => ({
          ...prev,
          contacts,
        }));
        
        setError('');
        setSuccess(`成功解析 ${contacts.length} 个联系人`);
      } catch (error) {
        setError('CSV文件解析失败，请检查文件格式');
        console.error('CSV解析错误:', error);
      }
    };
    
    reader.readAsText(file, 'UTF-8');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      handleFileUpload(file);
    } else {
      setError('请上传CSV格式的文件');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.trim()) {
      try {
        const contacts = parseCSV(text);
        setImportData(prev => ({
          ...prev,
          contacts,
        }));
        setError('');
        setSuccess(`成功解析 ${contacts.length} 个联系人`);
      } catch (error) {
        setError('CSV格式错误，请检查输入内容');
      }
    } else {
      setImportData(prev => ({
        ...prev,
        contacts: [],
      }));
      setError('');
      setSuccess('');
    }
  };

  const handleInputChange = (field: keyof BatchImportConfig, value: any) => {
    setImportData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !importData.tags?.includes(tagInput.trim())) {
      setImportData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setImportData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (importData.contacts.length === 0) {
      setError('请先上传或输入联系人数据');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const batch = await api.batch.importContacts(importData);
      
      setSuccess(`批量导入已开始，操作ID: ${batch.id}`);
      
      // 延迟跳转到批量操作列表页面
      setTimeout(() => {
        router.push('/batch');
      }, 2000);
      
    } catch (error) {
      console.error('批量导入失败:', error);
      setError(error instanceof Error ? error.message : '批量导入失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.container}>
      <div style={S.header}>
        <h1 style={S.title}>批量导入联系人</h1>
        <a href="/batch" style={S.backButton}>
          ← 返回批量操作
        </a>
      </div>

      <form style={S.form} onSubmit={handleSubmit}>
        <div style={S.formGroup}>
          <label style={S.label}>上传CSV文件</label>
          <div
            style={{
              ...S.fileUpload,
              ...(isDragOver ? S.fileUploadHover : {}),
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={S.fileUploadIcon}>📁</div>
            <div style={S.fileUploadText}>点击上传或拖拽CSV文件到此处</div>
            <div style={S.fileUploadSubtext}>
              支持格式：phone,name,notes（电话号码为必填项）
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>或手动输入CSV数据</label>
          <textarea
            style={S.textarea}
            placeholder={`phone,name,notes
+8613800138000,张三,重要客户
+8613800138001,李四,潜在客户
+8613800138002,王五,普通客户`}
            onChange={handleManualInput}
          />
          <div style={S.helpText}>
            CSV格式：第一行为标题行（phone,name,notes），后续行为数据行
          </div>
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>导入来源</label>
          <input
            type="text"
            style={S.input}
            value={importData.source || ''}
            onChange={(e) => handleInputChange('source', e.target.value)}
            placeholder="例如：Excel导入、客户列表等"
          />
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>默认标签</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              style={S.input}
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
          {importData.tags && importData.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {importData.tags.map(tag => (
                <div key={tag} style={{
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4F46E5',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '0',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={S.formGroup}>
          <label style={S.checkboxLabel}>
            <input
              type="checkbox"
              style={S.checkbox}
              checked={importData.skipDuplicates}
              onChange={(e) => handleInputChange('skipDuplicates', e.target.checked)}
            />
            跳过重复联系人（推荐）
          </label>
          <div style={S.helpText}>
            如果联系人已存在，将更新其信息而不是创建新记录
          </div>
        </div>

        {importData.contacts.length > 0 && (
          <div style={S.preview}>
            <div style={S.previewTitle}>
              预览数据 ({importData.contacts.length} 个联系人)
            </div>
            <table style={S.previewTable}>
              <thead>
                <tr style={S.previewHeader}>
                  <th style={S.previewCell}>电话号码</th>
                  <th style={S.previewCell}>姓名</th>
                  <th style={S.previewCell}>备注</th>
                </tr>
              </thead>
              <tbody>
                {importData.contacts.slice(0, 10).map((contact, index) => (
                  <tr key={index} style={S.previewRow}>
                    <td style={S.previewCell}>{contact.phoneE164}</td>
                    <td style={S.previewCell}>{contact.name || '-'}</td>
                    <td style={S.previewCell}>{contact.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {importData.contacts.length > 10 && (
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                还有 {importData.contacts.length - 10} 个联系人...
              </div>
            )}
          </div>
        )}

        {error && <div style={S.error}>{error}</div>}
        {success && <div style={S.success}>{success}</div>}

        <div style={S.actions}>
          <button
            type="button"
            style={S.buttonSecondary}
            onClick={() => router.push('/batch')}
          >
            取消
          </button>
          <button
            type="submit"
            style={S.buttonPrimary}
            disabled={loading || importData.contacts.length === 0}
          >
            {loading ? '导入中...' : `开始导入 ${importData.contacts.length} 个联系人`}
          </button>
        </div>
      </form>
    </div>
  );
}
