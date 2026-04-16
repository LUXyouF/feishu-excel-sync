import type { IField } from '@lark-base-open/js-sdk';

/**
 * 字段映射配置
 */
export interface FieldMapping {
  excelColumn: string;     // Excel列名
  bitableFieldId: string;    // 多维表格字段ID
  bitableFieldName: string;  // 多维表格字段名
  matched: boolean;         // 是否自动匹配
  fieldType: string;         // 字段类型
}

/**
 * 同义词映射表
 */
const SYNONYMS: Record<string, string[]> = {
  '姓名': ['名字', '名', 'author', 'name', 'author_name'],
  '账号': ['用户名', '账户', 'user', 'account', 'user_id', 'userid'],
  '单位': ['机构', '组织', '部门', '公司', ' affiliation', 'org', 'organization', 'institution'],
  '邮箱': ['电子邮件', 'email', 'mail', 'e_mail'],
  '电话': ['手机', '号码', '手机号', 'phone', 'tel', 'mobile', 'telephone'],
  '地址': ['位置', 'location', 'address'],
  '职称': ['职务', 'title', 'position', 'job_title'],
  '科室': ['部门', 'department', 'dept'],
  '研究方向': ['专长', '领域', 'research_area', 'interest'],
  '专家类型': ['类型', 'category', '专家分类', 'type'],
  '备注': ['说明', 'comment', 'notes', 'description', 'note'],
  '状态': ['状态', 'status'],
  '日期': ['时间', 'date', 'time'],
  '金额': ['价格', '钱', 'amount', 'money', 'sum'],
  '数量': ['num', 'count', 'number', 'qty'],
  '编号': ['ID', 'id', 'code', 'no'],
  '标题': ['题目', 'subject', 'topic', 'title'],
  '内容': ['正文', 'body', 'text', 'content'],
  '作者': ['撰写人', 'creator', 'writer'],
};

/**
 * 标准化字符串（去除空格、转小写）
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '').trim();
}

/**
 * 获取汉字拼音首字母
 */
function getPinyinInitials(str: string): string {
  // 常用汉字拼音首字母映射
  const pinyinMap: Record<string, string> = {
    '姓': 'x', '名': 'm', '账': 'z', '号': 'h',
    '单': 'd', '位': 'w', '邮': 'y', '箱': 'x',
    '电': 'd', '话': 'h', '手': 's', '机': 'j',
    '地': 'd', '址': 'z', '职': 'z', '称': 'c',
    '科': 'k', '室': 's', '研': 'y', '究': 'j',
    '方': 'f', '向': 'x', '专': 'z', '家': 'j',
    '类': 'l', '型': 'x', '备': 'b', '注': 'z',
    '状': 'z', '态': 't', '日': 'r', '期': 'q',
    '金': 'j', '额': 'e', '数': 's', '量': 'l',
    '编': 'b', '标': 'b', '题': 't', '作': 'z',
    '者': 'z', '内': 'n', '容': 'r',
  };
  
  let result = '';
  for (const char of str) {
    const pinyin = pinyinMap[char];
    if (pinyin) {
      result += pinyin;
    } else if (/[a-zA-Z]/.test(char)) {
      result += char.toLowerCase();
    }
  }
  return result;
}

/**
 * 检查是否是同义词
 */
function isSynonym(str1: string, str2: string): boolean {
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  
  // 检查是否是同义词映射表中的匹配
  for (const [key, synonyms] of Object.entries(SYNONYMS)) {
    const keyNorm = normalize(key);
    const allTerms = [keyNorm, ...synonyms.map(s => normalize(s))];
    
    if (allTerms.includes(s1) && allTerms.includes(s2)) {
      return true;
    }
  }
  return false;
}

/**
 * 计算匹配分数
 */
function calculateMatchScore(excelCol: string, fieldName: string): number {
  const excel = normalize(excelCol);
  const field = normalize(fieldName);
  
  // 1. 精确匹配 (1.0)
  if (excel === field) {
    return 1.0;
  }
  
  // 2. 同义词匹配 (0.95)
  if (isSynonym(excelCol, fieldName)) {
    return 0.95;
  }
  
  // 3. 包含匹配 (0.8)
  if (field.includes(excel) || excel.includes(field)) {
    const minLen = Math.min(field.length, excel.length);
    const maxLen = Math.max(field.length, excel.length);
    return 0.7 + 0.1 * (minLen / maxLen);
  }
  
  // 4. 拼音首字母匹配 (0.75)
  const excelPinyin = getPinyinInitials(excelCol);
  const fieldPinyin = getPinyinInitials(fieldName);
  if (excelPinyin.length >= 2 && fieldPinyin.length >= 2) {
    if (excelPinyin === fieldPinyin) {
      return 0.75;
    }
    // 部分拼音匹配
    if (fieldPinyin.includes(excelPinyin) || excelPinyin.includes(fieldPinyin)) {
      return 0.6;
    }
  }
  
  // 5. 关键词匹配 (0.6)
  const excelKeywords = excel.split(/[_\- ]/);
  const fieldKeywords = field.split(/[_\- ]/);
  for (const ek of excelKeywords) {
    for (const fk of fieldKeywords) {
      if (ek === fk && ek.length >= 2) {
        return 0.6;
      }
    }
  }
  
  // 6. 模糊匹配（编辑距离）(0.4-0.5)
  const similarity = calculateSimilarity(excel, field);
  if (similarity >= 0.7) {
    return similarity * 0.5;
  }
  
  return 0;
}

/**
 * 计算字符串相似度
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0 && len2 === 0) return 1;
  if (len1 === 0 || len2 === 0) return 0;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}

/**
 * 获取字段类型名称
 */
export function getFieldTypeName(type: number): string {
  const typeMap: Record<number, string> = {
    1: '文本',
    2: '数字',
    3: '单选',
    4: '多选',
    5: '日期',
    7: '复选框',
    11: '电话号码',
    13: '网址',
    15: '附件',
    17: '关联',
    18: '公式',
    19: '查找',
    20: '用户',
    21: '群组',
    22: '位置',
    23: '国家',
    24: '时区',
    25: '货币',
    26: '进度',
    27: '评级',
    1003: '自动编号',
    1004: '创建时间',
    1005: '修改时间',
    1006: '创建人',
    1007: '修改人',
  };
  
  return typeMap[type] || `类型${type}`;
}

/**
 * 智能匹配Excel列与多维表格字段
 * @param excelHeaders Excel表头
 * @param bitableFields 多维表格字段列表
 * @param threshold 匹配阈值 (默认0.6)
 * @returns 字段映射列表
 */
export function matchFields(
  excelHeaders: string[],
  bitableFields: IField[],
  threshold: number = 0.6
): FieldMapping[] {
  return excelHeaders.map(excelCol => {
    let bestMatch: IField | null = null;
    let bestScore = 0;

    for (const field of bitableFields) {
      const fieldName = field.name;
      const score = calculateMatchScore(excelCol, fieldName);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = field;
      }
    }

    return {
      excelColumn: excelCol,
      bitableFieldId: bestMatch?.id || '',
      bitableFieldName: bestMatch?.name || '',
      matched: bestMatch !== null && bestScore >= threshold,
      fieldType: getFieldTypeName(bestMatch?.type || 1)
    };
  });
}

/**
 * 获取未匹配的Excel列
 */
export function getUnmatchedColumns(mappings: FieldMapping[]): string[] {
  return mappings
    .filter(m => !m.matched)
    .map(m => m.excelColumn);
}

/**
 * 统计匹配率
 */
export function getMatchRate(mappings: FieldMapping[]): number {
  if (mappings.length === 0) return 0;
  const matchedCount = mappings.filter(m => m.matched).length;
  return Math.round((matchedCount / mappings.length) * 100);
}
