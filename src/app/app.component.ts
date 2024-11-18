import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from './services/task.service';
import { DailyTasks, Task } from './models/task';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, AfterViewChecked {
  deferredPrompt: any;
  showInstallButton = false;
  newTaskTitle = '';
  currentTasks: DailyTasks | null = null;
  editingTaskId: string | null = null;
  editingTaskText: string = '';
  selectedDate: string = '';
  @ViewChild('editInput') editInput?: ElementRef;
  private shouldFocus = false;

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    // PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton = true;
    });

    // Subscribe to tasks
    this.taskService.getTasks().subscribe(tasks => {
      this.currentTasks = tasks;
    });

    this.taskService.getSelectedDate().subscribe(date => {
      this.selectedDate = date;
    });
  }

  addTask() {
    if (!this.newTaskTitle.trim()) return;
    if (this.taskService.addTask(this.newTaskTitle)) {
      this.newTaskTitle = '';
    }
  }

  toggleTask(taskId: string) {
    this.taskService.toggleTask(taskId);
  }

  async installPwa() {
    if (!this.deferredPrompt) return;
    
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      this.showInstallButton = false;
    }
    this.deferredPrompt = null;
  }

  startEditing(task: Task) {
    this.editingTaskId = task.id;
    this.editingTaskText = task.title;
    this.shouldFocus = true;
  }

  ngAfterViewChecked() {
    if (this.shouldFocus && this.editInput) {
      this.editInput.nativeElement.focus();
      this.shouldFocus = false;
    }
  }

  saveEdit() {
    if (!this.editingTaskId || !this.editingTaskText.trim()) {
      this.editingTaskId = null;
      return;
    }
    this.taskService.updateTask(this.editingTaskId, this.editingTaskText);
    this.editingTaskId = null;
  }

  cancelEdit() {
    this.editingTaskId = null;
  }

  navigateDay(offset: number) {
    const date = new Date(this.selectedDate);
    date.setDate(date.getDate() + offset);
    this.taskService.navigateToDate(date.toISOString().split('T')[0]);
  }

  formatDate(date: string): string {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return d.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  isNextDisabled(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const selectedDate = new Date(this.selectedDate);
    selectedDate.setHours(0, 0, 0, 0);
    
    return selectedDate.getTime() >= tomorrow.getTime();
  }
}
