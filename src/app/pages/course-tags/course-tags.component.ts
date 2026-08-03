import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CourseTagOption, CourseTagService } from '../../services/CourseTag.service';

@Component({
  selector: 'app-course-tags', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule],
  templateUrl: './course-tags.component.html', styleUrl: './course-tags.component.scss',
})
export class CourseTagsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(CourseTagService);
  tags: CourseTagOption[] = []; editingId: string | null = null; message = ''; isSaving = false;
  form = this.fb.group({ value: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]], label: ['', Validators.required], sortOrder: [0, [Validators.required, Validators.min(0)]], isActive: [true] });
  ngOnInit() { this.load(); }
  load() { this.service.getTags(true).subscribe((tags) => this.tags = tags); }
  edit(tag: CourseTagOption) { this.editingId = tag._id || null; this.form.setValue({ value: tag.value, label: tag.label, sortOrder: tag.sortOrder || 0, isActive: tag.isActive !== false }); }
  cancel() { this.editingId = null; this.form.reset({ value: '', label: '', sortOrder: 0, isActive: true }); }
  save() {
    if (this.form.invalid || this.isSaving) { this.form.markAllAsTouched(); return; }
    this.isSaving = true; const raw = this.form.getRawValue();
    const payload = { value: raw.value!, label: raw.label!, sortOrder: Number(raw.sortOrder), isActive: !!raw.isActive };
    const request = this.editingId ? this.service.update(this.editingId, { label: payload.label, sortOrder: payload.sortOrder, isActive: payload.isActive }) : this.service.create(payload);
    request.subscribe({ next: () => { this.message = this.editingId ? 'Tag aggiornato.' : 'Tag creato.'; this.isSaving = false; this.cancel(); this.load(); }, error: (error) => { this.message = error?.error?.message || 'Operazione non riuscita.'; this.isSaving = false; } });
  }
  remove(tag: CourseTagOption) {
    if (!tag._id || !confirm(`Eliminare il tag “${tag.label}”?`)) return;
    this.service.delete(tag._id).subscribe({ next: () => { this.message = 'Tag eliminato.'; this.load(); }, error: (error) => this.message = error?.error?.message || 'Eliminazione non riuscita.' });
  }
}
