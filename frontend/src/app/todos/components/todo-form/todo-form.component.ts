import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';

/** Limite de caracteres do título (espelha a validação do backend: max:255). */
export const TITLE_MAX_LENGTH = 255;

@Component({
  selector: 'app-todo-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './todo-form.component.html',
  styleUrl: './todo-form.component.scss',
})
export class TodoFormComponent {
  readonly add = output<string>();

  readonly maxLength = TITLE_MAX_LENGTH;
  readonly title = signal('');
  readonly submitted = signal(false);

  readonly trimmed = computed(() => this.title().trim());
  readonly length = computed(() => this.title().length);
  readonly isEmpty = computed(() => this.trimmed().length === 0);
  readonly isOverLimit = computed(() => this.length() > this.maxLength);
  readonly isValid = computed(() => !this.isEmpty() && !this.isOverLimit());

  /** Motivo do bloqueio do botão (tooltip no hover). `null` quando válido. */
  readonly blockReason = computed<string | null>(() => {
    if (this.isOverLimit()) {
      return `O título passou de ${this.maxLength} caracteres (${this.length()}).`;
    }
    if (this.isEmpty()) {
      return 'Informe um título para a tarefa.';
    }
    return null;
  });

  /**
   * Mensagem exibida abaixo do campo: o excesso de caracteres avisa na hora;
   * o "obrigatório" só aparece depois de uma tentativa de envio.
   */
  readonly errorMessage = computed<string | null>(() => {
    if (this.isOverLimit()) {
      return `O título passou do limite de ${this.maxLength} caracteres (${this.length()}/${this.maxLength}).`;
    }
    if (this.submitted() && this.isEmpty()) {
      return 'Informe um título para a tarefa.';
    }
    return null;
  });

  submit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);

    if (!this.isValid()) {
      return;
    }

    this.add.emit(this.trimmed());
    this.title.set('');
    this.submitted.set(false);
  }
}
