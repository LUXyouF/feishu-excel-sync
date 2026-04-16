import * as XLSX from 'xlsx';

/**
 * Excel数据结构
 */
export interface ExcelData {
  headers: string[];
  rows: Record<string, unknown>[];
  fileName: string;
}

/**
 * 解析Excel文件
 * @param file Excel文件
 * @returns 解析后的数据
 */
export function parseExcel(file: File): Promise<ExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // 获取第一个工作表
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 转换为JSON（header: 1 表示第一行作为表头）
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: ''
        }) as unknown[][];

        if (jsonData.length === 0) {
          reject(new Error('Excel文件为空'));
          return;
        }

        // 第一行为表头
        const headers = (jsonData[0] as string[]).map(h => String(h).trim());
        
        // 数据行（过滤空行）
        const rows = jsonData.slice(1)
          .filter(row => row && row.some(cell => cell !== null && cell !== undefined && cell !== ''))
          .map(row => {
            const obj: Record<string, unknown> = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] ?? '';
            });
            return obj;
          });

        resolve({
          headers,
          rows,
          fileName: file.name
        });
      } catch (error) {
        reject(new Error(`解析Excel失败: ${error instanceof Error ? error.message : '未知错误'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * 验证文件是否为Excel格式
 * @param file 文件
 * @returns 是否为有效的Excel文件
 */
export function isValidExcelFile(file: File): boolean {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/octet-stream' // 某些浏览器可能返回这个
  ];
  
  const validExtensions = ['.xlsx', '.xls'];
  
  const hasValidType = validTypes.includes(file.type) || file.type === '';
  const hasValidExtension = validExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );

  return hasValidType && hasValidExtension;
}
