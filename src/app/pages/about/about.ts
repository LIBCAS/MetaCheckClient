import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-about',
  imports: [MatCardModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {

  info = {
    "applicationName": "Metacheck",
    "version": "1.0.1",
    "database": "POSTGRES",
    "databaseSchemaVersion": "2",
    "status": "Active"
  };
}
