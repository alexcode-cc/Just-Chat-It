export { Logger, LogLevel, type LogEntry, type LoggerConfig } from './logger';
export { ErrorHandler, type ErrorHandlerOptions } from './error-handler';

// 導出 logger 單例實例供其他模組使用
import { Logger } from './logger';
export const logger = Logger.getInstance();
