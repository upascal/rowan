import { Platform } from 'react-native';
import { Project, Column, Card, Subtask, ProjectData } from '../types';
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
}

// Default template for new projects
export const DEFAULT_PROJECT = {
  name: 'New Project',
  columns: [
    {
      title: 'To Do',
      position: 0,
      level: 0,
      cards: [
        {
          text: 'Task 1',
          completed: false,
          position: 0,
          groupName: '',
          subtasks: [] as { text: string; completed: boolean; position: number }[]
        },
        {
          text: 'Task 2',
          completed: false,
          position: 1,
          groupName: '',
          subtasks: [] as { text: string; completed: boolean; position: number }[]
        }
      ]
    },
    {
      title: 'In Progress',
      position: 1,
      level: 0,
      cards: [
        {
          text: 'Task in progress',
          completed: false,
          position: 0,
          groupName: '',
          subtasks: [] as { text: string; completed: boolean; position: number }[]
        }
      ]
    },
    {
      title: 'Done',
      position: 2,
      level: 0,
      cards: [
        {
          text: 'Completed task',
          completed: true,
          position: 0,
          groupName: '',
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

      // Create cards table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS cards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          column_id INTEGER NOT NULL,
          text TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT 0,
          position INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          group_name TEXT NOT NULL,
          FOREIGN KEY (column_id) REFERENCES columns (id) ON DELETE CASCADE
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

            const newColumn: Column = {
              ...column,
              id: parseInt(columnResult.insertId),
              projectId,
              createdAt: now,
              updatedAt: now,
              cards: []
            };

            // Insert cards
            for (const card of column.cards) {
              const [cardResult] = await this.executeSql(tx,
                    'INSERT INTO cards (column_id, text, completed, position, group_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [newColumn.id, card.text, card.completed, card.position, card.groupName || '', now, now]
              );

              const newCard: Card = {
                ...card,
                id: parseInt(cardResult.insertId),
                columnId: newColumn.id,
                groupName: card.groupName || '',
                createdAt: now,
                updatedAt: now,
                subtasks: []
              };

              // Insert subtasks
              for (const subtask of card.subtasks) {
                const [subtaskResult] = await this.executeSql(tx,
                  'INSERT INTO subtasks (card_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                  [newCard.id, subtask.text, subtask.completed, subtask.position, now, now]
                );

                newCard.subtasks.push({
                  ...subtask,
                  id: subtaskResult.insertId,
                  cardId: newCard.id,
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

      const column: Column & { cards: (Card & { subtasks: Subtask[] })[] } = {
              id: parseInt(columnResult.insertId),
        projectId: project.id,
        title: columnTemplate.title,
        position: columnTemplate.position,
        level: columnTemplate.level,
        createdAt: now,
        updatedAt: now,
        cards: []
      };

      // Create cards for this column
      for (const cardTemplate of columnTemplate.cards) {
          const [cardResult] = await this.executeSql(tx,
            'INSERT INTO cards (column_id, text, completed, position, group_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [column.id, cardTemplate.text, cardTemplate.completed, cardTemplate.position, cardTemplate.groupName || '', now, now]
          );

          const card: Card & { subtasks: Subtask[] } = {
              id: parseInt(cardResult.insertId),
            columnId: column.id,
            text: cardTemplate.text,
            completed: cardTemplate.completed,
            position: cardTemplate.position,
            groupName: cardTemplate.groupName || '',
            createdAt: now,
            updatedAt: now,
            subtasks: []
          };

        // Create subtasks for this card
        for (const subtaskTemplate of cardTemplate.subtasks) {
          const [subtaskResult] = await this.executeSql(tx,
            'INSERT INTO subtasks (card_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [card.id, subtaskTemplate.text, subtaskTemplate.completed, subtaskTemplate.position, now, now]
          );

          const subtask: Subtask = {
            id: subtaskResult.insertId,
            cardId: card.id,
            text: subtaskTemplate.text,
            completed: subtaskTemplate.completed,
            position: subtaskTemplate.position,
            createdAt: now,
            updatedAt: now
          };

          card.subtasks.push(subtask);
        }

        column.cards.push(card);
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

          const columns: (Column & { cards: (Card & { subtasks: Subtask[] })[] })[] = [];
          
          for (let i = 0; i < columnsResult.rows.length; i++) {
            const columnRow = columnsResult.rows.item(i);
            
            // Get cards for this column
            const [cardsResult] = await this.executeSql(tx,
              'SELECT * FROM cards WHERE column_id = ? ORDER BY position',
              [columnRow.id]
            );

            const cards: (Card & { subtasks: Subtask[] })[] = [];
            
            for (let j = 0; j < cardsResult.rows.length; j++) {
              const cardRow = cardsResult.rows.item(j);
              
              // Get subtasks for this card
              const [subtasksResult] = await this.executeSql(tx,
                'SELECT * FROM subtasks WHERE card_id = ? ORDER BY position',
                [cardRow.id]
              );

              const subtasks: Subtask[] = [];
              
              for (let k = 0; k < subtasksResult.rows.length; k++) {
                const subtaskRow = subtasksResult.rows.item(k);
                subtasks.push({
                  id: parseInt(subtaskRow.id),
                  cardId: cardRow.id,
                  text: subtaskRow.text,
                  completed: Boolean(subtaskRow.completed),
                  position: subtaskRow.position,
                  createdAt: subtaskRow.created_at,
                  updatedAt: subtaskRow.updated_at
                });
              }

              cards.push({
                id: parseInt(cardRow.id),
                columnId: parseInt(columnRow.id),
                text: cardRow.text,
                completed: Boolean(cardRow.completed),
                position: cardRow.position,
                groupName: cardRow.group_name,
                createdAt: cardRow.created_at,
                updatedAt: cardRow.updated_at,
                subtasks
              });
            }

            columns.push({
              id: parseInt(columnRow.id),
              projectId: project.id,
              title: columnRow.title,
              position: columnRow.position,
              level: columnRow.level,
              createdAt: columnRow.created_at,
              updatedAt: columnRow.updated_at,
              cards
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
          // Delete existing columns
          await this.executeSql(tx,
            'DELETE FROM columns WHERE project_id = ?',
            [projectId]
          );

          // Insert new columns
          for (const column of columns) {
            await this.executeSql(tx,
              `INSERT INTO columns 
              (project_id, title, position, level, created_at, updated_at) 
              VALUES (?, ?, ?, ?, ?, ?)`,
              [projectId, column.title, column.position, column.level || 0, now, now]
            );
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

          // If markdown content exists, parse it and update the kanban structure
          if (project.content) {
            // Delete existing columns and cards
            await this.executeSql(tx,
              'DELETE FROM columns WHERE project_id = ?',
              [project.id]
            );

            // Parse markdown and create new structure
            const parsedData = await parseMarkdownToProjectData(project.content, project.name);
            if (parsedData) {
              for (const column of parsedData.columns) {
                // Create new column
                const [columnResult] = await this.executeSql(tx,
                  'INSERT INTO columns (project_id, title, position, level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                  [project.id, column.title, column.position, column.level || 0, now, now]
                );

                // Create cards for this column
                for (const card of column.cards) {
                  const [cardResult] = await this.executeSql(tx,
                    'INSERT INTO cards (column_id, text, completed, position, group_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [columnResult.insertId, card.text, card.completed, card.position, card.groupName || '', now, now]
                  );

                  // Create subtasks for this card
                  for (const subtask of card.subtasks) {
                    await this.executeSql(tx,
                      'INSERT INTO subtasks (card_id, text, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                      [cardResult.insertId, subtask.text, subtask.completed, subtask.position, now, now]
                    );
                  }
                }
              }
            }
          }

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
            [column.projectId, column.title, column.position, 0, now, now]
          );
          
          resolve({
            id: parseInt(result.insertId),
            ...column,
            level: 0, // Default level
            createdAt: now,
            updatedAt: now
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
          const [result] = await this.executeSql(tx,
            'UPDATE columns SET title = ?, position = ?, updated_at = ? WHERE id = ?',
            [column.title, column.position, now, column.id]
          );
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
            'INSERT INTO cards (column_id, text, completed, position, created_at, updated_at, group_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [card.columnId, card.text, card.completed, card.position, now, now, card.groupName]
          );
          
          resolve({
            id: parseInt(result.insertId),
            ...card,
            createdAt: now,
            updatedAt: now
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
          'UPDATE cards SET text = ?, completed = ?, position = ?, group_name = ?, updated_at = ? WHERE id = ?',
          [card.text, card.completed, card.position, card.groupName, now, card.id]
          );
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
          return false;
        }
      );
    });
  }
}

// LocalStorage implementation for web platform
class WebDatabaseService implements IDatabaseService {
  private readonly STORAGE_KEY = 'markdown_kanban_data';
  private nextIds = {
    projects: 1,
    columns: 1,
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
      return JSON.parse(data);
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
      const newColumn: Column & { cards: (Card & { subtasks: Subtask[] })[] } = {
        id: this.nextIds.columns++,
        projectId: project.id,
        title: column.title,
        position: column.position,
        level: column.level || 0,
        createdAt: now,
        updatedAt: now,
        cards: []
      };

      for (const card of column.cards) {
              const newCard: Card & { subtasks: Subtask[] } = {
                id: this.nextIds.cards++,
                columnId: newColumn.id,
                text: card.text,
                completed: card.completed,
                position: card.position,
                groupName: card.groupName || '',
                createdAt: now,
                updatedAt: now,
                subtasks: []
              };

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
        const column: Column & { cards: (Card & { subtasks: Subtask[] })[] } = {
          id: this.nextIds.columns++,
          projectId: project.id,
          title: columnTemplate.title,
          position: columnIndex,
          level: columnTemplate.level,
          createdAt: now,
          updatedAt: now,
          cards: columnTemplate.cards.map((cardTemplate, cardIndex) => {
            const card: Card & { subtasks: Subtask[] } = {
              id: this.nextIds.cards++,
              columnId: 0, // Will be set after column ID is assigned
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
    return projectData;
  }
  
  async updateProjectColumns(projectId: number, columns: Column[]): Promise<void> {
    const data = this.getData();
    const projectData = data.projectsData[projectId];
    
    if (!projectData) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const now = new Date().toISOString();
    
    // Update columns with new timestamps
    const updatedColumns = columns.map(column => ({
      ...column,
      createdAt: now,
      updatedAt: now,
      cards: column.cards || []
    }));

    projectData.columns = updatedColumns;
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
      ...column,
      level: 0, // Default level
      createdAt: now,
      updatedAt: now
    };
    
    const projectData = data.projectsData[column.projectId];
    if (!projectData) {
      throw new Error(`Project not found: ${column.projectId}`);
    }
    
    projectData.columns.push({
      ...newColumn,
      cards: []
    });
    
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
    const updatedColumn = {
      ...projectData.columns[columnIndex],
      ...column,
      updatedAt: now
    };
    
    projectData.columns[columnIndex] = updatedColumn;
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
      updatedAt: now
    };
    
    let found = false;
    for (const projectData of Object.values(data.projectsData)) {
      const column = projectData.columns.find(c => c.id === card.columnId);
      if (column) {
        column.cards.push({
          ...newCard,
          subtasks: []
        });
        found = true;
        break;
      }
    }
    
    if (!found) {
      throw new Error(`Column not found: ${card.columnId}`);
    }
    
    this.saveData(data);
    return newCard;
  }
  
  async updateCard(card: Card): Promise<boolean> {
    const data = this.getData();
    let found = false;
    
    for (const projectData of Object.values(data.projectsData)) {
      for (const column of projectData.columns) {
        const cardIndex = column.cards.findIndex(c => c.id === card.id);
        if (cardIndex !== -1) {
          const now = new Date().toISOString();
          const updatedCard = {
            ...column.cards[cardIndex],
            ...card,
            updatedAt: now
          };
          column.cards[cardIndex] = updatedCard;
          found = true;
          break;
        }
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
        const cardIndex = column.cards.findIndex(c => c.id === id);
        if (cardIndex !== -1) {
          column.cards.splice(cardIndex, 1);
          found = true;
          break;
        }
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
    
    let found = false;
    for (const projectData of Object.values(data.projectsData)) {
      for (const column of projectData.columns) {
        const card = column.cards.find(c => c.id === subtask.cardId);
        if (card) {
          card.subtasks.push(newSubtask);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    
    if (!found) {
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
        for (const card of column.cards) {
          const subtaskIndex = card.subtasks.findIndex(s => s.id === subtask.id);
          if (subtaskIndex !== -1) {
            const now = new Date().toISOString();
            const updatedSubtask = {
              ...card.subtasks[subtaskIndex],
              ...subtask,
              updatedAt: now
            };
            card.subtasks[subtaskIndex] = updatedSubtask;
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
  
  async deleteSubtask(id: number): Promise<boolean> {
    const data = this.getData();
    let found = false;
    
    for (const projectData of Object.values(data.projectsData)) {
      for (const column of projectData.columns) {
        for (const card of column.cards) {
          const subtaskIndex = card.subtasks.findIndex(s => s.id === id);
          if (subtaskIndex !== -1) {
            card.subtasks.splice(subtaskIndex, 1);
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
}

// Export a singleton instance
export const databaseService = new DatabaseService();
