declare module 'expo-sqlite' {
  export interface SQLiteDatabase {
    transaction(
      callback: (tx: SQLiteTransaction) => void,
      error?: (error: Error) => void,
      success?: () => void
    ): void;
  }

  export interface SQLiteTransaction {
    executeSql(
      sqlStatement: string,
      args?: any[],
      success?: (tx: SQLiteTransaction, resultSet: SQLResultSet) => void,
      error?: (tx: SQLiteTransaction, error: Error) => boolean
    ): void;
  }

  export interface SQLResultSet {
    insertId?: number;
    rowsAffected: number;
    rows: {
      length: number;
      item(index: number): any;
    };
  }

  export function openDatabase(
    name: string,
    version?: string,
    description?: string,
    size?: number,
    callback?: (db: SQLiteDatabase) => void
  ): SQLiteDatabase;
}
