import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type MetricCardColor = 'blue' | 'green' | 'orange' | 'red' | 'purple';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="metric-card" [attr.data-color]="color">
      <div class="metric-icon-wrapper">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <div class="metric-body">
        <span class="metric-value">{{ value }}</span>
        <span class="metric-title">{{ title }}</span>
        @if (subtitle) {
          <span class="metric-subtitle">{{ subtitle }}</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .metric-card {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
      transition: box-shadow 0.2s, transform 0.2s;
      overflow: hidden;
    }
    .metric-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }
    .metric-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .metric-icon-wrapper mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .metric-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
      overflow: hidden;
    }
    .metric-value {
      font-size: 20px;
      font-weight: 700;
      color: #1a1f36;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .metric-title {
      font-size: 13px;
      font-weight: 500;
      color: #718096;
      white-space: nowrap;
    }
    .metric-subtitle {
      font-size: 11px;
      color: #a0aec0;
    }

    /* Color variants */
    [data-color="blue"] .metric-icon-wrapper { background: rgba(79,142,247,0.12); }
    [data-color="blue"] .metric-icon-wrapper mat-icon { color: #4f8ef7; }

    [data-color="green"] .metric-icon-wrapper { background: rgba(56,178,114,0.12); }
    [data-color="green"] .metric-icon-wrapper mat-icon { color: #38b272; }

    [data-color="orange"] .metric-icon-wrapper { background: rgba(246,173,85,0.12); }
    [data-color="orange"] .metric-icon-wrapper mat-icon { color: #f6ad55; }

    [data-color="red"] .metric-icon-wrapper { background: rgba(229,62,62,0.12); }
    [data-color="red"] .metric-icon-wrapper mat-icon { color: #e53e3e; }

    [data-color="purple"] .metric-icon-wrapper { background: rgba(128,90,213,0.12); }
    [data-color="purple"] .metric-icon-wrapper mat-icon { color: #805ad5; }
  `]
})
export class MetricCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: number | string;
  @Input({ required: true }) icon!: string;
  @Input() color: MetricCardColor = 'blue';
  @Input() subtitle?: string;
}
