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
  history: DailyTasks[] = [];
  editingTaskId: string | null = null;
  editingTaskText: string = '';
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

    this.taskService.getHistory().subscribe(history => {
      this.history = history;
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
}
