/**
 * API 网关的基础 URL。
 * 从环境变量 NEXT_PUBLIC_GATEWAY_HOST_AND_PORT 读取，
 * 如果未设置，则默认为 'http://localhost:8080'。
 * 这个常量主要用于应用内部需要知道网关地址的地方，
 * 以及在 next.config.js 中构建 CSP。
 */
export const API_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_HOST_AND_PORT || 'http://localhost:8080';