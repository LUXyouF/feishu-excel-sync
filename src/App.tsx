import { useState, useEffect, useCallback } from 'react';
import FileUploader from './components/FileUploader';
import FieldMapper from './components/FieldMapper';
import SyncResult from './components/SyncResult';
import { parseExcel, isValidExcelFile, type ExcelData } from './utils/excelParser';
import { matchFields, type FieldMapping, getMatchRate } from './utils/fieldMatcher';
import { getTableFields, incrementalSync, fullSync, showToast } from './utils/bitableHelper';
import type { IField } from '@lark-base-open/js-sdk';

type SyncStrategy = 'incremental' | 'full';
type Step = 'upload' | 'mapping' | 'syncing' | 'result';

interface SyncProgress {
  current: number;
  total: number;
}

function App() {
  const [step, setStep] = useState<Step>('upload');
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [bitableFields, setBitableFields] = useState<IField[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [strategy, setStrategy] = useState<SyncStrategy>('incremental');
  const [progress, setProgress] = useState<SyncProgress>({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchRate, setMatchRate] = useState(0);
  const [isInFeishu, setIsInFeishu] = useState(false);

  // 检测是否在飞书环境中
  useEffect(() => {
    const checkFeishuEnv = async () => {
      try {
        // 尝试访问飞书 SDK
        const fields = await getTableFields();
        setBitableFields(fields);
        setIsInFeishu(true);
        setLoading(false);
      } catch (err) {
        console.error('飞书环境检测失败:', err);
        setIsInFeishu(false);
        setError('无法连接到飞书多维表格。请确保：\n1. 插件已正确添加到飞书多维表格\n2. 网络连接正常\n3. 尝试刷新页面重试');
        setLoading(false);
      }
    };
    checkFeishuEnv();
  }, []);

  // 处理文件上传
  const handleFileUpload = useCallback(async (file: File) => {
    if (!isValidExcelFile(file)) {
      setError('请上传有效的Excel文件（.xlsx 或 .xls）');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await parseExcel(file);
      setExcelData(data);
      
      // 智能匹配字段
      const mappings = matchFields(data.headers, bitableFields);
      setFieldMappings(mappings);
      setMatchRate(getMatchRate(mappings));
      
      setStep('mapping');
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析Excel文件失败');
    } finally {
      setLoading(false);
    }
  }, [bitableFields]);

  // 处理字段映射更新
  const handleMappingChange = useCallback((mappings: FieldMapping[]) => {
    setFieldMappings(mappings);
    setMatchRate(getMatchRate(mappings));
  }, []);

  // 开始同步
  const handleSync = useCallback(async () => {
    if (!excelData) return;

    setStep('syncing');
    setProgress({ current: 0, total: excelData.rows.length });
    setError(null);

    try {
      const onProgress = (current: number, total: number) => {
        setProgress({ current, total });
      };

      let result;
      if (strategy === 'incremental') {
        result = await incrementalSync(excelData.rows, fieldMappings, onProgress);
      } else {
        result = await fullSync(excelData.rows, fieldMappings, onProgress);
      }

      setProgress({ current: result.totalCount, total: result.totalCount });
      setStep('result');

      if (result.successCount > 0) {
        showToast('success', `同步完成！成功 ${result.successCount} 条`);
      }
      if (result.failedCount > 0) {
        showToast('error', `同步完成！失败 ${result.failedCount} 条`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '同步失败');
      setStep('mapping');
    }
  }, [excelData, fieldMappings, strategy]);

  // 重新开始
  const handleReset = useCallback(() => {
    setStep('upload');
    setExcelData(null);
    setFieldMappings([]);
    setProgress({ current: 0, total: 0 });
    setError(null);
  }, []);

  // 渲染步骤指示器
  const renderStepIndicator = () => {
    const steps = [
      { key: 'upload', label: '上传文件' },
      { key: 'mapping', label: '字段映射' },
      { key: 'syncing', label: '同步中' },
      { key: 'result', label: '完成' }
    ];

    const currentIndex = steps.findIndex(s => s.key === step);

    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
        {steps.map((s, index) => (
          <div
            key={s.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: index <= currentIndex ? '#4a90e2' : '#8f9399',
              fontSize: '12px'
            }}
          >
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: index <= currentIndex ? '#4a90e2' : '#e5e6eb',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px'
            }}>
              {index + 1}
            </span>
            <span>{s.label}</span>
            {index < steps.length - 1 && <span style={{ marginLeft: '4px' }}>→</span>}
          </div>
        ))}
      </div>
    );
  };

  if (loading && step === 'upload') {
    return (
      <div className="app-container">
        <div className="loading">
          <div className="spinner"></div>
          <p style={{ marginTop: '12px', color: '#646a73' }}>加载中...</p>
        </div>
      </div>
    );
  }

  // 非飞书环境：显示本地测试模式
  if (!isInFeishu) {
    return (
      <div className="app-container">
        <div className="section-card" style={{ borderColor: '#faad14', background: '#fffbe6' }}>
          <div className="section-header" style={{ color: '#d48806' }}>
            ⚠️ 当前为本地测试模式
          </div>
          <div className="section-content" style={{ fontSize: '13px', color: '#666' }}>
            <p style={{ marginBottom: '12px' }}>
              飞书 SDK 未初始化成功，这可能是以下原因：
            </p>
            <ul style={{ marginBottom: '12px', paddingLeft: '20px' }}>
              <li>插件未通过飞书多维表格打开</li>
              <li>内网穿透地址未正确配置</li>
              <li>飞书插件上下文未加载</li>
            </ul>
            <p style={{ marginBottom: '16px' }}>
              <strong>解决方法：</strong><br/>
              1. 在飞书多维表格中打开此插件<br/>
              2. 确保使用的是 ngrok/localtunnel 公网地址<br/>
              3. 点击下方按钮跳过 SDK 检查，直接测试 Excel 功能
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => {
                setIsInFeishu(true);
                setLoading(false);
              }}
            >
              继续本地测试
            </button>
          </div>
        </div>
        
        <div style={{ marginTop: '16px' }}>
          <FileUploader onFileUpload={handleFileUpload} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {renderStepIndicator()}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {step === 'upload' && (
        <FileUploader onFileUpload={handleFileUpload} />
      )}

      {step === 'mapping' && excelData && (
        <>
          <FieldMapper
            excelData={excelData}
            fieldMappings={fieldMappings}
            bitableFields={bitableFields}
            matchRate={matchRate}
            strategy={strategy}
            onStrategyChange={setStrategy}
            onMappingChange={handleMappingChange}
          />
          
          <div className="btn-group">
            <button className="btn btn-secondary" onClick={handleReset}>
              重新上传
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleSync}
              disabled={fieldMappings.filter(m => m.matched).length === 0}
            >
              开始同步
            </button>
          </div>
        </>
      )}

      {step === 'syncing' && (
        <div className="section-card">
          <div className="section-header">正在同步...</div>
          <div className="section-content">
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <div className="progress-text">
                已同步 {progress.current} / {progress.total} 条记录
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'result' && excelData && (
        <SyncResult
          excelData={excelData}
          fieldMappings={fieldMappings}
          onReset={handleReset}
          isLocalMode={!isInFeishu}
        />
      )}
    </div>
  );
}

export default App;
