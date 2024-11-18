export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string; // ISO date string
}

export interface DailyTasks {
  date: string;
  tasks: Task[];
}
