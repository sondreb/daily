import { Injectable } from '@angular/core';
import { Task, DailyTasks } from '../models/task';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly STORAGE_PREFIX = 'daily-tasks-';
  private tasksSubject = new BehaviorSubject<DailyTasks | null>(null);
  private selectedDateSubject = new BehaviorSubject<string>(new Date().toISOString().split('T')[0]);

  constructor() {
    const today = new Date().toISOString().split('T')[0];
    this.selectedDateSubject.next(today);
    this.loadTasks(today);
    this.checkForNewDay();
    setInterval(() => this.checkForNewDay(), 60000);
  }

  private getStorageKey(date: string): string {
    return `${this.STORAGE_PREFIX}${date}`;
  }

  private loadTasks(date: string) {
    const stored = localStorage.getItem(this.getStorageKey(date));
    
    if (stored) {
      this.tasksSubject.next(JSON.parse(stored));
    } else {
      this.tasksSubject.next({ date, tasks: [] });
    }
  }

  private saveTasks(tasks: DailyTasks) {
    localStorage.setItem(this.getStorageKey(tasks.date), JSON.stringify(tasks));
  }

  private checkForNewDay() {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const selectedDate = this.selectedDateSubject.value;

    if (selectedDate !== currentDate) {
      this.selectedDateSubject.next(currentDate);
      this.loadTasks(currentDate);
    }
  }

  getTasks(): Observable<DailyTasks | null> {
    return this.tasksSubject.asObservable();
  }

  getSelectedDate(): Observable<string> {
    return this.selectedDateSubject.asObservable();
  }

  navigateToDate(date: string) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
    
    if (date > tomorrow) return;
    
    this.selectedDateSubject.next(date);
    this.loadTasks(date);
  }

  addTask(title: string): boolean {
    const current = this.tasksSubject.value;
    if (!current || current.tasks.length >= 3) return false;

    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
      date: current.date
    };

    const updatedTasks = {
      ...current,
      tasks: [...current.tasks, newTask]
    };

    this.tasksSubject.next(updatedTasks);
    this.saveTasks(updatedTasks);
    return true;
  }

  toggleTask(taskId: string) {
    const current = this.tasksSubject.value;
    if (!current) return;

    const updatedTasks = {
      ...current,
      tasks: current.tasks.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed }
          : task
      )
    };

    this.tasksSubject.next(updatedTasks);
    this.saveTasks(updatedTasks);
  }

  updateTask(taskId: string, newTitle: string) {
    const current = this.tasksSubject.value;
    if (!current) return;

    const updatedTasks = {
      ...current,
      tasks: current.tasks.map(task =>
        task.id === taskId
          ? { ...task, title: newTitle }
          : task
      )
    };

    this.tasksSubject.next(updatedTasks);
    this.saveTasks(updatedTasks);
  }
}
