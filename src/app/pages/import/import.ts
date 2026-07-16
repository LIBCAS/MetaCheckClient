import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { finalize } from 'rxjs';

import { Engine, MetacheckApiService } from '../../services/metacheck-api.service';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelect, MatSelectModule } from "@angular/material/select";
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

interface FolderFlatTreeNode {
  name: string;
  path: string;
  level: number;
  expandable: boolean;
  expanded: boolean;
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-import',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatTreeModule,
    MatFormFieldModule,
    MatSelectModule,
    RouterModule,
    TranslatePipe
],
  templateUrl: './import.html',
  styleUrl: './import.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Import implements OnInit {
  private readonly api = inject(MetacheckApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translator = inject(TranslateService);

  protected readonly folders = signal<FolderFlatTreeNode[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedPath = signal<string | null>(null);

  protected readonly levelAccessor = (node: FolderFlatTreeNode): number => node.level;
  protected readonly trackByPath = (_: number, node: FolderFlatTreeNode): string => node.path;
  protected readonly hasChild = (_: number, node: FolderFlatTreeNode): boolean => node.expandable;

  protected readonly engines = signal<Engine[]>([]);
  selectedEngine: Engine | null = null;

  ngOnInit(): void {
    this.loadRootFolders();
    this.getEngines();
  }

  protected refresh(): void {
    this.selectedPath.set(null);
    this.loadRootFolders();
  }

  protected selectFolder(node: FolderFlatTreeNode): void {
    this.selectedPath.set(node.path);
  }

  protected toggleFolder(node: FolderFlatTreeNode): void {
    if (node.loading) {
      return;
    }

    if (node.expanded) {
      this.collapseNode(node);
      return;
    }

    if (node.loaded) {
      this.expandNode(node, []);
      return;
    }

    this.loadChildren(node);
  }

  private loadChildren(node: FolderFlatTreeNode): void {
    if (node.loaded || node.loading) {
      return;
    }

    node.loading = true;
    node.error = null;
    this.refreshFolders();

    this.api
      .listFolder(node.path)
      .pipe(
        finalize(() => {
          node.loading = false;
          this.refreshFolders();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (folders) => {
          const children = this.toFolderNodes(node.path, node.level + 1, folders);
          node.loaded = true;
          node.expandable = children.length > 0;
          this.expandNode(node, children);
        },
        error: (error: unknown) => {
          node.loaded = false;
          node.error = this.describeError(error);
        },
      });
  }

  private getEngines() {

    this.api
      .getEngines()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (engines) => {
          this.engines.set(engines);
        },
        error: (error: unknown) => {
          this.engines.set([]);
          this.error.set(this.describeError(error));
        },
      });
    
  }

  private loadRootFolders(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .listFolder()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (folders) => {
          this.folders.set(this.toFolderNodes('', 0, folders));
        },
        error: (error: unknown) => {
          this.folders.set([]);
          this.error.set(this.describeError(error));
        },
      });
  }

  private toFolderNodes(
    parentPath: string,
    level: number,
    folders: readonly string[],
  ): FolderFlatTreeNode[] {
    return folders
      .filter((folder) => folder.trim() !== '')
      .map((folder) => {
        const path = this.resolvePath(parentPath, folder);

        return {
          name: this.folderName(path),
          path,
          level,
          expandable: true,
          expanded: false,
          loaded: false,
          loading: false,
          error: null,
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }));
  }

  private resolvePath(parentPath: string, folder: string): string {
    const normalizedFolder = folder.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

    if (!parentPath) {
      return normalizedFolder;
    }

    if (normalizedFolder.startsWith(`${parentPath}/`)) {
      return normalizedFolder;
    }

    return `${parentPath}/${normalizedFolder}`;
  }

  private folderName(path: string): string {
    return path.split('/').filter(Boolean).pop() ?? path;
  }

  private expandNode(node: FolderFlatTreeNode, children: readonly FolderFlatTreeNode[]): void {
    node.expanded = true;

    if (children.length > 0) {
      this.folders.update((folders) => {
        const nodeIndex = folders.findIndex((folder) => folder.path === node.path);

        if (nodeIndex === -1) {
          return [...folders];
        }

        return [
          ...folders.slice(0, nodeIndex + 1),
          ...children,
          ...folders.slice(nodeIndex + 1),
        ];
      });
      return;
    }

    this.refreshFolders();
  }

  private collapseNode(node: FolderFlatTreeNode): void {
    node.expanded = false;

    this.folders.update((folders) => {
      const nodeIndex = folders.findIndex((folder) => folder.path === node.path);

      if (nodeIndex === -1) {
        return [...folders];
      }

      const nextSiblingIndex = folders.findIndex(
        (folder, index) => index > nodeIndex && folder.level <= node.level,
      );
      const removeUntil = nextSiblingIndex === -1 ? folders.length : nextSiblingIndex;

      for (const descendant of folders.slice(nodeIndex + 1, removeUntil)) {
        descendant.expanded = false;
      }

      return [...folders.slice(0, nodeIndex + 1), ...folders.slice(removeUntil)];
    });
  }

  private refreshFolders(): void {
    this.folders.update((folders) => [...folders]);
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }

      return error.message;
    }

    return this.translator.instant('import.error.loadFolders');
  }

  addNewBatch() {
    if (!this.selectedPath()) {
      return
    }

    this.loading.set(true);

    this.api
      .addNewBatch({
        path: this.selectedPath()!,
        engine: this.selectedEngine?.name
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (batch) => {
          alert(this.translator.instant('import.message.batchAdded'));
          //this.refreshFolders();
        },
        error: (error: unknown) => {
            alert(this.describeError(error));
        },
      });
  }
}
