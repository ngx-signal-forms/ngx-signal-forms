import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  FormField,
  applyEach,
  form,
  required,
  schema,
  submit,
} from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxOutlinedFormField } from '@ngx-signal-forms/toolkit/form-field';

interface Task {
  id: number;
  title: string;
}

interface TasksModel {
  teamName: string;
  tasks: Task[];
}

const tasksSchema = schema<TasksModel>((path) => {
  required(path.teamName, { message: 'Team name is required' });
  applyEach(path.tasks, (task) => {
    required(task.title, { message: 'Task title is required' });
  });
});

@Component({
  selector: 'ngx-dynamic-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxOutlinedFormField],
  template: `
    <div class="p-6">
      <h2 class="mb-4 text-2xl font-bold">Dynamic List Demo</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Manage a dynamic list of tasks.
      </p>

      <form
        [ngxSignalForm]="tasksForm"
        (submit)="saveTasks($event)"
        class="max-w-2xl space-y-6"
      >
        <!-- Team Name -->
        <ngx-signal-form-field [formField]="tasksForm.teamName" outline>
          <label for="teamName">Team Name</label>
          <input
            id="teamName"
            type="text"
            [formField]="tasksForm.teamName"
            placeholder="Enter team name"
            class="form-input"
          />
        </ngx-signal-form-field>

        <!-- Tasks List -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Tasks</h3>
            <button
              type="button"
              (click)="addTask()"
              class="rounded bg-green-100 px-3 py-1 text-sm text-green-700 hover:bg-green-200"
            >
              + Add Task
            </button>
          </div>

          @for (
            task of tasksForm.tasks().value();
            track task.id;
            let i = $index
          ) {
            <div
              class="flex items-start gap-4 rounded-lg border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <span class="mt-3 text-sm font-medium text-gray-500"
                >#{{ i + 1 }}</span
              >

              <div class="flex-1">
                <ngx-signal-form-field
                  [formField]="tasksForm.tasks[i].title"
                  outline
                >
                  <label [for]="'task-' + i">Task Title</label>
                  <input
                    [id]="'task-' + i"
                    type="text"
                    [formField]="tasksForm.tasks[i].title"
                    placeholder="What needs to be done?"
                    class="form-input"
                  />
                </ngx-signal-form-field>
              </div>

              <button
                type="button"
                (click)="removeTask(i)"
                class="mt-2 rounded p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                aria-label="Remove task"
              >
                ✕
              </button>
            </div>
          }

          @if (tasksForm.tasks().value().length === 0) {
            <div
              class="rounded-lg border-2 border-dashed p-8 text-center text-gray-500"
            >
              No tasks yet. Add one to get started!
            </div>
          }
        </div>

        <!-- Actions -->
        <div class="flex gap-4 border-t pt-4">
          <button
            type="submit"
            class="btn-primary"
            [disabled]="tasksForm().pending()"
          >
            @if (tasksForm().pending()) {
              Saving...
            } @else {
              Save Tasks
            }
          </button>

          <button type="button" (click)="resetForm()" class="btn-secondary">
            Reset
          </button>
        </div>

        <!-- Debug Info -->
        <div
          class="mt-8 rounded bg-gray-100 p-4 font-mono text-xs dark:bg-gray-800"
        >
          <div>Count: {{ tasksForm.tasks().value().length }}</div>
          <div>Valid: {{ tasksForm().valid() }}</div>
        </div>
      </form>
    </div>
  `,
})
export class DynamicListComponent {
  readonly #initialData: TasksModel = {
    teamName: '',
    tasks: [{ id: 1, title: 'Initial Task' }],
  };

  readonly #model = signal<TasksModel>(this.#initialData);

  readonly tasksForm = form(this.#model, tasksSchema);

  addTask(): void {
    this.#model.update((data) => ({
      ...data,
      tasks: [...data.tasks, { id: Date.now(), title: '' }],
    }));
  }

  removeTask(index: number): void {
    this.#model.update((data) => ({
      ...data,
      tasks: data.tasks.filter((_, i) => i !== index),
    }));
  }

  protected async saveTasks(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.tasksForm, async (data) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Saved tasks:', data());
      return null;
    });
  }

  protected resetForm(): void {
    this.tasksForm().reset();
    this.#model.set(this.#initialData);
  }
}
