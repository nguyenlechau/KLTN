import { Request } from 'express';
import { RegistrationState, WorkflowRole } from './workflow/types.js';

export type PermissionCode =
  | 'channel.view'
  | 'channel.create'
  | 'channel.update'
  | 'channel.delete'
  | 'category.view'
  | 'category.create'
  | 'category.update'
  | 'category.delete'
  | 'location.view'
  | 'location.create'
  | 'location.update'
  | 'location.delete'
  | 'content.view'
  | 'content.create'
  | 'content.update'
  | 'content.delete'
  | 'content.clone'
  | 'physical_item.view'
  | 'physical_item.create'
  | 'physical_item.update'
  | 'physical_item.delete'
  | 'registration.view'
  | 'registration.create'
  | 'registration.update'
  | 'registration.submit'
  | 'registration.review'
  | 'registration.approve'
  | 'registration.accept'
  | 'registration.complete'
  | 'audit.view';

export interface AuthUser {
  id: string;
  email: string;
  role: WorkflowRole;
  channelIds?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface StateGuardContext {
  state: RegistrationState;
  action:
    | 'EDIT'
    | 'SUBMIT'
    | 'REVIEW'
    | 'APPROVE'
    | 'DEPLOY'
    | 'ACCEPT'
    | 'COMPLETE';
}
