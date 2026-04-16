import type { IField, ITable, Record as IRecord } from '@lark-base-open/js-sdk';
import type { FieldMapping } from './fieldMatcher';

/**
 * 同步结果
 */
export interface SyncResult {
  successCount: number;
  failedCount: number;
  totalCount: number;
  errors: string[];
}

// 延迟加载 bitable SDK
let bitable: any = null;
let sdkLoaded = false;

async function loadBitableSDK() {
  if (sdkLoaded && bitable) return bitable;
  
  try {
    const module = await import('@lark-base-open/js-sdk');
    bitable = module.bitable;
    sdkLoaded = true;
    return bitable;
  } catch (err) {
    console.error('加载飞书 SDK 失败:', err);
    throw new Error('飞书 SDK 加载失败');
  }
}

/**
 * 检查 SDK 是否可用
 */
export function isSDKAvailable(): boolean {
  return sdkLoaded && bitable !== null;
}

/**
 * 获取当前激活的表格
 */
export async function getActiveTable(): Promise<ITable> {
  const sdk = await loadBitableSDK();
  const tableId = await sdk.base.getActiveTableId();
  if (!tableId) {
    throw new Error('未获取到表格ID');
  }
  return sdk.base.getTable(tableId);
}

/**
 * 获取表格所有字段
 */
export async function getTableFields(): Promise<IField[]> {
  const table = await getActiveTable();
  return await table.getFields();
}

/**
 * 批量添加记录
 */
export async function addRecords(
  records: Record<string, unknown>[],
  onProgress?: (current: number, total: number) => void
): Promise<SyncResult> {
  const table = await getActiveTable();
  const result: SyncResult = {
    successCount: 0,
    failedCount: 0,
    totalCount: records.length,
    errors: []
  };

  // 每批50条记录
  const batchSize = 50;
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      const newRecords = await table.addRecords(batch);
      result.successCount += newRecords.length;
    } catch (error) {
      result.failedCount += batch.length;
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      result.errors.push(`第${i + 1}-${i + batch.length}行: ${errorMsg}`);
    }

    if (onProgress) {
      onProgress(Math.min(i + batchSize, records.length), records.length);
    }
  }

  return result;
}

/**
 * 增量同步：将Excel数据追加到多维表格
 */
export async function incrementalSync(
  excelData: Record<string, unknown>[],
  fieldMappings: FieldMapping[],
  onProgress?: (current: number, total: number) => void
): Promise<SyncResult> {
  const table = await getActiveTable();
  
  // 过滤已匹配的字段
  const matchedMappings = fieldMappings.filter(m => m.matched);
  
  if (matchedMappings.length === 0) {
    return {
      successCount: 0,
      failedCount: 0,
      totalCount: excelData.length,
      errors: ['没有可同步的字段映射']
    };
  }

  // 转换数据格式
  const records = excelData.map(row => {
    const fields: Record<string, unknown> = {};
    matchedMappings.forEach(mapping => {
      const value = row[mapping.excelColumn];
      // 处理空值
      fields[mapping.bitableFieldId] = value === '' || value === null || value === undefined 
        ? null 
        : value;
    });
    return fields;
  });

  return addRecords(records, onProgress);
}

/**
 * 全量同步：清空表格后重新导入
 */
export async function fullSync(
  excelData: Record<string, unknown>[],
  fieldMappings: FieldMapping[],
  onProgress?: (current: number, total: number) => void
): Promise<SyncResult> {
  const table = await getActiveTable();
  
  // 获取所有记录ID
  const allRecords = await table.getRecords({ pageSize: 100000 });
  const recordIds = allRecords.map((r: IRecord) => r.id);

  // 分批删除（每批100条）
  const deleteBatchSize = 100;
  for (let i = 0; i < recordIds.length; i += deleteBatchSize) {
    const batch = recordIds.slice(i, i + deleteBatchSize);
    await table.deleteRecords(batch);
    if (onProgress) {
      onProgress(Math.floor(i / 2), recordIds.length + excelData.length);
    }
  }

  // 导入新数据
  return incrementalSync(excelData, fieldMappings, onProgress);
}

/**
 * 显示提示消息
 */
export async function showToast(type: 'success' | 'error' | 'info', message: string): Promise<void> {
  try {
    const sdk = await loadBitableSDK();
    sdk.ui.hostToast(type, message);
  } catch (e) {
    // 降级处理
    console.log(`[${type}] ${message}`);
  }
}

/**
 * 获取表格信息
 */
export async function getTableInfo(): Promise<{
  tableId: string;
  tableName: string;
  recordCount: number;
}> {
  const table = await getActiveTable();
  const records = await table.getRecords({ pageSize: 1 });
  
  return {
    tableId: table.id,
    tableName: table.name,
    recordCount: records.total
  };
}
