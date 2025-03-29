import { Platform } from 'react-native';
import { Project, Column, Group, Card, Subtask, ProjectData } from '../types'; // Added Group
import { parseMarkdownToProjectData } from './markdownParser';

// Import SQLite only on native platforms
let SQLite: any;
let SQLiteTransaction: any;
let SQLResultSet: any;

if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
  SQLiteTransaction = require('expo-sqlite').SQLiteTransaction;
  SQLResultSet = require('expo-sqlite').SQLResultSet;
}

// Interface for database service implementations
interface IDatabaseService {
  createProject(name: string): Promise<ProjectData>;
  createProjectWithColumns(name: string, content: string, columns: Column[]): Promise<ProjectData>;
  getProjects(): Promise<Project[]>;
  getProjectData(projectId: number): Promise<ProjectData>;
  updateProject(project: Project): Promise<boolean>;
  updateProjectColumns(projectId: number, columns: Column[]): Promise<void>;
  deleteProject(id: number): Promise<boolean>;

  // Column operations
  createColumn(column: Omit<Column, 'id' | 'createdAt' | 'updatedAt'>): Promise<Column>;
  updateColumn(column: Column): Promise<boolean>;
  deleteColumn(id: number): Promise<boolean>;

  // Card operations
  createCard(card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>): Promise<Card>;
  updateCard(card: Card): Promise<boolean>;
  deleteCard(id: number): Promise<boolean>;

  // Subtask operations
  createSubtask(subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subtask>;
  updateSubtask(subtask: Subtask): Promise<boolean>;
  deleteSubtask(id: number): Promise<boolean>;

  // Reset operation
  resetDatabase(): Promise<void>;
}

// Default template for new projects (Keep groupName for parsing old data if needed, but new logic uses groupId)
export const DEFAULT_PROJECT = {
  name: 'New Project',
  columns: [
    {
      title: 'To Do',
      position: 0,
      level: 0,
      groups: [], // Add empty groups array
      cards: [
        {
          text: 'Task 1',
          completed: false,
          position: 0,
          // groupName: '', // Keep for potential backward compatibility if needed elsewhere, but DB uses groupId
          subtasks: [] as { text: string; completed: boolean; position: number }[]
        },
        {
          text: 'Task 2',
          completed: false,
          position: 1,
          // groupName: '',
          subtasks: [] as { text: string; completed: boolean; position: number }[]
        }
      ]
    },
    {
      title: 'In Progress',
      position: 1,
      level: 0,
      groups: [], // Add empty groups array
      cards: [
        {
          text: 'Task in progress',
          completed: false,
          position: 0,
          // groupName: '',
          subtasks: [] as { text: string; completed: boolean; position: number }[]
        }
      ]
    },
    {
      title: 'Done',
      position: 2,
      level: 0,
      groups: [], // Add empty groups array
      cards: [
        {
          text: 'Completed task',
          completed: true,
          position: 0,
          // groupName: '',
          subtasks: [] as { text: string; completed: boolean; position: number }[]
        }
      ]
    }
  ]
};

// SQLite implementation for native platforms
class SQLiteDatabaseService implements IDatabaseService {
  private db: any;

  constructor() {
    this.db = SQLite.openDatabase('markdown_kanban.db');
    this.initDatabase();
  }

  private initDatabase(): void {
    this.db.transaction((tx: any) => {
      // Create projects table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          content TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`
      );

      // Create columns table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS columns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          position INTEGER NOT NULL,
          level INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
        );`
      );

      // Create groups table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          column_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          position INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (column_id) REFERENCES columns (id) ON DELETE CASCADE
        );`
      );

      // Create cards table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS cards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          column_id INTEGER NOT NULL,
          group_id INTEGER, -- Nullable, for cards directly in columns
          text TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT 0,
          position INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          -- group_name TEXT NOT NULL, -- Removed
          FOREIGN KEY (column_id) REFERENCES columns (id) ON DELETE CASCADE,
          FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
        );`
      );

      // Create subtasks table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS subtasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          card_id INTEGER NOT NULL,
          text TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT 0,
          position INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE CASCADE
        );`
      );
    }, (error: any) => {
      console.error('Error initializing database:', error);
    }, () => {
      console.log('Database initialized successfully');
    });
  }

  async resetDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          console.log('Resetting SQLite database...');
          // Drop tables in reverse order of creation/dependency
          await this.executeSql(tx, 'DROP TABLE IF EXISTS subtasks;', []);
          await this.executeSql(tx, 'DROP TABLE IF EXISTS cards;', []);
          await this.executeSql(tx, 'DROP TABLE IF EXISTS groups;', []);
          await this.executeSql(tx, 'DROP TABLE IF EXISTS columns;', []);
          await this.executeSql(tx, 'DROP TABLE IF EXISTS projects;', []);
          console.log('Tables dropped.');
          // Re-initialize
          this.initDatabase(); // This runs async, but we resolve after dropping
          console.log('Database re-initialized.');
          resolve();
        } catch (error) {
          console.error('Error resetting database:', error);
          reject(error);
        }
      });
    });
  }


  async createProject(name: string): Promise<ProjectData> {
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          // Create project
          const [projectResult] = await this.executeSql(tx,
            'INSERT INTO projects (name, content, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [name, '', now, now]
          );

          const projectId = parseInt(projectResult.insertId);
          const project: Project = {
            id: projectId,
            name,
            createdAt: now,
            updatedAt: now
          };

          // Create default columns and cards
          const projectData = await this.createDefaultProjectStructure(tx, project);
          resolve(projectData);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async createProjectWithColumns(name: string, content: string, columns: Column[]): Promise<ProjectData> {
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          // Create project with initial content
          const [projectResult] = await this.executeSql(tx,
            'INSERT INTO projects (name, content, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [name, content, now, now]
          );

          const projectId = parseInt(projectResult.insertId);
          const project: Project = {
            id: projectId,
            name,
            content,
            createdAt: now,
            updatedAt: now
          };

          // Create columns and cards
          const projectData: ProjectData = {
            project,
            columns: []
          };

          for (const column of columns) {
            // Insert column
            const [columnResult] = await this.executeSql(tx,
              'INSERT INTO columns (project_id, title, position, level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
              [projectId, column.title, column.position, column.level || 0, now, now]
            );
            const columnId = parseInt(columnResult.insertId);

            const newColumn: Column = {
              id: columnId,
              projectId,
              title: column.title,
              position: column.position,
              level: column.level || 0,
              createdAt: now,
              updatedAt: now,
              groups: [], // Initialize groups
              cards: [] // Initialize cards
            };

            // Insert groups (if any)
            for (const group of column.groups || []) {
              const [groupResult] = await this.executeSql(tx,
                'INSERT INTO groups (column_id, title, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                [columnId, group.title, group.position, now, now]
              );
              const groupId = parseInt(groupResult.insertId);

              const newGroup: Group = {
                ...group,
                id: groupId,
                columnId: columnId,
                createdAt: now,
                updatedAt: now,
                cards: []
              };

              // Insert cards for this group
              for (const card of group.cards) {
                const [cardResult] = await this.executeSql(tx,
                  'INSERT INTO cards (column_id, group_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [columnId, groupId, card.text, card.completed, card.position, now, now]
                );
                const cardId = parseInt(cardResult.insertId);

                const newCard: Card = {
                  ...card,
                  id: cardId,
                  columnId: columnId,
                  groupId: groupId,
                  createdAt: now,
                  updatedAt: now,
                  subtasks: []
                };

                // Insert subtasks
                for (const subtask of card.subtasks) {
                  const [subtaskResult] = await this.executeSql(tx,
                    'INSERT INTO subtasks (card_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [cardId, subtask.text, subtask.completed, subtask.position, now, now]
                  );
                  newCard.subtasks.push({
                    ...subtask,
                    id: parseInt(subtaskResult.insertId),
                    cardId: cardId,
                    createdAt: now,
                    updatedAt: now
                  });
                }
                newGroup.cards.push(newCard);
              }
              newColumn.groups.push(newGroup);
            }

            // Insert cards directly under the column
            for (const card of column.cards) {
              const [cardResult] = await this.executeSql(tx,
                'INSERT INTO cards (column_id, group_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [columnId, null, card.text, card.completed, card.position, now, now] // group_id is null
              );
              const cardId = parseInt(cardResult.insertId);

              const newCard: Card = {
                ...card,
                id: cardId,
                columnId: columnId,
                groupId: undefined, // No group ID
                createdAt: now,
                updatedAt: now,
                subtasks: []
              };

              // Insert subtasks
              for (const subtask of card.subtasks) {
                const [subtaskResult] = await this.executeSql(tx,
                  'INSERT INTO subtasks (card_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                  [cardId, subtask.text, subtask.completed, subtask.position, now, now]
                );
                newCard.subtasks.push({
                  ...subtask,
                  id: parseInt(subtaskResult.insertId),
                  cardId: cardId,
                  createdAt: now,
                  updatedAt: now
                });
              }
              newColumn.cards.push(newCard);
            }
            projectData.columns.push(newColumn);
          }
          resolve(projectData);
        } catch (error) {
          reject(error);
        }
      });
    });
  }


  private async createDefaultProjectStructure(tx: any, project: Project): Promise<ProjectData> {
    const now = new Date().toISOString();
    const projectData: ProjectData = {
      project,
      columns: []
    };

    // Create default columns
    for (const columnTemplate of DEFAULT_PROJECT.columns) {
      // Create column
      const [columnResult] = await this.executeSql(tx,
        'INSERT INTO columns (project_id, title, position, level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [project.id, columnTemplate.title, columnTemplate.position, columnTemplate.level, now, now]
      );
      const columnId = parseInt(columnResult.insertId);

      const column: Column = { // Use Column type directly
        id: columnId,
        projectId: project.id,
        title: columnTemplate.title,
        position: columnTemplate.position,
        level: columnTemplate.level,
        createdAt: now,
        updatedAt: now,
        groups: [], // Initialize groups array
        cards: [] // Initialize cards array
      };

      // Create cards for this column (no groups in default structure)
      for (const cardTemplate of columnTemplate.cards) {
        const [cardResult] = await this.executeSql(tx,
          'INSERT INTO cards (column_id, group_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [columnId, null, cardTemplate.text, cardTemplate.completed, cardTemplate.position, now, now] // Use group_id (null for default)
        );
        const cardId = parseInt(cardResult.insertId);

        const card: Card = { // Use Card type directly
          id: cardId,
          columnId: columnId,
          groupId: undefined, // No group for default cards
          text: cardTemplate.text,
          completed: cardTemplate.completed,
          position: cardTemplate.position,
          createdAt: now,
          updatedAt: now,
          subtasks: []
        };

        // Create subtasks for this card
        for (const subtaskTemplate of cardTemplate.subtasks) {
          const [subtaskResult] = await this.executeSql(tx,
            'INSERT INTO subtasks (card_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [cardId, subtaskTemplate.text, subtaskTemplate.completed, subtaskTemplate.position, now, now]
          );

          const subtask: Subtask = {
            id: parseInt(subtaskResult.insertId),
            cardId: cardId,
            text: subtaskTemplate.text,
            completed: subtaskTemplate.completed,
            position: subtaskTemplate.position,
            createdAt: now,
            updatedAt: now
          };
          card.subtasks.push(subtask);
        }
        column.cards.push(card); // Add card directly to column's cards
      }
      projectData.columns.push(column);
    }
    return projectData;
  }


  async getProjects(): Promise<Project[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          const [result] = await this.executeSql(tx,
            'SELECT * FROM projects ORDER BY updated_at DESC',
            []
          );

          const projects: Project[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);
            projects.push({
              id: parseInt(row.id),
              name: row.name,
              content: row.content,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            });
          }
          resolve(projects);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async getProjectData(projectId: number): Promise<ProjectData> {
    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          // Get project
          const [projectResult] = await this.executeSql(tx,
            'SELECT * FROM projects WHERE id = ?',
            [projectId]
          );

          if (projectResult.rows.length === 0) {
            throw new Error(`Project not found: ${projectId}`);
          }

          const projectRow = projectResult.rows.item(0);
          const project: Project = {
            id: parseInt(projectRow.id),
            name: projectRow.name,
            content: projectRow.content,
            createdAt: projectRow.created_at,
            updatedAt: projectRow.updated_at
          };

          // Get columns
          const [columnsResult] = await this.executeSql(tx,
            'SELECT * FROM columns WHERE project_id = ? ORDER BY position',
            [projectId]
          );

          const columns: Column[] = []; // Use Column type directly

          for (let i = 0; i < columnsResult.rows.length; i++) {
            const columnRow = columnsResult.rows.item(i);
            const columnId = parseInt(columnRow.id);

            // --- Fetch Groups for this Column ---
            const [groupsResult] = await this.executeSql(tx,
              'SELECT * FROM groups WHERE column_id = ? ORDER BY position',
              [columnId]
            );
            const groups: Group[] = [];

            for (let g = 0; g < groupsResult.rows.length; g++) {
              const groupRow = groupsResult.rows.item(g);
              const groupId = parseInt(groupRow.id);

              // Fetch Cards for this Group
              const [groupCardsResult] = await this.executeSql(tx,
                'SELECT * FROM cards WHERE group_id = ? ORDER BY position',
                [groupId]
              );
              const groupCards: Card[] = [];

              for (let c = 0; c < groupCardsResult.rows.length; c++) {
                const cardRow = groupCardsResult.rows.item(c);
                const cardId = parseInt(cardRow.id);

                // Fetch Subtasks for this Card
                const [subtasksResult] = await this.executeSql(tx,
                  'SELECT * FROM subtasks WHERE card_id = ? ORDER BY position',
                  [cardId]
                );
                const subtasks: Subtask[] = [];
                for (let k = 0; k < subtasksResult.rows.length; k++) {
                  const subtaskRow = subtasksResult.rows.item(k);
                  subtasks.push({
                    id: parseInt(subtaskRow.id),
                    cardId: cardId,
                    text: subtaskRow.text,
                    completed: Boolean(subtaskRow.completed),
                    position: subtaskRow.position,
                    createdAt: subtaskRow.created_at,
                    updatedAt: subtaskRow.updated_at
                  });
                }

                groupCards.push({
                  id: cardId,
                  columnId: columnId,
                  groupId: groupId, // Assign groupId
                  text: cardRow.text,
                  completed: Boolean(cardRow.completed),
                  position: cardRow.position,
                  createdAt: cardRow.created_at,
                  updatedAt: cardRow.updated_at,
                  subtasks
                });
              }

              groups.push({
                id: groupId,
                columnId: columnId,
                title: groupRow.title,
                position: groupRow.position,
                createdAt: groupRow.created_at,
                updatedAt: groupRow.updated_at,
                cards: groupCards
              });
            }
            // --- End Fetch Groups ---

            // --- Fetch Cards directly under the Column (no group) ---
            const [columnCardsResult] = await this.executeSql(tx,
              'SELECT * FROM cards WHERE column_id = ? AND group_id IS NULL ORDER BY position',
              [columnId]
            );
            const columnCards: Card[] = [];

            for (let j = 0; j < columnCardsResult.rows.length; j++) {
              const cardRow = columnCardsResult.rows.item(j);
              const cardId = parseInt(cardRow.id);

              // Get subtasks for this card
              const [subtasksResult] = await this.executeSql(tx,
                'SELECT * FROM subtasks WHERE card_id = ? ORDER BY position',
                [cardId]
              );
              const subtasks: Subtask[] = [];

              for (let k = 0; k < subtasksResult.rows.length; k++) {
                const subtaskRow = subtasksResult.rows.item(k);
                subtasks.push({
                  id: parseInt(subtaskRow.id),
                  cardId: cardId,
                  text: subtaskRow.text,
                  completed: Boolean(subtaskRow.completed),
                  position: subtaskRow.position,
                  createdAt: subtaskRow.created_at,
                  updatedAt: subtaskRow.updated_at
                });
              }

              columnCards.push({
                id: cardId,
                columnId: columnId,
                groupId: undefined, // No group ID for these cards
                text: cardRow.text,
                completed: Boolean(cardRow.completed),
                position: cardRow.position,
                // groupName: cardRow.group_name, // Removed
                createdAt: cardRow.created_at,
                updatedAt: cardRow.updated_at,
                subtasks
              });
            }
            // --- End Fetch Column Cards ---

            columns.push({
              id: columnId,
              projectId: project.id,
              title: columnRow.title,
              position: columnRow.position,
              level: columnRow.level,
              createdAt: columnRow.created_at,
              updatedAt: columnRow.updated_at,
              groups: groups, // Assign fetched groups
              cards: columnCards // Assign fetched column cards
            });
          }

          resolve({
            project,
            columns
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async updateProjectColumns(projectId: number, columns: Column[]): Promise<void> {
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          // Delete existing columns, groups, cards, subtasks for the project
          // Cascade delete should handle this if foreign keys are enabled
          await this.executeSql(tx, 'PRAGMA foreign_keys = ON;', []);
          await this.executeSql(tx,
            'DELETE FROM columns WHERE project_id = ?',
            [projectId]
          );

          // Insert new columns, groups, cards, subtasks, capturing real IDs
          for (const column of columns) {
            // Insert Column and get its real ID
            const [columnResult] = await this.executeSql(tx,
              `INSERT INTO columns (project_id, title, position, level, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
              [projectId, column.title, column.position, column.level || 0, now, now]
            );
            const realColumnId = parseInt(columnResult.insertId); // Use the actual generated ID

            // Insert groups using the realColumnId
            for (const group of column.groups || []) {
              const [groupResult] = await this.executeSql(tx,
                'INSERT INTO groups (column_id, title, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                [realColumnId, group.title, group.position, now, now] // Use realColumnId
              );
              const realGroupId = parseInt(groupResult.insertId); // Use the actual generated ID

              // Insert cards for this group using realColumnId and realGroupId
              for (const card of group.cards) {
                const [cardResult] = await this.executeSql(tx,
                  'INSERT INTO cards (column_id, group_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [realColumnId, realGroupId, card.text, card.completed, card.position, now, now] // Use real IDs
                );
                const realCardId = parseInt(cardResult.insertId); // Use the actual generated ID

                // Insert subtasks using realCardId
                for (const subtask of card.subtasks) {
                  await this.executeSql(tx,
                    'INSERT INTO subtasks (card_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [realCardId, subtask.text, subtask.completed, subtask.position, now, now] // Use realCardId
                  );
                }
              }
            }

            // Insert cards directly under the column using realColumnId
            for (const card of column.cards) {
              const [cardResult] = await this.executeSql(tx,
                'INSERT INTO cards (column_id, group_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [realColumnId, null, card.text, card.completed, card.position, now, now] // Use realColumnId
              );
              const realCardId = parseInt(cardResult.insertId); // Use the actual generated ID

              // Insert subtasks using realCardId
              for (const subtask of card.subtasks) {
                await this.executeSql(tx,
                  'INSERT INTO subtasks (card_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                  [realCardId, subtask.text, subtask.completed, subtask.position, now, now] // Use realCardId
                );
              }
            }
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }


  async updateProject(project: Project): Promise<boolean> {
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          // Update project metadata
          const [result] = await this.executeSql(tx,
            'UPDATE projects SET name = ?, content = ?, updated_at = ? WHERE id = ?',
            [project.name, project.content || '', now, project.id]
          );
          // Removed the logic that re-parses content and updates columns here.
          // That responsibility is handled by updateProjectColumns.
          resolve(result.rowsAffected > 0);
        } catch (error) {
          reject(error);
        }
      });
    });
  }


  async deleteProject(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          // --- FIX: Enable foreign keys for this transaction ---
          await this.executeSql(tx, 'PRAGMA foreign_keys = ON;', []);
          // --- End Fix ---

          const [result] = await this.executeSql(tx,
            'DELETE FROM projects WHERE id = ?',
            [id]
          );
          resolve(result.rowsAffected > 0);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async createColumn(column: Omit<Column, 'id' | 'createdAt' | 'updatedAt'>): Promise<Column> {
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          const [result] = await this.executeSql(tx,
            'INSERT INTO columns (project_id, title, position, level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [column.projectId, column.title, column.position, column.level || 0, now, now] // Use level from input or default 0
          );
          const columnId = parseInt(result.insertId);

          // Create groups if provided
          const groups: Group[] = [];
          for (const group of column.groups || []) {
            const [groupResult] = await this.executeSql(tx,
              'INSERT INTO groups (column_id, title, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
              [columnId, group.title, group.position, now, now]
            );
            groups.push({
              ...group,
              id: parseInt(groupResult.insertId),
              columnId: columnId,
              createdAt: now,
              updatedAt: now,
              cards: [] // Groups start with no cards
            });
          }

          // Create cards if provided (directly under column)
          const cards: Card[] = [];
          for (const card of column.cards || []) {
            const [cardResult] = await this.executeSql(tx,
              'INSERT INTO cards (column_id, group_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [columnId, null, card.text, card.completed, card.position, now, now]
            );
             const cardId = parseInt(cardResult.insertId);
            cards.push({
              ...card,
              id: cardId,
              columnId: columnId,
              groupId: undefined,
              createdAt: now,
              updatedAt: now,
              subtasks: [] // Cards start with no subtasks
            });
          }

          resolve({
            id: columnId,
            projectId: column.projectId,
            title: column.title,
            position: column.position,
            level: column.level || 0,
            createdAt: now,
            updatedAt: now,
            groups: groups,
            cards: cards
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }


  async updateColumn(column: Column): Promise<boolean> {
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          // Update column basic info
          const [result] = await this.executeSql(tx,
            'UPDATE columns SET title = ?, position = ?, level = ?, updated_at = ? WHERE id = ?',
            [column.title, column.position, column.level || 0, now, column.id]
          );

          // TODO: Handle updates to groups and cards within the column if necessary
          // This might involve deleting/re-inserting groups/cards or more granular updates

          resolve(result.rowsAffected > 0);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async deleteColumn(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          await this.executeSql(tx, 'PRAGMA foreign_keys = ON;', []); // Ensure cascade delete works
          const [result] = await this.executeSql(tx,
            'DELETE FROM columns WHERE id = ?',
            [id]
          );
          resolve(result.rowsAffected > 0);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async createCard(card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>): Promise<Card> {
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          const [result] = await this.executeSql(tx,
            'INSERT INTO cards (column_id, group_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [card.columnId, card.groupId, card.text, card.completed, card.position, now, now] // Use groupId
          );
          const cardId = parseInt(result.insertId);

          // Create subtasks if provided
          const subtasks: Subtask[] = [];
          for (const subtask of card.subtasks || []) {
             const [subtaskResult] = await this.executeSql(tx,
               'INSERT INTO subtasks (card_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
               [cardId, subtask.text, subtask.completed, subtask.position, now, now]
             );
             subtasks.push({
               ...subtask,
               id: parseInt(subtaskResult.insertId),
               cardId: cardId,
               createdAt: now,
               updatedAt: now
             });
          }

          resolve({
            id: cardId,
            ...card,
            createdAt: now,
            updatedAt: now,
            subtasks: subtasks
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }


  async updateCard(card: Card): Promise<boolean> {
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          const [result] = await this.executeSql(tx,
            'UPDATE cards SET column_id = ?, group_id = ?, text = ?, completed = ?, position = ?, updated_at = ? WHERE id = ?',
            [card.columnId, card.groupId, card.text, card.completed, card.position, now, card.id] // Use groupId
          );

          // TODO: Handle subtask updates if necessary (delete/re-insert or granular updates)

          resolve(result.rowsAffected > 0);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async deleteCard(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          await this.executeSql(tx, 'PRAGMA foreign_keys = ON;', []); // Ensure cascade delete works for subtasks
          const [result] = await this.executeSql(tx,
            'DELETE FROM cards WHERE id = ?',
            [id]
          );
          resolve(result.rowsAffected > 0);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async createSubtask(subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subtask> {
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          const [result] = await this.executeSql(tx,
            'INSERT INTO subtasks (card_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [subtask.cardId, subtask.text, subtask.completed, subtask.position, now, now]
          );

          resolve({
            id: parseInt(result.insertId),
            ...subtask,
            createdAt: now,
            updatedAt: now
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async updateSubtask(subtask: Subtask): Promise<boolean> {
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          const [result] = await this.executeSql(tx,
            'UPDATE subtasks SET text = ?, completed = ?, position = ?, updated_at = ? WHERE id = ?',
            [subtask.text, subtask.completed, subtask.position, now, subtask.id]
          );
          resolve(result.rowsAffected > 0);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async deleteSubtask(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.transaction(async (tx: any) => {
        try {
          const [result] = await this.executeSql(tx,
            'DELETE FROM subtasks WHERE id = ?',
            [id]
          );
          resolve(result.rowsAffected > 0);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private executeSql(tx: any, sql: string, params: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      tx.executeSql(
        sql,
        params,
        (_: any, result: any) => resolve([result]),
        (_: any, error: any) => {
          console.error('SQL Error:', sql, params, error);
          reject(error);
          return false; // Important for transaction rollback
        }
      );
    });
  }
}

// LocalStorage implementation for web platform
// NOTE: This implementation needs significant updates to handle groups correctly.
// For brevity, only the SQLite implementation is fully refactored here.
class WebDatabaseService implements IDatabaseService {
  private readonly STORAGE_KEY = 'markdown_kanban_data';
  private nextIds = {
    projects: 1,
    columns: 1,
    groups: 1, // Added groups ID counter
    cards: 1,
    subtasks: 1
  };

  constructor() {
    this.initDatabase();
  }

  private initDatabase(): void {
    const data = this.getData();

    // Find the highest IDs
    for (const project of data.projects) {
      this.nextIds.projects = Math.max(this.nextIds.projects, project.id + 1);

      const projectData = data.projectsData[project.id];
      if (projectData) {
        for (const column of projectData.columns) {
          this.nextIds.columns = Math.max(this.nextIds.columns, column.id + 1);
          // Iterate through groups to find max group ID
          for (const group of column.groups || []) {
             this.nextIds.groups = Math.max(this.nextIds.groups, group.id + 1);
             for (const card of group.cards) {
               this.nextIds.cards = Math.max(this.nextIds.cards, card.id + 1);
               for (const subtask of card.subtasks) {
                 this.nextIds.subtasks = Math.max(this.nextIds.subtasks, subtask.id + 1);
               }
             }
          }
          // Iterate through cards directly under column
          for (const card of column.cards) {
            this.nextIds.cards = Math.max(this.nextIds.cards, card.id + 1);
            for (const subtask of card.subtasks) {
              this.nextIds.subtasks = Math.max(this.nextIds.subtasks, subtask.id + 1);
            }
          }
        }
      }
    }

    console.log('Web database initialized successfully');
  }

  private getData(): {
    projects: Project[];
    projectsData: Record<number, ProjectData>;
  } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return { projects: [], projectsData: {} };
      }
      // Ensure groups array exists on columns
      const parsedData = JSON.parse(data);
      Object.values(parsedData.projectsData).forEach((pd: any) => {
        pd.columns.forEach((col: any) => {
          if (!col.groups) col.groups = [];
          if (!col.cards) col.cards = []; // Ensure cards array exists too
          col.groups.forEach((g: any) => {
             if (!g.cards) g.cards = [];
          });
        });
      });
      return parsedData;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return { projects: [], projectsData: {} };
    }
  }

  private saveData(data: { projects: Project[]; projectsData: Record<number, ProjectData> }): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  async createProjectWithColumns(name: string, content: string, columns: Column[]): Promise<ProjectData> {
    const now = new Date().toISOString();
    const data = this.getData();

    const project: Project = {
      id: this.nextIds.projects++,
      name,
      content,
      createdAt: now,
      updatedAt: now
    };

    const projectData: ProjectData = {
      project,
      columns: []
    };

    for (const column of columns) {
      const newColumn: Column = {
        id: this.nextIds.columns++,
        projectId: project.id,
        title: column.title,
        position: column.position,
        level: column.level || 0,
        createdAt: now,
        updatedAt: now,
        groups: [],
        cards: []
      };

      // Create groups
      for (const group of column.groups || []) {
         const newGroup: Group = {
           id: this.nextIds.groups++,
           columnId: newColumn.id,
           title: group.title,
           position: group.position,
           createdAt: now,
           updatedAt: now,
           cards: []
         };
         // Create cards for this group
         for (const card of group.cards) {
           const newCard: Card = {
             id: this.nextIds.cards++,
             columnId: newColumn.id,
             groupId: newGroup.id,
             text: card.text,
             completed: card.completed,
             position: card.position,
             createdAt: now,
             updatedAt: now,
             subtasks: []
           };
           // Create subtasks
           for (const subtask of card.subtasks) {
             newCard.subtasks.push({
               id: this.nextIds.subtasks++,
               cardId: newCard.id,
               text: subtask.text,
               completed: subtask.completed,
               position: subtask.position,
               createdAt: now,
               updatedAt: now
             });
           }
           newGroup.cards.push(newCard);
         }
         newColumn.groups.push(newGroup);
      }

      // Create cards directly under column
      for (const card of column.cards) {
        const newCard: Card = {
          id: this.nextIds.cards++,
          columnId: newColumn.id,
          groupId: undefined,
          text: card.text,
          completed: card.completed,
          position: card.position,
          createdAt: now,
          updatedAt: now,
          subtasks: []
        };
        // Create subtasks
        for (const subtask of card.subtasks) {
          newCard.subtasks.push({
            id: this.nextIds.subtasks++,
            cardId: newCard.id,
            text: subtask.text,
            completed: subtask.completed,
            position: subtask.position,
            createdAt: now,
            updatedAt: now
          });
        }
        newColumn.cards.push(newCard);
      }
      projectData.columns.push(newColumn);
    }

    data.projects.unshift(project);
    data.projectsData[project.id] = projectData;
    this.saveData(data);

    return projectData;
  }

  async createProject(name: string): Promise<ProjectData> {
    const now = new Date().toISOString();
    const data = this.getData();

    const project: Project = {
      id: this.nextIds.projects++,
      name,
      content: '',
      createdAt: now,
      updatedAt: now
    };

    const projectData: ProjectData = {
      project,
      columns: DEFAULT_PROJECT.columns.map((columnTemplate, columnIndex) => {
        const column: Column = {
          id: this.nextIds.columns++,
          projectId: project.id,
          title: columnTemplate.title,
          position: columnIndex,
          level: columnTemplate.level,
          createdAt: now,
          updatedAt: now,
          groups: [], // Default project has no groups
          cards: columnTemplate.cards.map((cardTemplate, cardIndex) => {
            const card: Card = {
              id: this.nextIds.cards++,
              columnId: 0, // Will be set after column ID is assigned
              groupId: undefined, // Default cards have no group
              text: cardTemplate.text,
              completed: cardTemplate.completed,
              position: cardIndex,
              createdAt: now,
              updatedAt: now,
              subtasks: cardTemplate.subtasks.map((subtaskTemplate, subtaskIndex) => ({
                id: this.nextIds.subtasks++,
                cardId: 0, // Will be set after card ID is assigned
                text: subtaskTemplate.text,
                completed: subtaskTemplate.completed,
                position: subtaskIndex,
                createdAt: now,
                updatedAt: now
              }))
            };
            // Set card IDs for subtasks
            card.subtasks.forEach(subtask => {
              subtask.cardId = card.id;
            });
            return card;
          })
        };
        // Set column IDs for cards
        column.cards.forEach(card => {
          card.columnId = column.id;
        });
        return column;
      })
    };

    data.projects.unshift(project);
    data.projectsData[project.id] = projectData;
    this.saveData(data);

    return projectData;
  }

  async getProjects(): Promise<Project[]> {
    const data = this.getData();
    return data.projects.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getProjectData(projectId: number): Promise<ProjectData> {
    const data = this.getData();
    const projectData = data.projectsData[projectId];
    if (!projectData) {
      throw new Error(`Project not found: ${projectId}`);
    }
    // Ensure groups/cards arrays exist
    projectData.columns.forEach(col => {
       if (!col.groups) col.groups = [];
       if (!col.cards) col.cards = [];
       col.groups.forEach(g => {
          if (!g.cards) g.cards = [];
       });
    });
    return projectData;
  }

  async updateProjectColumns(projectId: number, columns: Column[]): Promise<void> {
    const data = this.getData();
    const projectData = data.projectsData[projectId];

    if (!projectData) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const now = new Date().toISOString();

    // Delete existing columns/groups/cards/subtasks and re-insert with correct IDs
    projectData.columns = []; // Clear existing columns in the local copy
    delete data.projectsData[projectId]; // Remove old project data entry
    this.saveData(data); // Save removal

    // Re-create the project data with correct structure and IDs
    // This leverages the existing createProjectWithColumns logic which handles ID generation correctly
    const recreatedProjectData = await this.createProjectWithColumns(
        projectData.project.name,
        projectData.project.content || '', // Use existing content
        columns // Use the new column structure passed in
    );

    // Update the original project ID in the recreated data to maintain consistency if needed elsewhere
    // (Though typically the user would reload or select the project again)
    recreatedProjectData.project.id = projectId;
    data.projects = data.projects.map(p => p.id === projectId ? recreatedProjectData.project : p);
    data.projectsData[projectId] = recreatedProjectData;

    this.saveData(data);
  }

  async updateProject(project: Project): Promise<boolean> {
    const data = this.getData();
    const index = data.projects.findIndex(p => p.id === project.id);

    if (index === -1) return false;

    const now = new Date().toISOString();
    const updatedProject = {
      ...project,
      updatedAt: now
    };

    data.projects[index] = updatedProject;
    if (data.projectsData[project.id]) {
      data.projectsData[project.id].project = updatedProject;
      // Removed the logic that re-parses content and updates columns here.
      // That responsibility is handled by updateProjectColumns.
    }

    this.saveData(data);
    return true;
  }

  async deleteProject(id: number): Promise<boolean> {
    const data = this.getData();
    const index = data.projects.findIndex(p => p.id === id);

    if (index === -1) return false;

    data.projects.splice(index, 1);
    delete data.projectsData[id];

    this.saveData(data);
    return true;
  }

  async createColumn(column: Omit<Column, 'id' | 'createdAt' | 'updatedAt'>): Promise<Column> {
    const data = this.getData();
    const now = new Date().toISOString();

    const newColumn: Column = {
      id: this.nextIds.columns++,
      projectId: column.projectId,
      title: column.title,
      position: column.position,
      level: column.level || 0,
      createdAt: now,
      updatedAt: now,
      groups: [], // Start with empty groups
      cards: [] // Start with empty cards
    };

    const projectData = data.projectsData[column.projectId];
    if (!projectData) {
      throw new Error(`Project not found: ${column.projectId}`);
    }

    // Add groups if provided
    for (const group of column.groups || []) {
       const newGroup: Group = {
         id: this.nextIds.groups++,
         columnId: newColumn.id,
         title: group.title,
         position: group.position,
         createdAt: now,
         updatedAt: now,
         cards: [] // Groups start empty
       };
       newColumn.groups.push(newGroup);
    }
    // Add cards if provided
    for (const card of column.cards || []) {
       const newCard: Card = {
         id: this.nextIds.cards++,
         columnId: newColumn.id,
         groupId: undefined, // Direct card under column
         text: card.text,
         completed: card.completed,
         position: card.position,
         createdAt: now,
         updatedAt: now,
         subtasks: [] // Cards start empty
       };
       newColumn.cards.push(newCard);
    }


    projectData.columns.push(newColumn);
    this.saveData(data);
    return newColumn;
  }

  async updateColumn(column: Column): Promise<boolean> {
    const data = this.getData();
    const projectData = data.projectsData[column.projectId];
    if (!projectData) return false;

    const columnIndex = projectData.columns.findIndex(c => c.id === column.id);
    if (columnIndex === -1) return false;

    const now = new Date().toISOString();
    // Simple update, doesn't handle group/card changes within column update
    projectData.columns[columnIndex] = {
      ...projectData.columns[columnIndex], // Keep existing groups/cards
      ...column, // Update basic properties
      groups: column.groups || projectData.columns[columnIndex].groups, // Preserve or update groups
      cards: column.cards || projectData.columns[columnIndex].cards,   // Preserve or update cards
      updatedAt: now
    };

    this.saveData(data);
    return true;
  }

  async deleteColumn(id: number): Promise<boolean> {
    const data = this.getData();
    let found = false;

    for (const projectData of Object.values(data.projectsData)) {
      const columnIndex = projectData.columns.findIndex(c => c.id === id);
      if (columnIndex !== -1) {
        projectData.columns.splice(columnIndex, 1);
        found = true;
        break;
      }
    }

    if (found) {
      this.saveData(data);
    }
    return found;
  }

  async createCard(card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>): Promise<Card> {
    const data = this.getData();
    const now = new Date().toISOString();

    const newCard: Card = {
      id: this.nextIds.cards++,
      ...card,
      createdAt: now,
      updatedAt: now,
      subtasks: (card.subtasks || []).map(s => ({ // Create subtasks too
         ...s,
         id: this.nextIds.subtasks++,
         cardId: 0, // Will be set below
         createdAt: now,
         updatedAt: now
      }))
    };
    newCard.subtasks.forEach(s => s.cardId = newCard.id); // Set correct cardId

    let foundColumnOrGroup = false;
    for (const projectData of Object.values(data.projectsData)) {
      const column = projectData.columns.find(c => c.id === card.columnId);
      if (column) {
         if (card.groupId) {
           const group = column.groups.find(g => g.id === card.groupId);
           if (group) {
             group.cards.push(newCard);
             foundColumnOrGroup = true;
           }
         } else {
           column.cards.push(newCard);
           foundColumnOrGroup = true;
         }
      }
      if (foundColumnOrGroup) break;
    }

    if (!foundColumnOrGroup) {
      throw new Error(`Column ${card.columnId} or Group ${card.groupId} not found`);
    }

    this.saveData(data);
    return newCard;
  }

  async updateCard(card: Card): Promise<boolean> {
    const data = this.getData();
    let found = false;

    for (const projectData of Object.values(data.projectsData)) {
      for (const column of projectData.columns) {
         // Check cards directly under column
         let cardIndex = column.cards.findIndex(c => c.id === card.id);
         if (cardIndex !== -1) {
           const now = new Date().toISOString();
           column.cards[cardIndex] = {
             ...column.cards[cardIndex],
             ...card,
             updatedAt: now
             // TODO: Handle subtask updates
           };
           found = true;
           break;
         }
         // Check cards within groups
         for (const group of column.groups) {
            cardIndex = group.cards.findIndex(c => c.id === card.id);
            if (cardIndex !== -1) {
              const now = new Date().toISOString();
              group.cards[cardIndex] = {
                ...group.cards[cardIndex],
                ...card,
                updatedAt: now
                // TODO: Handle subtask updates
              };
              found = true;
              break;
            }
         }
         if (found) break;
      }
      if (found) break;
    }

    if (found) {
      this.saveData(data);
    }
    return found;
  }

  async deleteCard(id: number): Promise<boolean> {
    const data = this.getData();
    let found = false;

    for (const projectData of Object.values(data.projectsData)) {
      for (const column of projectData.columns) {
         // Check cards directly under column
         let cardIndex = column.cards.findIndex(c => c.id === id);
         if (cardIndex !== -1) {
           column.cards.splice(cardIndex, 1);
           found = true;
           break;
         }
         // Check cards within groups
         for (const group of column.groups) {
            cardIndex = group.cards.findIndex(c => c.id === id);
            if (cardIndex !== -1) {
              group.cards.splice(cardIndex, 1);
              found = true;
              break;
            }
         }
         if (found) break;
      }
      if (found) break;
    }

    if (found) {
      this.saveData(data);
    }
    return found;
  }

  async createSubtask(subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subtask> {
    const data = this.getData();
    const now = new Date().toISOString();

    const newSubtask: Subtask = {
      id: this.nextIds.subtasks++,
      ...subtask,
      createdAt: now,
      updatedAt: now
    };

    let foundCard = false;
    for (const projectData of Object.values(data.projectsData)) {
      for (const column of projectData.columns) {
         // Check cards directly under column
         let card = column.cards.find(c => c.id === subtask.cardId);
         if (card) {
           if (!card.subtasks) card.subtasks = [];
           card.subtasks.push(newSubtask);
           foundCard = true;
           break;
         }
         // Check cards within groups
         for (const group of column.groups) {
            card = group.cards.find(c => c.id === subtask.cardId);
            if (card) {
              if (!card.subtasks) card.subtasks = [];
              card.subtasks.push(newSubtask);
              foundCard = true;
              break;
            }
         }
         if (foundCard) break;
      }
      if (foundCard) break;
    }

    if (!foundCard) {
      throw new Error(`Card not found: ${subtask.cardId}`);
    }

    this.saveData(data);
    return newSubtask;
  }

  async updateSubtask(subtask: Subtask): Promise<boolean> {
    const data = this.getData();
    let found = false;

    for (const projectData of Object.values(data.projectsData)) {
      for (const column of projectData.columns) {
         // Check cards directly under column
         let card = column.cards.find(c => c.id === subtask.cardId);
         if (card && card.subtasks) {
           const subtaskIndex = card.subtasks.findIndex(s => s.id === subtask.id);
           if (subtaskIndex !== -1) {
             const now = new Date().toISOString();
             card.subtasks[subtaskIndex] = {
               ...card.subtasks[subtaskIndex],
               ...subtask,
               updatedAt: now
             };
             found = true;
             break;
           }
         }
         // Check cards within groups
         for (const group of column.groups) {
            card = group.cards.find(c => c.id === subtask.cardId);
            if (card && card.subtasks) {
              const subtaskIndex = card.subtasks.findIndex(s => s.id === subtask.id);
              if (subtaskIndex !== -1) {
                const now = new Date().toISOString();
                card.subtasks[subtaskIndex] = {
                  ...card.subtasks[subtaskIndex],
                  ...subtask,
                  updatedAt: now
                };
                found = true;
                break;
              }
            }
         }
         if (found) break;
      }
      if (found) break;
    }

    if (found) {
      this.saveData(data);
    }
    return found;
  }

  async deleteSubtask(id: number): Promise<boolean> {
    const data = this.getData();
    let found = false;

    for (const projectData of Object.values(data.projectsData)) {
      for (const column of projectData.columns) {
         // Check cards directly under column
         let card = column.cards.find(c => c.subtasks?.some(s => s.id === id));
         if (card && card.subtasks) {
           const subtaskIndex = card.subtasks.findIndex(s => s.id === id);
           if (subtaskIndex !== -1) {
             card.subtasks.splice(subtaskIndex, 1);
             found = true;
             break;
           }
         }
         // Check cards within groups
         for (const group of column.groups) {
            card = group.cards.find(c => c.subtasks?.some(s => s.id === id));
            if (card && card.subtasks) {
              const subtaskIndex = card.subtasks.findIndex(s => s.id === id);
              if (subtaskIndex !== -1) {
                card.subtasks.splice(subtaskIndex, 1);
                found = true;
                break;
              }
            }
         }
         if (found) break;
      }
      if (found) break;
    }

    if (found) {
      this.saveData(data);
    }
    return found;
  }

  async resetDatabase(): Promise<void> {
    console.log('Resetting Web localStorage database...');
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      // Reset ID counters
      this.nextIds = {
        projects: 1,
        columns: 1,
        groups: 1,
        cards: 1,
        subtasks: 1
      };
      // Re-initialize (might be minimal effect after removal, but good practice)
      this.initDatabase();
      console.log('Web database reset.');
      return Promise.resolve();
    } catch (error) {
      console.error('Error resetting web database:', error);
      return Promise.reject(error);
    }
  }
}


// Create the appropriate database service based on platform
class DatabaseService implements IDatabaseService {
  private service: IDatabaseService;

  constructor() {
    // Use the appropriate implementation based on platform
    if (Platform.OS === 'web') {
      this.service = new WebDatabaseService();
    } else {
      this.service = new SQLiteDatabaseService();
    }
  }

  async createProjectWithColumns(name: string, content: string, columns: Column[]): Promise<ProjectData> {
    return this.service.createProjectWithColumns(name, content, columns);
  }

  async createProject(name: string): Promise<ProjectData> {
    return this.service.createProject(name);
  }

  async getProjects(): Promise<Project[]> {
    return this.service.getProjects();
  }

  async getProjectData(projectId: number): Promise<ProjectData> {
    return this.service.getProjectData(projectId);
  }

  async updateProject(project: Project): Promise<boolean> {
    return this.service.updateProject(project);
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.service.deleteProject(id);
  }

  async updateProjectColumns(projectId: number, columns: Column[]): Promise<void> {
    return this.service.updateProjectColumns(projectId, columns);
  }

  async createColumn(column: Omit<Column, 'id' | 'createdAt' | 'updatedAt'>): Promise<Column> {
    return this.service.createColumn(column);
  }

  async updateColumn(column: Column): Promise<boolean> {
    return this.service.updateColumn(column);
  }

  async deleteColumn(id: number): Promise<boolean> {
    return this.service.deleteColumn(id);
  }

  async createCard(card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>): Promise<Card> {
    return this.service.createCard(card);
  }

  async updateCard(card: Card): Promise<boolean> {
    return this.service.updateCard(card);
  }

  async deleteCard(id: number): Promise<boolean> {
    return this.service.deleteCard(id);
  }

  async createSubtask(subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subtask> {
    return this.service.createSubtask(subtask);
  }

  async updateSubtask(subtask: Subtask): Promise<boolean> {
    return this.service.updateSubtask(subtask);
  }

  async deleteSubtask(id: number): Promise<boolean> {
    return this.service.deleteSubtask(id);
  }

  async resetDatabase(): Promise<void> {
    return this.service.resetDatabase();
  }
}

// Export a singleton instance
export const databaseService = new DatabaseService();

// Expose for development debugging ONLY
if (__DEV__) {
  // Use a unique name to avoid potential conflicts
  (global as any).devDatabaseService = databaseService;
  console.log('Database service exposed globally as "devDatabaseService" for debugging.');
}
