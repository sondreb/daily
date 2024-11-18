import { Injectable } from '@angular/core';
import { Task, DailyTasks } from '../models/task';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly STORAGE_KEY = 'daily-tasks';
  private tasksSubject = new BehaviorSubject<DailyTasks | null>(null);
  private historySubject = new BehaviorSubject<DailyTasks[]>([]);

  constructor() {
    this.loadTasks();
    this.checkForNewDay();
    setInterval(() => this.checkForNewDay(), 60000); // Check every minute
  }

  private loadTasks() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      this.tasksSubject.next(data.current);
      this.historySubject.next(data.history);
    }
  }

  private saveTasks() {
    const data = {
      current: this.tasksSubject.value,
      history: this.historySubject.value
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private checkForNewDay() {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const current = this.tasksSubject.value;

    if (!current || current.date !== currentDate) {
      if (current) {
        this.historySubject.next([current, ...this.historySubject.value]);
      }
      this.tasksSubject.next({ date: currentDate, tasks: [] });
      this.saveTasks();
    }
  }

  getTasks(): Observable<DailyTasks | null> {
    return this.tasksSubject.asObservable();
  }

  getHistory(): Observable<DailyTasks[]> {
    return this.historySubject.asObservable();
  }

  addTask(title: string): boolean {
    const current = this.tasksSubject.value;
    if (!current || current.tasks.length >= 3) return false;

    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
      date: new Date().toISOString()
    };

    current.tasks.push(newTask);
    this.tasksSubject.next(current);
    this.saveTasks();
    return true;
  }

  toggleTask(taskId: string) {
    const current = this.tasksSubject.value;
    if (!current) return;

    const task = current.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.tasksSubject.next(current);
      this.saveTasks();
    }
  }
}
