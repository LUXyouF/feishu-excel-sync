import type { ExcelData } from '../utils/excelParser';
import type { FieldMapping } from '../utils/fieldMatcher';

interface SyncResultProps {
  excelData: ExcelData;
  fieldMappings: FieldMapping[];
  onReset: () => void;
  isLocalMode?: boolean;
}

function SyncResult({ excelData, fieldMappings, onReset, isLocalMode = false }: SyncResultProps) {
  const matchedMappings = fieldMappings.filter(m => m.matched);

  // 导出为JSON文件
  const handleExportJSON = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      fileName: excelData.fileName,
      totalRows: excelData.rows.length,
      fields: matchedMappings.map(m => ({
        excelColumn: m.excelColumn,
        bitableFieldName: m.bitableFieldName || m.excelColumn
      })),
      data: excelData.rows.map(row => {
        const newRow: Record<string, unknown> = {};
        matchedMappings.forEach(m => {
          newRow[m.excelColumn] = row[m.excelColumn];
        });
        return newRow;
      })
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导出为CSV文件（便于导入到飞书）
  const handleExportCSV = () => {
    const headers = matchedMappings.map(m => m.excelColumn);
    const csvRows = [headers.join(',')];
    
    excelData.rows.forEach(row => {
      const values = matchedMappings.map(m => {
        const val = row[m.excelColumn];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') ? `"${str}"` : str;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="sync-result">
        <div className="result-icon">{isLocalMode ? '📋' : '✅'}</div>
        <div className="result-title">
          {isLocalMode ? '数据已准备就绪！' : '同步完成！'}
        </div>
        <div className="result-stats">
          <p>文件包含 <span className="success">{excelData.rows.length}</span> 条记录</p>
          <p>涉及 <span className="success">{matchedMappings.length}</span> 个字段</p>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">数据预览</div>
        <div className="section-content">
          <div style={{ fontSize: '13px', color: '#646a73', maxHeight: '200px', overflow: 'auto' }}>
            <p style={{ marginBottom: '8px' }}>
              <strong>文件：</strong>{excelData.fileName}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>数据量：</strong>{excelData.rows.length} 条
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>字段映射：</strong>
            </p>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              {matchedMappings.map(m => (
                <li key={m.excelColumn}>
                  {m.excelColumn} → {m.bitableFieldName || m.excelColumn}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {isLocalMode ? (
        <>
          <div className="section-card" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
            <div className="section-header" style={{ color: '#52c41a' }}>
              💡 导出数据以便后续导入
            </div>
            <div className="section-content">
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                由于当前处于本地测试模式，无法直接写入飞书多维表格。
                请导出数据后手动导入。
              </p>
              <div className="btn-group" style={{ flexDirection: 'column', gap: '8px' }}>
                <button className="btn btn-primary" onClick={handleExportCSV}>
                  📥 导出CSV（推荐，可直接导入Excel）
                </button>
                <button className="btn btn-secondary" onClick={handleExportJSON}>
                  📄 导出JSON
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          color: '#8f9399', 
          fontSize: '12px',
          marginBottom: '12px'
        }}>
          💡 提示：同步结果已直接写入多维表格，请刷新页面查看最新数据
        </div>
      )}

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={onReset}>
          继续同步
        </button>
      </div>
    </div>
  );
}

export default SyncResult;
