import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-nagora-logo',
  standalone: true,
  imports: [NgIf],
  template: `
    <svg [attr.viewBox]="withText ? '0 0 310 100' : '0 0 100 100'" role="img" [attr.aria-label]="ariaLabel">
      <g>
        <g [attr.fill]="negative ? '#FFFFFF' : '#1F2933'">
          <path d="M19 16h21v8H24v16h-8V19a3 3 0 0 1 3-3Z" />
          <path d="M60 16h21a3 3 0 0 1 3 3v21h-8V24H60v-8Z" />
          <path d="M16 60h8v16h16v8H19a3 3 0 0 1-3-3V60Z" />
          <path d="M76 60h8v21a3 3 0 0 1-3 3H60v-8h16V60Z" />
        </g>
        <circle cx="50" cy="50" r="11" fill="#E8623A" />
      </g>
      <text
        *ngIf="withText"
        x="112"
        y="63"
        [attr.fill]="negative ? '#FFFFFF' : '#1F2933'"
        font-family="Inter, sans-serif"
        font-size="39"
        font-weight="600"
        letter-spacing="-1.2">NAgorà</text>
    </svg>
  `,
  styles: [`:host,svg{display:block;width:100%;height:100%}`],
})
export class NagoraLogoComponent {
  @Input() negative = false;
  @Input() withText = false;
  @Input() ariaLabel = "NAgorà";
}
