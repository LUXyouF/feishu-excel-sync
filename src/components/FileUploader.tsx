import { useState, useRef, useCallback } from 'react';
import { isValidExcelFile } from '../utils/excelParser';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
}

function FileUploader({ onFileUpload }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidExcelFile(file)) {
        onFileUpload(file);
      } else {
        alert('请上传有效的Excel文件（.xlsx 或 .xls）');
      }
    }
  }, [onFileUpload]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
    // 清空input以允许重复选择同一文件
    e.target.value = '';
  }, [onFileUpload]);

  return (
    <div>
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="upload-icon">📁</div>
        <div className="upload-text">
          <strong>点击上传</strong> 或拖拽文件到这里
        </div>
        <div className="upload-hint">支持 .xlsx 和 .xls 格式</div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <div style={{ 
        textAlign: 'center', 
        color: '#8f9399', 
        fontSize: '12px',
        marginTop: '12px'
      }}>
        💡 提示：Excel表头将自动与多维表格字段进行智能匹配
      </div>
    </div>
  );
}

export default FileUploader;
