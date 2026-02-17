export interface Command {
  id: string;
  name: string;
  command: string;
  tags: string[];
  groupId: string | null;
  createdAt: number;
  updatedAt?: number;
}
