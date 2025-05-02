export interface Task {
  id: string;
  text: string;
  completed: boolean;
  subtasks: Task[];
  indentation: number; // To track nesting level
}

export interface TaskGroup {
  id: string;
  heading: string;
  level: number;
  tasks: Task[];
}
