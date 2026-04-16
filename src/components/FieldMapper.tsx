import { useState } from 'react';
import type { ExcelData } from '../utils/excelParser';
import type { FieldMapping } from '../utils/fieldMatcher';
import type { IField } from '@lark-base-open/js-sdk';
import { getFieldTypeName } from '../utils/fieldMatcher';

interface FieldMapperProps {
  excelData: ExcelData;
  fieldMappings: FieldMapping[];
  bitableFields: IField[];
  matchRate: number;
  strategy: 'incremental' | 'full';
  onStrategyChange: (strategy: 'incremental' | 'full') => void;
  onMappingChange: (mappings: FieldMapping[]) => void;
}

function FieldMapper({
  excelData,
  fieldMappings,
  bitableFields,
  matchRate,
  strategy,
  onStrategyChange,
  onMappingChange
}: FieldMapperProps) {
  const [showPreview, setShowPreview] = useState(false);

  // 处理字段映射变更
  const handleFieldChange = (excelColumn: string, newFieldId: string) => {
    const newMappings = fieldMappings.map(m => {
      if (m.excelColumn === excelColumn) {
        const field = bitableFields.find(f => f.id === newFieldId);
        return {
          ...m,
          bitableFieldId: newFieldId,
          bitableFieldName: field?.name || '',
          matched: newFieldId !== '',
          fieldType: getFieldTypeName(field?.type || 1)
        };
      }
      return m;
    });
    onMappingChange(newMappings);
  };

  // 获取匹配字段数量
  const matchedCount = fieldMappings.filter(m => m.matched).length;
  const unmatchedCount = fieldMappings.filter(m => !m.matched).length;

  return (
    <div>
      {/* 文件信息 */}
      <div className="file-info">
        <div className="file-name">
          <span>📄</span>
          <span>{excelData.fileName}</span>
        </div>
        <div className="file-stats">
          共 {fieldMappings.length} 个字段，{excelData.rows.length} 条数据
          {matchRate > 0 && (
            <span style={{ marginLeft: '8px', color: '#389e0d' }}>
              智能匹配率: {matchRate}%
            </span>
          )}
        </div>
      </div>

      {/* 字段映射 */}
      <div className="section-card">
        <div className="section-header">
          字段映射 ({matchedCount} 已匹配 {unmatchedCount > 0 ? `/ ${unmatchedCount} 未匹配` : ''})
        </div>
        <div className="section-content">
          {fieldMappings.map(mapping => (
            <div key={mapping.excelColumn} className="field-mapping-item">
              <span style={{ 
                color: '#1f2329', 
                fontWeight: 500,
                minWidth: '80px'
              }}>
                {mapping.excelColumn}
              </span>
              
              <span className="mapping-arrow">→</span>
              
              <select
                className="mapping-select"
                value={mapping.bitableFieldId}
                onChange={(e) => handleFieldChange(mapping.excelColumn, e.target.value)}
              >
                <option value="">-- 选择字段 --</option>
                {bitableFields.map(field => (
                  <option key={field.id} value={field.id}>
                    {field.name} [{getFieldTypeName(field.type)}]
                  </option>
                ))}
              </select>
              
              {mapping.matched ? (
                <span className="matched-badge">✓</span>
              ) : (
                <span className="unmatched-badge">未匹配</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 同步策略 */}
      <div className="section-card">
        <div className="section-header">同步策略</div>
        <div className="section-content">
          <div className="strategy-options">
            <label className="strategy-option recommended">
              <input
                type="radio"
                name="strategy"
                value="incremental"
                checked={strategy === 'incremental'}
                onChange={() => onStrategyChange('incremental')}
              />
              <div>
                <div style={{ fontWeight: 500 }}>增量追加（推荐）</div>
                <div style={{ fontSize: '12px', color: '#8f9399' }}>
                  将Excel数据追加到多维表格现有数据之后
                </div>
              </div>
            </label>
            
            <label className="strategy-option">
              <input
                type="radio"
                name="strategy"
                value="full"
                checked={strategy === 'full'}
                onChange={() => onStrategyChange('full')}
              />
              <div>
                <div style={{ fontWeight: 500 }}>全量覆盖</div>
                <div style={{ fontSize: '12px', color: '#8f9399' }}>
                  清空多维表格现有数据，用Excel数据替换
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* 数据预览 */}
      <div className="section-card">
        <div 
          className="section-header" 
          style={{ cursor: 'pointer' }}
          onClick={() => setShowPreview(!showPreview)}
        >
          数据预览 {showPreview ? '▼' : '▶'} ({Math.min(excelData.rows.length, 5)} 条)
        </div>
        {showPreview && (
          <div className="section-content">
            <div className="preview-table">
              <table>
                <thead>
                  <tr>
                    {fieldMappings.map(m => (
                      <th key={m.excelColumn}>
                        {m.excelColumn}
                        {m.matched && <span style={{ color: '#389e0d' }}> → {m.bitableFieldName}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {excelData.rows.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      {fieldMappings.map(m => (
                        <td key={m.excelColumn} title={String(row[m.excelColumn] || '')}>
                          {String(row[m.excelColumn] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {excelData.rows.length > 5 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '8px', 
                color: '#8f9399',
                fontSize: '12px'
              }}>
                ... 还有 {excelData.rows.length - 5} 条数据
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FieldMapper;
