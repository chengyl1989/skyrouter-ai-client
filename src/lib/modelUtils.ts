import { ModelInfo, CategorizedModels } from '@/hooks/useModels';

/**
 * 按类型分类模型
 * @param models 模型列表
 * @returns 分类后的模型对象
 */
export const categorizeModels = (models: ModelInfo[]): CategorizedModels => {
  return {
    chat: models.filter(model => {
      const id = model.id.toLowerCase();
      return (
        // GPT系列
        (id.includes('maas_gp_') || id.includes('maas_op_')) ||
        // Gemini系列 (排除image版本)
        (id.includes('maas_ge_') && !id.includes('image')) ||
        // Claude系列
        (id.includes('maas_cl_') && (
          id.includes('opus') || 
          id.includes('sonnet') ||
          id.includes('haiku')
        )) ||
        // Grok系列
        id.includes('maas_gr_') ||
        // DeepSeek系列
        id.includes('maas_ds_') ||
        // Kimi系列
        id.includes('maas_km_') ||
        // 向后兼容的旧命名规则
        (id.includes('maas') && (
          id.includes('pro') || 
          id.includes('haiku') || 
          id.includes('sonnet') ||
          id.includes('opus') || 
          id.includes('mini') ||
          id.includes('4o') ||
          id.includes('3.5') ||
          id.includes('1.5') ||
          id.includes('flash') && !id.includes('image') ||
          id.includes('llama') ||
          id.includes('ds-') ||
          id.includes('gp_') ||
          id.includes('gr_') ||
          id.includes('o1') ||
          id.includes('o3') ||
          id.includes('kimi')
        )) ||
        // 其他聊天模型
        (id.includes('gpt') && !id.includes('search')) ||
        id.includes('claude') ||
        id.includes('deepseek')
      ) && 
      // 排除明确的非聊天模型
      !id.includes('image') &&
      !id.includes('video') &&
      !id.includes('speech') &&
      !id.includes('whisper') &&
      !id.includes('embedding') &&
      !id.includes('search') &&
      !id.includes('dall') &&
      !id.includes('flux') &&
      !id.includes('stable') &&
      !id.includes('mj') &&
      !id.includes('comfy') &&
      !id.includes('haiper') &&
      !id.includes('hl_video') &&
      !id.includes('hailuo') &&
      !id.includes('keling') &&
      !id.includes('veo') &&
      !id.includes('t2v') &&
      !id.includes('i2v') &&
      !id.includes('s2v');
    }),
    
    image: models.filter(model => {
      const id = model.id.toLowerCase();
      return (
        // MidJourney系列
        id.includes('maas_mj') ||
        // Flux系列
        id.includes('maas_flux') ||
        // Gemini Image系列
        (id.includes('maas_ge_') && id.includes('image')) ||
        // GPT Image系列
        id.includes('maas_gp_image') ||
        // DALL-E系列
        id.includes('maas_dae_') ||
        // 向后兼容的旧命名规则
        id.includes('dall-e') || 
        id.includes('image') ||
        id.includes('flux') ||
        id.includes('stable-diffusion') ||
        id.includes('stable_diffusion') ||
        id.includes('mj') || // Midjourney
        id.includes('comfyui') ||
        id.includes('comfy') ||
        id.includes('xdf_comfyui') ||
        (id.includes('maas') && (
          id.includes('image') ||
          id.includes('mj') ||
          id.includes('stable') ||
          id.includes('flux') ||
          id.includes('diffusion')
        ))
      );
    }),
    
    video: models.filter(model => {
      const id = model.id.toLowerCase();
      return (
        // Veo系列
        id.includes('maas_veo') ||
        // KeLing系列
        id.includes('maas_keling') ||
        // HaiLuo系列
        id.includes('maas_hailuo') ||
        // 向后兼容的旧命名规则
        id.includes('video') ||
        id.includes('haiper') ||
        id.includes('hl_video') ||
        id.includes('sora') ||
        id.includes('veo') ||
        id.includes('hailuo') ||
        id.includes('keling') ||
        (id.includes('maas') && (
          id.includes('s2v') || // Speech to Video
          id.includes('t2v') || // Text to Video 
          id.includes('i2v') || // Image to Video
          id.includes('kl')     // KL Video models (向后兼容)
        ))
      );
    }),
    
    speech: models.filter(model => {
      const id = model.id.toLowerCase();
      return (
        id.includes('speech') ||
        id.includes('whisper') ||
        id.includes('tts') ||
        id.includes('t2a') || // Text to Audio
        id.includes('asr') || // Automatic Speech Recognition
        id.includes('voice') ||
        id.includes('audio') ||
        id.includes('ospeech') ||
        id.includes('aspeech')
      );
    }),
    
    embedding: models.filter(model => {
      const id = model.id.toLowerCase();
      return (
        id.includes('embedding') ||
        id.includes('embed')
      );
    }),
    
    other: models.filter(model => {
      const id = model.id.toLowerCase();
      // 搜索、工具类模型
      return (
        id.includes('search') ||
        id.includes('correction') ||
        id.includes('evaluation') ||
        id.includes('mock') ||
        id.includes('aippt') ||
        id.includes('scribe') ||
        id.includes('erase') ||
        id.includes('selection') ||
        !id.includes('maas') // 非MaaS模型但有用的工具
      );
    })
  };
};