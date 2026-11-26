import { Component, inject, signal } from '@angular/core';
import { SessionStore } from '../../core/state/session.store';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css',
})
export class AppHeaderComponent {
  protected readonly session = inject(SessionStore);
  protected readonly showPrivateDetails = signal<boolean>(false);

  protected selectUser(userId: string): void {
    this.session.selectUser(userId);
  }

  protected togglePrivateDetails(): void {
    this.showPrivateDetails.update((v) => !v);
  }
}
