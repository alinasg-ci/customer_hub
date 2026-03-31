import type { ClientStatus } from '@/shared/types';

export type Client = {
  readonly id: string;
  readonly name: string;
  readonly company: string | null;
  readonly status: ClientStatus;
  readonly created_at: string;
  readonly archived_at: string | null;
  readonly user_id: string;
};

export type CreateClientInput = {
  readonly name: string;
  readonly company?: string;
};

export type UpdateClientInput = {
  readonly name?: string;
  readonly company?: string;
};
