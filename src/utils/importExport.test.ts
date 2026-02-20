import { describe, it, expect } from 'vitest';
import { validateImportData, processImportData } from './importExport';
import { Command } from '../types/command';
import { Group } from '../types/group';
import { ExportData } from '../types/common';

describe('importExport utilities', () => {
  it('validates a correct export payload', () => {
    const data: ExportData = {
      version: '1.0.6',
      exportedAt: 1700000000000,
      commands: [
        {
          id: 'cmd-1',
          name: 'Build',
          command: 'npm run build',
          tags: ['build'],
          groupId: null,
          terminalType: 'cmd',
          createdAt: 1700000000001,
        },
      ],
      groups: [
        {
          id: 'grp-1',
          name: 'Default',
          color: '#ffffff',
          order: 0,
          createdAt: 1700000000002,
        },
      ],
    };

    const result = validateImportData(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects missing required fields', () => {
    const result = validateImportData({ commands: [], groups: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('remaps ids and group references on conflicts', () => {
    const existingGroups: Group[] = [
      {
        id: 'g1',
        name: 'Existing',
        color: '#000000',
        order: 0,
        createdAt: 1,
      },
    ];

    const existingCommands: Command[] = [
      {
        id: 'c1',
        name: 'Existing Command',
        command: 'echo hello',
        tags: [],
        groupId: 'g1',
        terminalType: 'cmd',
        createdAt: 1,
      },
    ];

    const data: ExportData = {
      version: '1.0.6',
      exportedAt: 1700000000000,
      groups: [
        {
          id: 'g1',
          name: 'Imported Group',
          color: '#ffffff',
          order: 1,
          createdAt: 2,
        },
      ],
      commands: [
        {
          id: 'c1',
          name: 'Imported Command',
          command: 'echo imported',
          tags: [],
          groupId: 'g1',
          terminalType: 'powershell',
          createdAt: 3,
        },
      ],
    };

    const result = processImportData(data, existingCommands, existingGroups);
    expect(result.groups).toHaveLength(1);
    expect(result.commands).toHaveLength(1);

    const processedGroup = result.groups[0];
    const processedCommand = result.commands[0];

    expect(processedGroup.id).not.toBe('g1');
    expect(processedCommand.id).not.toBe('c1');
    expect(processedCommand.groupId).toBe(processedGroup.id);
  });

  it('skips commands that already exist with identical fields', () => {
    const existingCommands: Command[] = [
      {
        id: 'cmd-1',
        name: 'Build',
        command: 'npm run build',
        tags: ['frontend', 'release'],
        groupId: null,
        terminalType: 'cmd',
        createdAt: 1,
      },
    ];

    const existingGroups: Group[] = [];

    const data: ExportData = {
      version: '1.0.6',
      exportedAt: 1700000000000,
      commands: [
        {
          id: 'cmd-2',
          name: 'Build',
          command: 'npm run build',
          tags: ['release', 'frontend'],
          groupId: null,
          terminalType: 'cmd',
          createdAt: 2,
        },
      ],
      groups: [],
    };

    const result = processImportData(data, existingCommands, existingGroups);
    expect(result.commands).toHaveLength(0);
  });
});
