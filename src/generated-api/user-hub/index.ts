/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export { ApiError } from './core/ApiError';
export { CancelablePromise, CancelError } from './core/CancelablePromise';
export { OpenAPI } from './core/OpenAPI';
export type { OpenAPIConfig } from './core/OpenAPI';

export type { docs_SwaggerAPIEmptyResponse } from './models/docs_SwaggerAPIEmptyResponse';
export type { docs_SwaggerAPIErrorResponseString } from './models/docs_SwaggerAPIErrorResponseString';
export type { docs_SwaggerAPILoginResponse } from './models/docs_SwaggerAPILoginResponse';
export type { docs_SwaggerAPIMyAccountDetailResponse } from './models/docs_SwaggerAPIMyAccountDetailResponse';
export type { docs_SwaggerAPIProfileVOResponse } from './models/docs_SwaggerAPIProfileVOResponse';
export type { docs_SwaggerAPITokenPairResponse } from './models/docs_SwaggerAPITokenPairResponse';
export type { docs_SwaggerAPIUserinfoResponse } from './models/docs_SwaggerAPIUserinfoResponse';
export type { docs_SwaggerAPIUserListResponse } from './models/docs_SwaggerAPIUserListResponse';
export type { docs_SwaggerAPIUserVOResponse } from './models/docs_SwaggerAPIUserVOResponse';
export type { dto_AccountLoginData } from './models/dto_AccountLoginData';
export type { dto_AccountRegisterData } from './models/dto_AccountRegisterData';
export type { dto_CreateIdentityDTO } from './models/dto_CreateIdentityDTO';
export type { dto_CreateUserDTO } from './models/dto_CreateUserDTO';
export type { dto_PhoneLoginOrRegisterData } from './models/dto_PhoneLoginOrRegisterData';
export type { dto_RefreshTokenRequest } from './models/dto_RefreshTokenRequest';
export type { dto_SendCaptchaRequest } from './models/dto_SendCaptchaRequest';
export type { dto_UpdateIdentityDTO } from './models/dto_UpdateIdentityDTO';
export type { dto_UpdateProfileDTO } from './models/dto_UpdateProfileDTO';
export type { dto_UpdateUserDTO } from './models/dto_UpdateUserDTO';
export type { dto_UserQueryDTO } from './models/dto_UserQueryDTO';
export type { dto_WechatMiniProgramLoginData } from './models/dto_WechatMiniProgramLoginData';
export type { enums_Gender } from './models/enums_Gender';
export type { enums_IdentityType } from './models/enums_IdentityType';
export type { enums_UserRole } from './models/enums_UserRole';
export type { enums_UserStatus } from './models/enums_UserStatus';
export type { map_string_string } from './models/map_string_string';
export type { response_APIResponse_map_string_string } from './models/response_APIResponse_map_string_string';
export type { response_APIResponse_string } from './models/response_APIResponse_string';
export type { response_APIResponse_vo_Empty } from './models/response_APIResponse_vo_Empty';
export type { response_APIResponse_vo_IdentityList } from './models/response_APIResponse_vo_IdentityList';
export type { response_APIResponse_vo_IdentityTypeList } from './models/response_APIResponse_vo_IdentityTypeList';
export type { response_APIResponse_vo_IdentityVO } from './models/response_APIResponse_vo_IdentityVO';
export type { vo_Empty } from './models/vo_Empty';
export type { vo_IdentityList } from './models/vo_IdentityList';
export type { vo_IdentityTypeList } from './models/vo_IdentityTypeList';
export type { vo_IdentityVO } from './models/vo_IdentityVO';
export type { vo_LoginResponse } from './models/vo_LoginResponse';
export type { vo_MyAccountDetailVO } from './models/vo_MyAccountDetailVO';
export type { vo_ProfileVO } from './models/vo_ProfileVO';
export type { vo_TokenPair } from './models/vo_TokenPair';
export type { vo_Userinfo } from './models/vo_Userinfo';
export type { vo_UserListResponse } from './models/vo_UserListResponse';
export type { vo_UserVO } from './models/vo_UserVO';
export type { vo_UserWithProfileVO } from './models/vo_UserWithProfileVO';

export { Service } from './services/Service';
export { AuthHelperService } from './services/AuthHelperService';
export { AuthManagementService } from './services/AuthManagementService';
export { IdentityManagementService } from './services/IdentityManagementService';
export { ProfileManagementService } from './services/ProfileManagementService';
export { UserManagementService } from './services/UserManagementService';
export { UserQueryService } from './services/UserQueryService';
