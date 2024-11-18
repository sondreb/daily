import { Component, OnInit } from '@angular/core';
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
export class AppComponent implements OnInit {
  deferredPrompt: any;
  showInstallButton = false;
  newTaskTitle = '';
  currentTasks: DailyTasks | null = null;
  history: DailyTasks[] = [];

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
}
