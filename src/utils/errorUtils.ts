// 错误处理工具函数

export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorType = typeof ErrorTypes[keyof typeof ErrorTypes];

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string | number;
  originalError?: any;
  context?: Record<string, any>;
}

export function createAppError(
  type: ErrorType,
  message: string,
  code?: string | number,
  originalError?: any,
  context?: Record<string, any>
): AppError {
  return {
    type,
    message,
    code,
    originalError,
    context,
  };
}

export function parseApiError(error: any): AppError {
  // 网络错误
  if (!navigator.onLine) {
    return createAppError(
      ErrorTypes.NETWORK_ERROR,
      '网络连接失败，请检查您的网络连接',
      'OFFLINE',
      error
    );
  }

  // 请求超时或网络错误
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return createAppError(
      ErrorTypes.NETWORK_ERROR,
      '请求超时，请检查网络连接或稍后重试',
      'TIMEOUT',
      error
    );
  }

  // HTTP状态码错误
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return createAppError(
          ErrorTypes.VALIDATION_ERROR,
          data?.error?.message || data?.message || '请求参数有误',
          status,
          error
        );
      case 401:
        return createAppError(
          ErrorTypes.AUTH_ERROR,
          'API密钥无效或已过期，请重新配置',
          status,
          error
        );
      case 403:
        return createAppError(
          ErrorTypes.AUTH_ERROR,
          '没有访问权限，请检查API密钥权限',
          status,
          error
        );
      case 404:
        return createAppError(
          ErrorTypes.API_ERROR,
          '请求的资源不存在，请检查接口地址',
          status,
          error
        );
      case 429:
        return createAppError(
          ErrorTypes.RATE_LIMIT_ERROR,
          '请求过于频繁，请稍后再试',
          status,
          error
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return createAppError(
          ErrorTypes.SERVER_ERROR,
          '服务器暂时不可用，请稍后再试',
          status,
          error
        );
      default:
        return createAppError(
          ErrorTypes.API_ERROR,
          data?.error?.message || data?.message || `请求失败 (${status})`,
          status,
          error
        );
    }
  }

  // 请求未发出的错误
  if (error.request) {
    return createAppError(
      ErrorTypes.NETWORK_ERROR,
      '网络请求失败，请检查网络连接',
      'REQUEST_FAILED',
      error
    );
  }

  // 其他错误
  return createAppError(
    ErrorTypes.UNKNOWN_ERROR,
    error.message || '发生未知错误',
    'UNKNOWN',
    error
  );
}

export function getErrorRecoveryActions(error: AppError) {
  const actions = [];

  switch (error.type) {
    case ErrorTypes.NETWORK_ERROR:
      actions.push({
        label: '重试',
        action: () => window.location.reload(),
        variant: 'primary' as const,
      });
      actions.push({
        label: '检查网络',
        action: () => window.open('https://www.baidu.com', '_blank'),
        variant: 'secondary' as const,
      });
      break;

    case ErrorTypes.AUTH_ERROR:
      actions.push({
        label: '配置API',
        action: () => {
          const event = new CustomEvent('openApiConfig');
          window.dispatchEvent(event);
        },
        variant: 'primary' as const,
      });
      break;

    case ErrorTypes.RATE_LIMIT_ERROR:
      actions.push({
        label: '5分钟后重试',
        action: () => {
          setTimeout(() => window.location.reload(), 5 * 60 * 1000);
        },
        variant: 'primary' as const,
      });
      break;

    case ErrorTypes.SERVER_ERROR:
    case ErrorTypes.API_ERROR:
      actions.push({
        label: '重试',
        action: () => window.location.reload(),
        variant: 'primary' as const,
      });
      break;

    default:
      actions.push({
        label: '刷新页面',
        action: () => window.location.reload(),
        variant: 'primary' as const,
      });
      break;
  }

  return actions;
}

// 开发环境错误日志
export function logError(error: AppError, context?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 错误 ${context ? `(${context})` : ''}`);
    console.error('错误类型:', error.type);
    console.error('错误信息:', error.message);
    if (error.code) console.error('错误代码:', error.code);
    if (error.context) console.error('错误上下文:', error.context);
    if (error.originalError) console.error('原始错误:', error.originalError);
    console.groupEnd();
  }
}

// 用户友好的错误消息映射
export const ERROR_MESSAGES = {
  [ErrorTypes.NETWORK_ERROR]: {
    title: '网络连接失败',
    description: '请检查您的网络连接状态',
  },
  [ErrorTypes.API_ERROR]: {
    title: 'API请求失败',
    description: '服务器请求失败，请稍后重试',
  },
  [ErrorTypes.VALIDATION_ERROR]: {
    title: '输入验证失败',
    description: '请检查输入的内容是否正确',
  },
  [ErrorTypes.AUTH_ERROR]: {
    title: '身份验证失败',
    description: '请检查API配置是否正确',
  },
  [ErrorTypes.RATE_LIMIT_ERROR]: {
    title: '请求过于频繁',
    description: '请稍后再试或升级您的API配额',
  },
  [ErrorTypes.SERVER_ERROR]: {
    title: '服务器错误',
    description: '服务器暂时不可用，请稍后重试',
  },
  [ErrorTypes.UNKNOWN_ERROR]: {
    title: '未知错误',
    description: '发生了意外错误，请联系技术支持',
  },
} as const;