'use client';

import { useState, useRef } from 'react';
import { WhatsAppColors } from './layout/WhatsAppLayout';

interface CSVData {
  headers: string[];
  rows: string[][];
}

interface CSVUploaderProps {
  onDataParsed: (data: CSVData) => void;
  expectedHeaders?: string[];
}

const styles = {
  container: {
    border: `2px dashed ${WhatsAppColors.border}`,
    borderRadius: '8px',
    padding: '32px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'border-color 0.2s, background-color 0.2s',
  },
  containerActive: {
    borderColor: WhatsAppColors.accent,
    backgroundColor: 'rgba(0, 168, 132, 0.05)',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: WhatsAppColors.textSecondary,
    marginBottom: '16px',
  },
  browseButton: {
    padding: '10px 24px',
    backgroundColor: WhatsAppColors.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  },
  previewContainer: {
    marginTop: '24px',
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    overflow: 'hidden',
  },
  previewHeader: {
    padding: '12px 16px',
    backgroundColor: WhatsAppColors.panelBackground,
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: '14px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
  },
  clearButton: {
    fontSize: '13px',
    color: WhatsAppColors.error,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
  },
  th: {
    padding: '10px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    color: WhatsAppColors.textSecondary,
    fontWeight: '600' as const,
    textAlign: 'left' as const,
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  td: {
    padding: '10px 12px',
    color: WhatsAppColors.textPrimary,
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  errorBox: {
    marginTop: '16px',
    padding: '12px 16px',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    border: `1px solid ${WhatsAppColors.error}`,
    borderRadius: '8px',
    color: WhatsAppColors.error,
    fontSize: '13px',
  },
  downloadLink: {
    color: WhatsAppColors.accent,
    textDecoration: 'none',
    fontSize: '13px',
    cursor: 'pointer',
  },
};

export default function CSVUploader({ onDataParsed, expectedHeaders }: CSVUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): CSVData => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV 文件为空');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim())
    );

    return { headers, rows };
  };

  const handleFile = (file: File) => {
    setError(null);
    setFileName(file.name);

    if (!file.name.endsWith('.csv')) {
      setError('请上传 CSV 格式文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);

        // 验证表头
        if (expectedHeaders && expectedHeaders.length > 0) {
          const missingHeaders = expectedHeaders.filter(
            h => !data.headers.includes(h)
          );
          if (missingHeaders.length > 0) {
            setError(`缺少必需的列: ${missingHeaders.join(', ')}`);
            return;
          }
        }

        setCsvData(data);
        onDataParsed(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '解析 CSV 文件失败');
      }
    };
    reader.onerror = () => {
      setError('读取文件失败');
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setCsvData(null);
    setError(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const headers = expectedHeaders || ['phone', 'name', 'tags', 'notes'];
    const exampleRow = ['+8613800138000', '张三', '客户,VIP', '重要客户'];
    const csv = [headers.join(','), exampleRow.join(',')].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template.csv';
    link.click();
  };

  return (
    <div>
      <div
        style={{
          ...styles.container,
          ...(dragActive ? styles.containerActive : {}),
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={styles.icon}>📁</div>
        <div style={styles.title}>
          {csvData ? `已选择: ${fileName}` : '拖拽文件到此处或点击上传'}
        </div>
        <div style={styles.subtitle}>
          支持 CSV 格式文件 • 
          <a style={styles.downloadLink} onClick={(e) => {
            e.stopPropagation();
            downloadTemplate();
          }}>
            下载模板
          </a>
        </div>
        <button
          style={styles.browseButton}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          选择文件
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
      </div>

      {error && (
        <div style={styles.errorBox}>
          ⚠️ {error}
        </div>
      )}

      {csvData && (
        <div style={styles.previewContainer}>
          <div style={styles.previewHeader}>
            <span style={styles.previewTitle}>
              数据预览 ({csvData.rows.length} 行)
            </span>
            <a style={styles.clearButton} onClick={handleClear}>
              清除
            </a>
          </div>
          <div style={{ overflowX: 'auto' as const, maxHeight: '300px', overflowY: 'auto' as const }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {csvData.headers.map((header, index) => (
                    <th key={index} style={styles.th}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.rows.slice(0, 10).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} style={styles.td}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.rows.length > 10 && (
              <div style={{ 
                padding: '12px', 
                textAlign: 'center', 
                color: WhatsAppColors.textSecondary,
                fontSize: '13px',
                backgroundColor: WhatsAppColors.inputBackground
              }}>
                仅显示前 10 行，共 {csvData.rows.length} 行
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

