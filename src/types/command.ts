import { TerminalType } from './terminal';

export interface Command {
  id: string;
  name: string;
  command: string;
  tags: string[];
  groupId: string | null;
  terminalType?: TerminalType;
  createdAt: number;
  updatedAt?: number;
}
