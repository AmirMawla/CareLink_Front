import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Renders child routes only (nested URLs under one segment). */
@Component({
  selector: 'app-router-outlet-host',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class RouterOutletHostComponent {}
