// HL视频模型的endpoint配置映射
// 如果您有不同模型的不同endpoint，可以在这里配置

export const HL_MODEL_ENDPOINTS: Record<string, string> = {
  // T2V 模型系列
  'MaaS_HL_Video_t2v': 'UfRLJwuMWPdfKWQg',
  'MaaS_HL_Video_t2v_director': 'UfRLJwuMWPdfKWQg',
  
  // I2V 模型系列
  'MaaS_HL_Video_i2v': 'UfRLJwuMWPdfKWQg',
  'MaaS_HL_Video_i2v_director': 'UfRLJwuMWPdfKWQg', 
  'MaaS_HL_Video_i2v_live': 'UfRLJwuMWPdfKWQg',
  
  // S2V 模型系列
  'MaaS_HL_Video_s2v': 'UfRLJwuMWPdfKWQg',
};

// MJ图像模型的endpoint配置
export const MJ_MODEL_ENDPOINTS: Record<string, string> = {
  'MaaS-MJ': 'v1/ai/eljciTfuqTxBSjXl',
  // 如果有其他MJ模型，可以在这里添加
};

// 默认的endpoint配置
export const DEFAULT_ENDPOINTS = {
  HL_VIDEO: 'UfRLJwuMWPdfKWQg',
  MJ_IMAGE: 'v1/ai/eljciTfuqTxBSjXl'
};

// 根据模型ID获取对应的HL endpoint
export function getHLEndpointForModel(modelId: string): string {
  return HL_MODEL_ENDPOINTS[modelId] || DEFAULT_ENDPOINTS.HL_VIDEO;
}

// 根据模型ID获取对应的MJ endpoint  
export function getMJEndpointForModel(modelId: string): string {
  return MJ_MODEL_ENDPOINTS[modelId] || DEFAULT_ENDPOINTS.MJ_IMAGE;
}