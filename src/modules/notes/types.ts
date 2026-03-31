import type { NoteParentType } from '@/shared/types';

export type Note = {
  readonly id: string;
  readonly parent_type: NoteParentType;
  readonly parent_id: string;
  readonly text: string;
  readonly created_at: string;
  readonly user_id: string;
};

export type CreateNoteInput = {
  readonly parent_type: NoteParentType;
  readonly parent_id: string;
  readonly text: string;
};
